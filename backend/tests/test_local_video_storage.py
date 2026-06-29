"""Local Video storage unit tests (VIDEO-01)."""

from __future__ import annotations

import uuid
from unittest.mock import MagicMock, patch

import pytest
from app.core.config import Settings, get_settings
from app.core.errors import AppError
from app.core.local_video_media_policy import (
    assert_file_size_within_limit,
    extension_for_content_type,
    normalize_content_type,
    validate_local_video_storage_config,
)
from app.services.local_video.filesystem_storage import FilesystemLocalVideoStorage
from app.services.local_video.r2_storage import R2LocalVideoStorage
from app.services.local_video.storage import build_local_video_storage


def _settings(**overrides: object) -> Settings:
    base: dict[str, object] = {
        "app_env": "dev",
        "local_video_storage_backend": "filesystem",
        "media_upload_dir": "uploads",
        "media_public_base_url": "http://localhost:8000",
        "local_video_max_bytes": 52_428_800,
        "local_video_max_duration_seconds": 60,
        "local_video_presigned_ttl_seconds": 900,
        "local_video_cdn_base_url": None,
        "local_video_r2_endpoint": None,
        "local_video_r2_access_key_id": None,
        "local_video_r2_secret_access_key": None,
        "local_video_r2_bucket": None,
        "local_video_default_city_slug": "reims",
    }
    base.update(overrides)
    return Settings.model_construct(**base)


class TestLocalVideoMediaPolicy:
    def test_normalize_content_type_accepts_mp4(self) -> None:
        assert normalize_content_type("video/mp4") == "video/mp4"
        assert normalize_content_type(" Video/MP4 ") == "video/mp4"

    def test_normalize_content_type_rejects_avi(self) -> None:
        with pytest.raises(ValueError, match="non supporté"):
            normalize_content_type("video/x-msvideo")

    def test_extension_for_content_type(self) -> None:
        assert extension_for_content_type("video/quicktime") == ".mov"
        assert extension_for_content_type("video/mp4") == ".mp4"

    def test_assert_file_size_within_limit(self) -> None:
        assert_file_size_within_limit(1024, max_bytes=4096)
        with pytest.raises(ValueError, match="volumineux"):
            assert_file_size_within_limit(5000, max_bytes=4096)

    def test_validate_filesystem_allowed_in_dev(self) -> None:
        warnings = validate_local_video_storage_config(_settings())
        assert warnings == []

    def test_validate_filesystem_forbidden_in_prod(self) -> None:
        with pytest.raises(AppError) as exc:
            validate_local_video_storage_config(
                _settings(app_env="prod", local_video_storage_backend="filesystem")
            )
        assert exc.value.code == "LOCAL_VIDEO_STORAGE_MISCONFIGURED"

    def test_validate_r2_requires_credentials(self) -> None:
        with pytest.raises(AppError) as exc:
            validate_local_video_storage_config(
                _settings(
                    local_video_storage_backend="r2",
                    local_video_r2_endpoint="https://example.r2.cloudflarestorage.com",
                    local_video_r2_bucket="bucket",
                )
            )
        assert exc.value.code == "LOCAL_VIDEO_R2_MISCONFIGURED"

    def test_validate_r2_requires_cdn_in_recette(self) -> None:
        with pytest.raises(AppError) as exc:
            validate_local_video_storage_config(
                _settings(
                    app_env="recette",
                    local_video_storage_backend="r2",
                    local_video_r2_endpoint="https://example.r2.cloudflarestorage.com",
                    local_video_r2_bucket="bucket",
                    local_video_r2_access_key_id="key",
                    local_video_r2_secret_access_key="secret",
                )
            )
        assert exc.value.code == "LOCAL_VIDEO_CDN_MISCONFIGURED"

    def test_validate_r2_ok_with_cdn(self) -> None:
        warnings = validate_local_video_storage_config(
            _settings(
                app_env="recette",
                local_video_storage_backend="r2",
                local_video_r2_endpoint="https://example.r2.cloudflarestorage.com",
                local_video_r2_bucket="bucket",
                local_video_r2_access_key_id="key",
                local_video_r2_secret_access_key="secret",
                local_video_cdn_base_url="https://media.recette.yunicity.fr",
            )
        )
        assert warnings == []


