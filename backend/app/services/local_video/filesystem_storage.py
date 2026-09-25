"""Filesystem fallback storage for Local Video dev/CI."""

from __future__ import annotations

import os
import shutil
import tempfile
import uuid
from collections.abc import Callable
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import IO

from app.core.config import Settings
from app.core.errors import AppError
from app.core.local_video_constants import LOCAL_VIDEO_UPLOAD_CHUNK_BYTES
from app.core.media_root import MEDIA_URL_PREFIX
from app.services.local_video.storage import ObjectHead, PresignedUpload
from app.services.local_video.storage_keys import (
    build_processed_key,
    build_source_upload_key,
    build_thumbnail_key,
)


class FilesystemLocalVideoStorage:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._root = Path(settings.media_upload_dir)
        self._root.mkdir(parents=True, exist_ok=True)
        self._api_base = settings.media_public_base_url.rstrip("/")

    def _path_for_key(self, storage_key: str) -> Path:
        """Résout une clé DANS la racine média, ou échoue.

        L'ancienne version retirait les `..` par remplacement de chaîne : une liste noire,
        qui ne dit rien du chemin final. On résout puis on vérifie l'appartenance à la
        racine — même garde que `profile_media` et `story_media`.
        """
        candidate = (self._root / storage_key.lstrip("/")).resolve()
        try:
            candidate.relative_to(self._root.resolve())
        except ValueError as exc:
            raise AppError(
                status_code=400,
                code="LOCAL_VIDEO_STORAGE_KEY_INVALID",
                detail="Clé de stockage invalide.",
            ) from exc
        return candidate

    def build_source_key(self, *, city_slug: str, video_id: uuid.UUID, ext: str) -> str:
        return build_source_upload_key(city_slug=city_slug, video_id=video_id, ext=ext)

    def build_processed_key(self, *, city_slug: str, video_id: uuid.UUID) -> str:
        return build_processed_key(city_slug=city_slug, video_id=video_id)

    def build_thumbnail_key(self, *, city_slug: str, video_id: uuid.UUID) -> str:
        return build_thumbnail_key(city_slug=city_slug, video_id=video_id)

    def create_presigned_upload(
        self,
        *,
        upload_id: uuid.UUID,
        storage_key: str,
        content_type: str,
        content_length: int,
        ttl_seconds: int,
    ) -> PresignedUpload:
        del content_length
        expires_at = datetime.now(tz=UTC) + timedelta(seconds=ttl_seconds)
        prefix = self._settings.api_v1_prefix.rstrip("/")
        upload_url = f"{self._api_base}{prefix}/local-videos/uploads/{upload_id}/binary"
        return PresignedUpload(
            storage_key=storage_key,
            upload_url=upload_url,
            upload_method="PUT",
            upload_headers={"Content-Type": content_type},
            expires_at=expires_at,
        )

    def head_object(self, storage_key: str) -> ObjectHead | None:
        path = self._path_for_key(storage_key)
        if not path.is_file():
            return None
        return ObjectHead(content_length=path.stat().st_size, content_type=None)

    def public_url(self, storage_key: str) -> str:
        """URL publique canonique d'une cle -- jamais un chemin de fichier.

        L'ancienne version retirait les `..` par remplacement de chaine, la meme liste
        noire que `_path_for_key` avait deja abandonnee. On valide desormais la cle avec
        la MEME garde de confinement, puis on reconstruit l'URL a partir de segments
        normalises : pas de `//`, pas de segment vide, pas de chemin Windows.
        """
        # Confinement : une cle qui sortirait de la racine ne doit pas produire d'URL.
        self._path_for_key(storage_key)
        segments = [part for part in storage_key.replace("\\", "/").split("/") if part]
        base = self._api_base.rstrip("/")
        return f"{base}/{MEDIA_URL_PREFIX}/{'/'.join(segments)}"

    def write_bytes(self, storage_key: str, data: bytes, content_type: str) -> None:
        """Ecriture d'un petit objet deja en memoire — vignettes, fixtures.

        N'est PAS le chemin des videos : une source de 200 Mo arrive par blocs
        et se promeut avec `promote_file`.
        """
        del content_type
        path = self._path_for_key(storage_key)
        path.parent.mkdir(parents=True, exist_ok=True)
        self._replace_atomically(path, lambda handle: handle.write(data))

    def promote_file(self, temp_path: Path, storage_key: str) -> None:
        """Installe un fichier deja ecrit a sa cle definitive, sans le relire.

        `os.replace` sur le meme systeme de fichiers est atomique : aucun
        lecteur ne peut observer une destination a moitie ecrite, et un echec
        laisse l'ancienne version intacte plutot qu'un fichier tronque.
        """
        dest = self._path_for_key(storage_key)
        dest.parent.mkdir(parents=True, exist_ok=True)
        try:
            os.replace(temp_path, dest)
        except OSError:
            # Temporaire sur un autre volume : on recopie par blocs, puis on
            # remplace. La memoire reste bornee au bloc dans les deux cas.
            self._copy_streamed(temp_path, dest)
            temp_path.unlink(missing_ok=True)

    def read_to_path(self, storage_key: str, dest: Path) -> None:
        src = self._path_for_key(storage_key)
        dest.parent.mkdir(parents=True, exist_ok=True)
        self._copy_streamed(src, dest)

    def upload_file(self, local_path: Path, storage_key: str, content_type: str) -> None:
        del content_type
        dest = self._path_for_key(storage_key)
        dest.parent.mkdir(parents=True, exist_ok=True)
        self._copy_streamed(local_path, dest)

    def _copy_streamed(self, source: Path, dest: Path) -> None:
        """Copie par blocs puis remplacement atomique.

        `dest.write_bytes(source.read_bytes())` allouait le fichier ENTIER et,
        en cas d'echec a mi-parcours, laissait une destination partielle que
        rien ne distinguait d'un fichier valide.
        """
        with source.open("rb") as entree:
            self._replace_atomically(
                dest,
                lambda handle: shutil.copyfileobj(entree, handle, LOCAL_VIDEO_UPLOAD_CHUNK_BYTES),
            )

    def _replace_atomically(self, dest: Path, ecrire: Callable[[IO[bytes]], object]) -> None:
        # Le temporaire est cree DANS le dossier de destination : `os.replace`
        # n'est atomique qu'au sein d'un meme systeme de fichiers.
        descripteur, brut = tempfile.mkstemp(dir=dest.parent, prefix=".upload-", suffix=".part")
        temporaire = Path(brut)
        try:
            with os.fdopen(descripteur, "wb") as handle:
                ecrire(handle)
                handle.flush()
                os.fsync(handle.fileno())
            os.replace(temporaire, dest)
        except BaseException:
            temporaire.unlink(missing_ok=True)
            raise
