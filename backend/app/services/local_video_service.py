"""Local Video domain service (FEATURE-CREATORS-V2 / C2-S1)."""

from __future__ import annotations

import errno
import os
import uuid
from collections.abc import AsyncIterator
from datetime import UTC, datetime, timedelta
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.core.errors import AppError
from app.core.local_video_constants import (
    ALLOWED_LOCAL_VIDEO_CONTENT_TYPES,
    EXTENSION_BY_LOCAL_VIDEO_MIME,
    LOCAL_VIDEO_MAGIC_SAMPLE_BYTES,
    LOCAL_VIDEO_UPLOAD_RATE_LIMIT,
    LOCAL_VIDEO_UPLOAD_RATE_WINDOW_SECONDS,
    LocalVideoProcessingStatus,
    LocalVideoStatus,
    LocalVideoType,
    LocalVideoUploadStatus,
)
from app.core.local_video_duration_policy import max_duration_for_roles
from app.core.local_video_media_policy import validate_local_video_content_bytes
from app.models.local_video import LocalVideo, LocalVideoUpload
from app.models.neighborhood import Neighborhood
from app.schemas.local_video import (
    LocalVideoItem,
    LocalVideoPublishAcceptedResponse,
    LocalVideoPublishRequest,
    LocalVideoUploadInitRequest,
    LocalVideoUploadInitResponse,
)
from app.services.local_video.city_slug_resolver import resolve_local_video_city_slug
from app.services.local_video.filesystem_storage import FilesystemLocalVideoStorage
from app.services.local_video.job_queue import enqueue_local_video_processing
from app.services.local_video.processing_status import map_video_processing_status
from app.services.local_video.storage import LocalVideoStorage, build_local_video_storage
from app.services.local_video.storage_keys import city_slug_from_storage_key
from app.services.local_video.upload_capacity import (
    FILESYSTEM_UPLOAD_CAPACITY,
    storage_insufficient_error,
)
from app.services.rbac_service import RbacService