class TestFilesystemLocalVideoStorage:
    def test_public_url_uses_media_prefix_without_duplicate(self, tmp_path) -> None:
        settings = _settings(media_upload_dir=str(tmp_path))
        storage = FilesystemLocalVideoStorage(settings)
        key = "local-video/reims/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/source.mp4"
        assert storage.public_url(key) == (
            "http://localhost:8000/media/local-video/reims/"
            "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/source.mp4"
        )

    def test_build_source_key_layout(self, tmp_path) -> None:
        settings = _settings(media_upload_dir=str(tmp_path))
        storage = FilesystemLocalVideoStorage(settings)
        video_id = uuid.uuid4()
        key = storage.build_source_key(city_slug="reims", video_id=video_id, ext=".mp4")
        assert key == f"local-video/reims/{video_id}/source.mp4"


class TestR2LocalVideoStorage:
    def test_presigned_includes_content_length(self) -> None:
        settings = _settings(
            local_video_storage_backend="r2",
            local_video_r2_endpoint="https://example.r2.cloudflarestorage.com",
            local_video_r2_bucket="bucket",
            local_video_r2_access_key_id="key",
            local_video_r2_secret_access_key="secret",
            local_video_cdn_base_url="https://media.dev.yunicity.fr",
        )
        mock_client = MagicMock()
        mock_client.generate_presigned_url.return_value = "https://signed.example/put"
        with patch("app.services.local_video.r2_storage.boto3.client", return_value=mock_client):
            storage = R2LocalVideoStorage(settings)
            upload_id = uuid.uuid4()
            result = storage.create_presigned_upload(
                upload_id=upload_id,
                storage_key="local-video/reims/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/source.mp4",
                content_type="video/mp4",
                content_length=4096,
                ttl_seconds=900,
            )
        assert result.upload_url == "https://signed.example/put"
        params = mock_client.generate_presigned_url.call_args.kwargs["Params"]
        assert params["ContentLength"] == 4096
        assert params["ContentType"] == "video/mp4"

    def test_public_url_uses_cdn_base(self) -> None:
        settings = _settings(
            local_video_storage_backend="r2",
            local_video_r2_endpoint="https://example.r2.cloudflarestorage.com",
            local_video_r2_bucket="bucket",
            local_video_r2_access_key_id="key",
            local_video_r2_secret_access_key="secret",
            local_video_cdn_base_url="https://media.dev.yunicity.fr",
        )
        with patch("app.services.local_video.r2_storage.boto3.client", return_value=MagicMock()):
            storage = R2LocalVideoStorage(settings)
        key = "local-video/paris/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/source.mp4"
        assert storage.public_url(key) == f"https://media.dev.yunicity.fr/{key}"


class TestStorageFactory:
    def test_build_filesystem_backend(self, tmp_path, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setenv("LOCAL_VIDEO_STORAGE_BACKEND", "filesystem")
        monkeypatch.setenv("MEDIA_UPLOAD_DIR", str(tmp_path))
        get_settings.cache_clear()
        storage = build_local_video_storage(get_settings())
        assert isinstance(storage, FilesystemLocalVideoStorage)
        get_settings.cache_clear()

    def test_build_r2_backend(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setenv("LOCAL_VIDEO_STORAGE_BACKEND", "r2")
        monkeypatch.setenv(
            "LOCAL_VIDEO_R2_ENDPOINT",
            "https://example.r2.cloudflarestorage.com",
        )
        monkeypatch.setenv("LOCAL_VIDEO_R2_BUCKET", "bucket")
        monkeypatch.setenv("LOCAL_VIDEO_R2_ACCESS_KEY_ID", "key")
        monkeypatch.setenv("LOCAL_VIDEO_R2_SECRET_ACCESS_KEY", "secret")
        get_settings.cache_clear()
        with patch("app.services.local_video.r2_storage.boto3.client", return_value=MagicMock()):
            storage = build_local_video_storage(get_settings())
        assert isinstance(storage, R2LocalVideoStorage)
        get_settings.cache_clear()
