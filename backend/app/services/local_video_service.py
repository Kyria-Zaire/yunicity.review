"""Local Video domain service (FEATURE-CREATORS-V2 / C2-S1)."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.core.errors import AppError
from app.core.local_video_constants import (
    ALLOWED_LOCAL_VIDEO_CONTENT_TYPES,
    EXTENSION_BY_LOCAL_VIDEO_MIME,
    LOCAL_VIDEO_UPLOAD_RATE_LIMIT,
    LOCAL_VIDEO_UPLOAD_RATE_WINDOW_SECONDS,
    LocalVideoStatus,
    LocalVideoType,
    LocalVideoUploadStatus,
)
from app.models.local_video import LocalVideo, LocalVideoUpload
from app.models.neighborhood import Neighborhood
from app.schemas.local_video import (
    LocalVideoItem,
    LocalVideoPublishRequest,
    LocalVideoUploadInitRequest,
    LocalVideoUploadInitResponse,
)
from app.services.local_video.city_slug_resolver import resolve_local_video_city_slug
from app.services.local_video.processor import LocalVideoMediaProcessor, LocalVideoProcessResult
from app.services.local_video.storage import LocalVideoStorage, build_local_video_storage
from app.services.local_video.storage_keys import city_slug_from_storage_key


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

    async def store_binary_upload(self, upload_id: uuid.UUID, data: bytes) -> None:
        upload = await self._get_upload(upload_id)
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
            await self._session.commit()
            raise AppError(
                status_code=410,
                code="LOCAL_VIDEO_UPLOAD_EXPIRED",
                detail="Session d'upload expirée.",
            )
        if len(data) > self._settings.local_video_max_bytes:
            raise AppError(
                status_code=400,
                code="LOCAL_VIDEO_TOO_LARGE",
                detail="Fichier trop volumineux.",
            )
        if len(data) > upload.expected_size_bytes:
            raise AppError(
                status_code=400,
                code="LOCAL_VIDEO_SIZE_MISMATCH",
                detail="Taille du fichier supérieure à la déclaration.",
            )

        self._storage.write_bytes(upload.storage_key, data, upload.content_type)
        upload.status = LocalVideoUploadStatus.UPLOADED.value
        await self._session.commit()

    async def publish(
        self,
        user_id: uuid.UUID,
        payload: LocalVideoPublishRequest,
    ) -> LocalVideoItem:
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
        upload.status = LocalVideoUploadStatus.UPLOADED.value
        await self._session.flush()

        processor = LocalVideoMediaProcessor(self._settings, self._storage)
        try:
            result = processor.process(
                source_storage_key=upload.storage_key,
                city_slug=city_resolution.city_slug,
                video_id=video_id,
                content_type=upload.content_type,
            )
        except AppError as exc:
            video.status = LocalVideoStatus.FAILED.value
            video.processing_error = exc.detail
            upload.status = LocalVideoUploadStatus.FAILED.value
            await self._session.commit()
            await self._session.refresh(video)
            return self._to_item(video)

        self._apply_process_result(video, result)
        video.status = LocalVideoStatus.PUBLISHED.value
        video.published_at = datetime.now(tz=UTC)
        upload.status = LocalVideoUploadStatus.CONSUMED.value
        await self._session.commit()
        await self._session.refresh(video)
        return self._to_item(video)

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

    def _apply_process_result(self, video: LocalVideo, result: LocalVideoProcessResult) -> None:
        video.storage_key = result.source_storage_key
        video.media_url = self._storage.public_url(result.source_storage_key)
        video.thumbnail_url = self._storage.public_url(result.thumbnail_storage_key)
        video.duration_seconds = result.duration_seconds
        video.file_size_bytes = result.file_size_bytes
        video.mime_type = result.mime_type
        video.processing_error = None

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
            file_size_bytes=video.file_size_bytes,
            mime_type=video.mime_type,
            latitude=float(video.latitude) if video.latitude is not None else None,
            longitude=float(video.longitude) if video.longitude is not None else None,
            status=LocalVideoStatus(video.status),
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