class LocalVideoService:
    def __init__(self, session: AsyncSession, settings: Settings) -> None:
        self._session = session
        self._settings = settings
        self._storage: LocalVideoStorage = build_local_video_storage(settings)

    async def init_upload(
        self,
        user_id: uuid.UUID,
        payload: LocalVideoUploadInitRequest,
    ) -> LocalVideoUploadInitResponse:
        max_bytes = self._settings.local_video_max_bytes
        if payload.file_size_bytes > max_bytes:
            raise AppError(
                status_code=400,
                code="LOCAL_VIDEO_TOO_LARGE",
                detail="Fichier trop volumineux.",
            )
        if payload.content_type not in ALLOWED_LOCAL_VIDEO_CONTENT_TYPES:
            raise AppError(
                status_code=400,
                code="LOCAL_VIDEO_INVALID_TYPE",
                detail="Type de fichier vidéo non supporté.",
            )

        city_resolution = await resolve_local_video_city_slug(
            self._session,
            self._settings,
            city=payload.city,
            neighborhood_id=payload.neighborhood_id,
            organization_id=payload.organization_id,
        )

        ext = EXTENSION_BY_LOCAL_VIDEO_MIME.get(payload.content_type, ".mp4")
        upload_id = uuid.uuid4()
        storage_key = self._storage.build_source_key(
            city_slug=city_resolution.city_slug,
            video_id=upload_id,
            ext=ext,
        )
        ttl = self._settings.local_video_presigned_ttl_seconds
        expires_at = datetime.now(tz=UTC) + timedelta(seconds=ttl)
        presigned = self._storage.create_presigned_upload(
            upload_id=upload_id,
            storage_key=storage_key,
            content_type=payload.content_type,
            content_length=payload.file_size_bytes,
            ttl_seconds=ttl,
        )

        upload = LocalVideoUpload(
            id=upload_id,
            author_user_id=user_id,
            storage_key=storage_key,
            content_type=payload.content_type,
            expected_size_bytes=payload.file_size_bytes,
            status=LocalVideoUploadStatus.PENDING.value,
            expires_at=expires_at,
        )
        self._session.add(upload)
        await self._session.commit()

        return LocalVideoUploadInitResponse(
            upload_id=upload_id,
            presigned_url=presigned.upload_url,
            storage_key=storage_key,
            expires_at=presigned.expires_at,
            upload_method=presigned.upload_method,
            upload_headers=presigned.upload_headers,
        )

    async def store_streamed_upload(
        self,
        upload_id: uuid.UUID,
        chunks: AsyncIterator[bytes],
        *,
        declared_length: int | None,
    ) -> None:
        """Recoit une source video PAR BLOCS, sans jamais la tenir entiere.

        L'ancienne version appelait `await request.body()` : le corps complet
        etait alloue, PUIS compare a la limite. Un client pouvait donc faire
        allouer 2 Go a l'API pour se voir refuser un fichier de 200 Mo — la
        limite ne protegeait que le disque, jamais la memoire.

        Ici la memoire reste bornee a un bloc, quel que soit ce qu'envoie le
        client, et la lecture s'arrete DES le depassement plutot qu'a la fin.
        """
        upload = await self._get_upload(upload_id)
        self._assert_upload_writable(upload)
        limite = min(self._settings.local_video_max_bytes, upload.expected_size_bytes)

        # Refus AVANT toute lecture quand le client annonce deja trop gros.
        # `Content-Length` n'est pas une preuve — il peut mentir ou manquer —
        # mais quand il est honnete, il evite de lire pour rien.
        if declared_length is not None and declared_length > limite:
            raise self._too_large(declared_length, limite)

        # `mkstemp` rend un descripteur DEJA ouvert : on ecrit dedans plutot que
        # de rouvrir le chemin. Rouvrir laissait le premier descripteur ouvert a
        # chaque envoi — une fuite, et sous Windows un temporaire impossible a
        # supprimer ensuite.
        if not isinstance(self._storage, FilesystemLocalVideoStorage):
            raise AppError(
                status_code=503,
                code="LOCAL_VIDEO_BINARY_ENDPOINT_UNAVAILABLE",
                detail="Upload direct indisponible sur cet environnement.",
            )
        expected_bytes = (
            declared_length
            if declared_length is not None
            else self._settings.local_video_max_bytes
        )
        lease = FILESYSTEM_UPLOAD_CAPACITY.acquire(
            self._storage.root,
            expected_bytes=expected_bytes,
            minimum_free_bytes=self._settings.local_video_min_free_bytes,
            concurrency_limit=self._settings.local_video_filesystem_concurrency,
        )
        destination: Path | None = None
        promoted = False
        recu = 0
        entete = b""
        try:
            descripteur, destination = self._storage.create_upload_temp()
            with os.fdopen(descripteur, "wb") as handle:
                async for bloc in chunks:
                    if not bloc:
                        continue
                    recu += len(bloc)
                    if recu > limite:
                        # Coupure immediate : on ne lit pas le reste du flux.
                        raise self._too_large(recu, limite)
                    lease.ensure_reserved(recu)
                    if len(entete) < LOCAL_VIDEO_MAGIC_SAMPLE_BYTES:
                        entete += bloc[: LOCAL_VIDEO_MAGIC_SAMPLE_BYTES - len(entete)]
                    handle.write(bloc)

            if recu == 0:
                raise AppError(
                    status_code=400,
                    code="LOCAL_VIDEO_EMPTY",
                    detail="Fichier vide.",
                )
            # L'entete suffit a reconnaitre le conteneur : valider ici evite de
            # promouvoir un fichier que le pipeline refusera de toute facon.
            validate_local_video_content_bytes(upload.content_type, entete)

            self._storage.promote_file(destination, upload.storage_key)
            promoted = True
            upload.status = LocalVideoUploadStatus.UPLOADED.value
            try:
                await self._session.commit()
            except BaseException:
                upload.status = LocalVideoUploadStatus.PENDING.value
                self._storage.remove_object(upload.storage_key)
                promoted = False
                raise
        except OSError as exc:
            if exc.errno == errno.ENOSPC:
                if promoted:
                    self._storage.remove_object(upload.storage_key)
                upload.status = LocalVideoUploadStatus.PENDING.value
                raise storage_insufficient_error() from exc
            raise
        finally:
            # Client deconnecte, flux interrompu, validation refusee, erreur
            # disque : aucun temporaire ne doit survivre.
            if destination is not None:
                destination.unlink(missing_ok=True)
            lease.release()

    def _too_large(self, taille: int, limite: int) -> AppError:
        return AppError(
            status_code=413,
            code="LOCAL_VIDEO_TOO_LARGE",
            detail=(
                f"Fichier trop volumineux : {taille // (1024 * 1024)} Mo pour une limite de "
                f"{limite // (1024 * 1024)} Mo. Filmez plus court ou baissez la qualite."
            ),
            metadata={"size_bytes": taille, "max_bytes": limite},
        )

    def _assert_upload_writable(self, upload: LocalVideoUpload) -> None:
        if upload.status not in {
            LocalVideoUploadStatus.PENDING.value,
            LocalVideoUploadStatus.UPLOADED.value,
        }:
            raise AppError(
                status_code=409,
                code="LOCAL_VIDEO_UPLOAD_NOT_AVAILABLE",
                detail="Session d'upload indisponible.",
            )
        if upload.expires_at <= datetime.now(tz=UTC):
            upload.status = LocalVideoUploadStatus.EXPIRED.value
            raise AppError(
                status_code=410,
                code="LOCAL_VIDEO_UPLOAD_EXPIRED",
                detail="Session d'upload expirée.",
            )

    async def publish(
        self,
        user_id: uuid.UUID,
        payload: LocalVideoPublishRequest,
    ) -> LocalVideoPublishAcceptedResponse:
        upload = await self._get_upload(payload.upload_id)
        if upload.author_user_id != user_id:
            raise AppError(
                status_code=403,
                code="LOCAL_VIDEO_FORBIDDEN",
                detail="Accès refusé.",
            )
        if upload.status == LocalVideoUploadStatus.CONSUMED.value:
            raise AppError(
                status_code=409,
                code="LOCAL_VIDEO_UPLOAD_ALREADY_USED",
                detail="Cette vidéo a déjà été publiée.",
            )
        if upload.expires_at <= datetime.now(tz=UTC):
            upload.status = LocalVideoUploadStatus.EXPIRED.value
            await self._session.commit()
            raise AppError(
                status_code=410,
                code="LOCAL_VIDEO_UPLOAD_EXPIRED",
                detail="Session d'upload expirée.",
            )

        head = self._storage.head_object(upload.storage_key)
        if head is None or head.content_length <= 0:
            raise AppError(
                status_code=400,
                code="LOCAL_VIDEO_UPLOAD_MISSING",
                detail="Fichier vidéo introuvable. Terminez l'upload avant publication.",
            )
        if head.content_length > self._settings.local_video_max_bytes:
            raise AppError(
                status_code=400,
                code="LOCAL_VIDEO_TOO_LARGE",
                detail="Fichier trop volumineux.",
            )

        neighborhood = await self._session.get(Neighborhood, payload.neighborhood_id)
        if neighborhood is None or not neighborhood.is_active:
            raise AppError(
                status_code=400,
                code="LOCAL_VIDEO_INVALID_NEIGHBORHOOD",
                detail="Quartier invalide.",
            )
        if neighborhood.city.casefold() != payload.city.casefold():
            raise AppError(
                status_code=400,
                code="LOCAL_VIDEO_CITY_MISMATCH",
                detail="Quartier incompatible avec la ville.",
            )

        existing = await self._session.execute(
            select(LocalVideo.id).where(LocalVideo.upload_id == upload.id).limit(1)
        )
        if existing.scalar_one_or_none() is not None:
            raise AppError(
                status_code=409,
                code="LOCAL_VIDEO_UPLOAD_ALREADY_USED",
                detail="Cette vidéo a déjà été publiée.",
            )

        city_resolution = await resolve_local_video_city_slug(
            self._session,
            self._settings,
            city=payload.city,
            neighborhood_id=payload.neighborhood_id,
            organization_id=payload.organization_id,
        )
        init_city_slug = city_slug_from_storage_key(upload.storage_key)
        if init_city_slug is None or init_city_slug != city_resolution.city_slug:
            raise AppError(
                status_code=400,
                code="LOCAL_VIDEO_CITY_SLUG_MISMATCH",
                detail="Territoire incompatible avec la session d'upload.",
            )

        video_id = upload.id
        video = LocalVideo(
            id=video_id,
            author_user_id=user_id,
            upload_id=upload.id,
            city=payload.city.strip(),
            neighborhood_id=payload.neighborhood_id,
            video_type=payload.video_type.value,
            title=payload.title,
            description=payload.description,
            cultural_place_id=payload.cultural_place_id,
            local_event_id=payload.local_event_id,
            tribe_id=payload.tribe_id,
            organization_id=payload.organization_id,
            storage_key=upload.storage_key,
            media_url="",
            thumbnail_url="",
            duration_seconds=0,
            file_size_bytes=head.content_length,
            mime_type=upload.content_type,
            latitude=payload.latitude,
            longitude=payload.longitude,
            status=LocalVideoStatus.PROCESSING.value,
        )
        self._session.add(video)
        upload.status = LocalVideoUploadStatus.CONSUMED.value
        await self._session.commit()
        await self._session.refresh(video)

        # VIDEO-04D — la limite est FIGEE ici, a partir des roles persistes de
        # l'auteur authentifie, puis transmise au job. ARQ rejoue un retry avec les
        # memes arguments : la politique appliquee reste donc identique d'un essai a
        # l'autre, meme si le role change entre-temps.
        rbac = await RbacService(self._session).get_user_rbac_context(user_id)
        max_duration_seconds = max_duration_for_roles(rbac.roles)
        job_id = await enqueue_local_video_processing(
            video_id,
            max_duration_seconds=max_duration_seconds,
        )
        return LocalVideoPublishAcceptedResponse(
            id=video.id,
            status=LocalVideoStatus(video.status),
            processing_status=LocalVideoProcessingStatus.PROCESSING,
            job_id=job_id,
        )

    async def get_video(self, user_id: uuid.UUID, video_id: uuid.UUID) -> LocalVideoItem:
        video = await self._session.get(LocalVideo, video_id)
        if video is None:
            raise AppError(
                status_code=404,
                code="LOCAL_VIDEO_NOT_FOUND",
                detail="Vidéo introuvable.",
            )
        if video.author_user_id != user_id and video.status != LocalVideoStatus.PUBLISHED.value:
            raise AppError(
                status_code=404,
                code="LOCAL_VIDEO_NOT_FOUND",
                detail="Vidéo introuvable.",
            )
        if video.status in {LocalVideoStatus.HIDDEN.value, LocalVideoStatus.DELETED.value}:
            if video.author_user_id != user_id:
                raise AppError(
                    status_code=404,
                    code="LOCAL_VIDEO_NOT_FOUND",
                    detail="Vidéo introuvable.",
                )
        return self._to_item(video)

    async def _get_upload(self, upload_id: uuid.UUID) -> LocalVideoUpload:
        upload = await self._session.get(LocalVideoUpload, upload_id)
        if upload is None:
            raise AppError(
                status_code=404,
                code="LOCAL_VIDEO_UPLOAD_NOT_FOUND",
                detail="Session d'upload introuvable.",
            )
        return upload

    @staticmethod
    def _to_item(video: LocalVideo) -> LocalVideoItem:
        return LocalVideoItem(
            id=video.id,
            author_user_id=video.author_user_id,
            city=video.city,
            neighborhood_id=video.neighborhood_id,
            video_type=LocalVideoType(video.video_type),
            title=video.title,
            description=video.description,
            cultural_place_id=video.cultural_place_id,
            local_event_id=video.local_event_id,
            tribe_id=video.tribe_id,
            organization_id=video.organization_id,
            media_url=video.media_url,
            thumbnail_url=video.thumbnail_url,
            duration_seconds=float(video.duration_seconds),
            media_width=video.media_width,
            media_height=video.media_height,
            file_size_bytes=video.file_size_bytes,
            mime_type=video.mime_type,
            latitude=float(video.latitude) if video.latitude is not None else None,
            longitude=float(video.longitude) if video.longitude is not None else None,
            status=LocalVideoStatus(video.status),
            processing_status=map_video_processing_status(video.status),
            processing_error=video.processing_error,
            published_at=video.published_at,
            created_at=video.created_at,
        )


def upload_rate_limit_key(user_id: uuid.UUID) -> str:
    return f"rl:local-video:upload-init:{user_id}"


def publish_rate_limit_key(user_id: uuid.UUID) -> str:
    return f"rl:local-video:publish:{user_id}"


UPLOAD_INIT_RATE_LIMIT = LOCAL_VIDEO_UPLOAD_RATE_LIMIT
UPLOAD_INIT_RATE_WINDOW = LOCAL_VIDEO_UPLOAD_RATE_WINDOW_SECONDS
PUBLISH_RATE_LIMIT = 20
PUBLISH_RATE_WINDOW = 86_400
