"""Profile media R2 storage unit tests (PILOT-FIX-02)."""

from __future__ import annotations

import uuid
from typing import Any
from unittest.mock import MagicMock, patch

import pytest
from app.core.config import Settings
from app.core.errors import AppError
from app.core.profile_media_constants import ProfileMediaKind
from app.core.profile_media_policy import validate_profile_media_storage_config
from app.services.profile_media.r2_storage import ProfileMediaR2Storage
from app.services.profile_media.storage_keys import build_profile_media_key

from tests.media_fixtures import MINIMAL_JPEG_BYTES


def _settings(**overrides: Any) -> Settings:
    base: dict[str, Any] = {
        "app_env": "recette",
        "profile_media_storage_backend": "r2",
        "local_video_r2_endpoint": "https://example.r2.cloudflarestorage.com",
        "local_video_r2_bucket": "yunicity-media-recette",
        "local_video_r2_access_key_id": "key",
        "local_video_r2_secret_access_key": "secret",
        "local_video_cdn_base_url": "https://media.recette.yunicity.city",
        "media_public_base_url": "http://localhost:8000",
    }
    base.update(overrides)
    return Settings.model_construct(**base)


class TestProfileMediaPolicy:
    def test_validate_requires_r2_in_recette(self) -> None:
        with pytest.raises(AppError) as exc:
            validate_profile_media_storage_config(_settings(local_video_r2_bucket=None))
        assert exc.value.code == "PROFILE_MEDIA_R2_MISCONFIGURED"

    def test_validate_requires_cdn_in_recette(self) -> None:
        with pytest.raises(AppError) as exc:
            validate_profile_media_storage_config(_settings(local_video_cdn_base_url=None))
        assert exc.value.code == "PROFILE_MEDIA_CDN_MISCONFIGURED"

    def test_validate_dev_missing_r2_is_warning_only(self) -> None:
        warnings = validate_profile_media_storage_config(
            _settings(app_env="dev", local_video_r2_bucket=None, profile_media_storage_backend="r2")
        )
        assert warnings

    def test_validate_dev_filesystem_ok_without_r2(self) -> None:
        warnings = validate_profile_media_storage_config(
            _settings(app_env="dev", local_video_r2_bucket=None, profile_media_storage_backend="filesystem")
        )
        assert warnings == []

    def test_default_dev_upload_dir_is_absolute(self, monkeypatch: pytest.MonkeyPatch) -> None:
        from app.core.profile_media_policy import default_profile_media_dev_dir, resolve_profile_media_upload_dir

        monkeypatch.delenv("PYTEST_CURRENT_TEST", raising=False)
        default_dir = default_profile_media_dev_dir()
        assert default_dir.is_absolute()
        resolved = resolve_profile_media_upload_dir(None, app_env="dev")
        assert resolved == default_dir.resolve()


class TestProfileMediaR2Storage:
    def test_public_url_uses_cdn_base(self) -> None:
        with patch("app.services.profile_media.r2_storage.boto3.client", return_value=MagicMock()):
            storage = ProfileMediaR2Storage(_settings())
        user_id = uuid.uuid4()
        key = build_profile_media_key(user_id, ProfileMediaKind.AVATAR, ".jpg")
        assert storage.public_url(key) == f"https://media.recette.yunicity.city/{key}"

    def test_put_object_and_delete_variants(self) -> None:
        mock_client = MagicMock()
        user_id = uuid.uuid4()
        key = build_profile_media_key(user_id, ProfileMediaKind.AVATAR, ".jpg")
        with patch("app.services.profile_media.r2_storage.boto3.client", return_value=mock_client):
            storage = ProfileMediaR2Storage(_settings())
            storage.delete_existing_variants(user_id, ProfileMediaKind.AVATAR)
            storage.put_object(key, MINIMAL_JPEG_BYTES, "image/jpeg")

        assert mock_client.delete_object.call_count == 3
        mock_client.put_object.assert_called_once_with(
            Bucket="yunicity-media-recette",
            Key=key,
            Body=MINIMAL_JPEG_BYTES,
            ContentType="image/jpeg",
        )
