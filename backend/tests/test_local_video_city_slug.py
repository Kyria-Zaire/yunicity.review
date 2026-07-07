"""Local Video city_slug resolution and storage keys (VIDEO-01B)."""

from __future__ import annotations

import uuid
from pathlib import Path
from typing import Any
from unittest.mock import MagicMock, patch

import pytest
from app.core.config import Settings
from app.core.errors import AppError
from app.services.local_video.city_slug_resolver import (
    normalize_city_slug,
    resolve_local_video_city_slug,
)
from app.services.local_video.filesystem_storage import FilesystemLocalVideoStorage
from app.services.local_video.r2_storage import R2LocalVideoStorage
from app.services.local_video.storage_keys import (
    build_processed_key,
    build_source_upload_key,
    build_thumbnail_key,
)


def _settings(**overrides: Any) -> Settings:
    base: dict[str, Any] = {
        "app_env": "dev",
        "local_video_storage_backend": "filesystem",
        "local_video_default_city_slug": "reims",
        "media_upload_dir": "uploads",
        "media_public_base_url": "http://localhost:8000",
    }
    base.update(overrides)
    return Settings.model_construct(**base)


class TestNormalizeCitySlug:
    @pytest.mark.parametrize(
        ("city", "expected"),
        [
            ("Reims", "reims"),
            ("Paris", "paris"),
            ("Lyon", "lyon"),
            ("Saint-Étienne", "saint-etienne"),
        ],
    )
    def test_normalizes_display_names(self, city: str, expected: str) -> None:
        assert normalize_city_slug(city) == expected


class TestStorageKeyLayout:
    @pytest.mark.parametrize("city_slug", ["reims", "paris", "lyon"])
    def test_source_upload_key(self, city_slug: str) -> None:
        video_id = uuid.UUID("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee")
        assert (
            build_source_upload_key(city_slug=city_slug, video_id=video_id, ext=".mp4")
            == f"local-video/{city_slug}/{video_id}/source.mp4"
        )

    @pytest.mark.parametrize("city_slug", ["reims", "paris", "lyon"])
    def test_processed_and_thumbnail_keys(self, city_slug: str) -> None:
        video_id = uuid.UUID("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee")
        assert (
            build_processed_key(city_slug=city_slug, video_id=video_id)
            == f"local-video/{city_slug}/{video_id}/processed.mp4"
        )
        assert (
            build_thumbnail_key(city_slug=city_slug, video_id=video_id)
            == f"local-video/{city_slug}/{video_id}/thumbnail.jpg"
        )

    @pytest.mark.parametrize("city_slug", ["reims", "paris", "lyon"])
    def test_filesystem_and_r2_share_layout(self, city_slug: str, tmp_path: Path) -> None:
        video_id = uuid.uuid4()
        fs = FilesystemLocalVideoStorage(_settings(media_upload_dir=str(tmp_path)))
        with patch("app.services.local_video.r2_storage.boto3.client", return_value=MagicMock()):
            r2 = R2LocalVideoStorage(
                _settings(
                    local_video_storage_backend="r2",
                    local_video_r2_endpoint="https://example.r2.cloudflarestorage.com",
                    local_video_r2_bucket="bucket",
                    local_video_r2_access_key_id="key",
                    local_video_r2_secret_access_key="secret",
                )
            )
        assert fs.build_source_key(city_slug=city_slug, video_id=video_id, ext=".mp4") == (
            r2.build_source_key(city_slug=city_slug, video_id=video_id, ext=".mp4")
        )
        assert fs.build_processed_key(city_slug=city_slug, video_id=video_id) == (
            r2.build_processed_key(city_slug=city_slug, video_id=video_id)
        )
        assert fs.build_thumbnail_key(city_slug=city_slug, video_id=video_id) == (
            r2.build_thumbnail_key(city_slug=city_slug, video_id=video_id)
        )


class TestCitySlugResolver:
    @pytest.mark.asyncio
    async def test_resolves_from_city(self) -> None:
        session = MagicMock()
        resolution = await resolve_local_video_city_slug(
            session,
            _settings(),
            city="Paris",
        )
        assert resolution.city_slug == "paris"
        assert resolution.used_fallback is False
        assert resolution.source == "video"

    @pytest.mark.asyncio
    async def test_dev_fallback_with_warning(self, caplog: pytest.LogCaptureFixture) -> None:
        session = MagicMock()
        with caplog.at_level("WARNING"):
            resolution = await resolve_local_video_city_slug(
                session,
                _settings(app_env="dev"),
            )
        assert resolution.city_slug == "reims"
        assert resolution.used_fallback is True
        assert "local_video_city_slug_fallback" in caplog.text

    @pytest.mark.asyncio
    async def test_prod_requires_territory(self) -> None:
        session = MagicMock()
        with pytest.raises(AppError) as exc:
            await resolve_local_video_city_slug(
                session,
                _settings(app_env="prod"),
            )
        assert exc.value.code == "LOCAL_VIDEO_CITY_SLUG_REQUIRED"

    @pytest.mark.asyncio
    async def test_preprod_requires_territory(self) -> None:
        session = MagicMock()
        with pytest.raises(AppError) as exc:
            await resolve_local_video_city_slug(
                session,
                _settings(app_env="preprod"),
            )
        assert exc.value.code == "LOCAL_VIDEO_CITY_SLUG_REQUIRED"
