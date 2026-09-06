"""Sert les avatars et bannieres de profil (PROFILE-MEDIA-R2-COMPAT-04).

Ces medias appartiennent a un PROFIL PUBLIC : leur lecture est anonyme, par decision
produit. Ce qui est verrouille n'est donc pas l'identite du lecteur, mais le fait qu'un
objet ne soit servi que s'il est REELLEMENT reference par le profil demande -- sans quoi
la route deviendrait un lecteur d'objets arbitraires du bucket.

Deux origines coexistent :
- reference relative (`/api/v1/profile-media/...`) -> volume filesystem ;
- reference historique absolue (CDN) -> objet R2, lu COTE SERVEUR et relaye.

Le navigateur n'est jamais redirige vers le CDN : une redirection ferait sortir le media
du controle applicatif, ce que la forme absolue faisait deja.
"""

from __future__ import annotations

import uuid
from collections.abc import Iterator
from typing import Annotated

from fastapi import APIRouter, Depends
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.core.errors import AppError
from app.db.session import get_db
from app.repositories.profile_repository import ProfileRepository
from app.services.profile_media.filesystem_storage import ProfileMediaFilesystemStorage
from app.services.profile_media.storage_keys import (
    profile_media_api_url,
    profile_media_key_for,
)

router = APIRouter(tags=["profile-media"])

#: La cle est ECRASEE quand l'utilisateur change d'avatar (`profiles/{id}/avatar.jpg`) :
#: elle n'est pas immuable, donc pas de cache long. Public parce que le profil l'est,
#: revalide pour qu'un changement d'avatar soit visible rapidement.
_PUBLIC_MEDIA_HEADERS = {
    "Cache-Control": "public, max-age=300, must-revalidate",
    "X-Content-Type-Options": "nosniff",
}

_STREAM_CHUNK_BYTES = 64 * 1024


def _not_found() -> AppError:
    return AppError(
        status_code=404,
        code="PROFILE_MEDIA_NOT_FOUND",
        detail="Média introuvable.",
    )


def _referenced_url(
    profile: object, settings: Settings, user_id: uuid.UUID, filename: str
) -> str | None:
    """Renvoie la reference du profil qui designe CE fichier, sinon None.

    On ne tente jamais filesystem puis R2 a l'aveugle : c'est la ligne metier qui dit
    si le media existe, et sous quelle forme.
    """
    key = profile_media_key_for(user_id, filename)
    api_url = profile_media_api_url(settings.api_v1_prefix, key)
    legacy_base = settings.local_video_public_base_url.rstrip("/")
    legacy_url = f"{legacy_base}/{key}" if legacy_base else None

    for field in ("avatar_url", "banner_url"):
        stored = (getattr(profile, field, None) or "").strip()
        if not stored:
            continue
        if stored == api_url or (legacy_url and stored == legacy_url):
            return stored
    return None


def _stream(body: object) -> Iterator[bytes]:
    try:
        while True:
            chunk = body.read(_STREAM_CHUNK_BYTES)  # type: ignore[attr-defined]
            if not chunk:
                return
            yield chunk
    finally:
        close = getattr(body, "close", None)
        if callable(close):
            close()


@router.get("/profile-media/{user_id}/{filename}", response_model=None)
async def get_profile_media_file(
    user_id: uuid.UUID,
    filename: str,
    session: Annotated[AsyncSession, Depends(get_db)],
) -> FileResponse | StreamingResponse:
    settings = get_settings()

    if "/" in filename or "\\" in filename or filename.startswith("."):
        raise _not_found()

    profile = await ProfileRepository(session).get_by_user_id(user_id)
    if profile is None:
        raise _not_found()

    stored = _referenced_url(profile, settings, user_id, filename)
    if stored is None:
        # Objet peut-etre present dans le bucket, mais aucun profil ne le reference :
        # le servir ferait de cette route un lecteur d'objets arbitraires.
        raise _not_found()

    if stored.startswith("http://") or stored.startswith("https://"):
        # Reference historique : l'objet vit sur R2, on le relaie sans jamais rediriger.
        from app.services.profile_media.r2_storage import ProfileMediaR2Storage

        # Repli : R2 ne sert qu'a lire l'objet historique, le backend courant peut
        # tres bien etre `filesystem`.
        obj = ProfileMediaR2Storage(settings, validate_backend=False).open_object(
            profile_media_key_for(user_id, filename)
        )
        # Pas de `Content-Length` explicite : la reponse est chunked, et fixer une
        # longueur qui ne correspondrait pas au flux reel casserait la connexion.
        return StreamingResponse(
            _stream(obj.body),
            media_type=obj.content_type or "application/octet-stream",
            headers=dict(_PUBLIC_MEDIA_HEADERS),
        )

    if settings.profile_media_storage_backend != "filesystem":
        raise _not_found()
    path, content_type = ProfileMediaFilesystemStorage(settings).resolve_public_file(
        user_id, filename
    )
    return FileResponse(path=path, media_type=content_type, headers=_PUBLIC_MEDIA_HEADERS)
