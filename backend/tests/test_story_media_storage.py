"""Story media R2 storage unit tests (PILOT-FIX-03)."""

from __future__ import annotations

import uuid
from pathlib import Path
from typing import Any
from unittest.mock import MagicMock, patch

import pytest
from app.core.config import Settings
from app.core.errors import AppError
from app.core.story_media_policy import validate_story_media_storage_config
from app.services.story_media.r2_storage import StoryMediaR2Storage
from app.services.story_media.storage_keys import build_story_media_key

from tests.media_fixtures import MINIMAL_JPEG_BYTES


def _settings(**overrides: Any) -> Settings:
    base: dict[str, Any] = {
        "app_env": "recette",
        "local_video_r2_endpoint": "https://example.r2.cloudflarestorage.com",
        "local_video_r2_bucket": "yunicity-media-recette",
        "local_video_r2_access_key_id": "key",
        "local_video_r2_secret_access_key": "secret",
        "local_video_cdn_base_url": "https://media.recette.yunicity.city",
        "media_public_base_url": "http://localhost:8000",
    }
    base.update(overrides)
    return Settings.model_construct(**base)


class TestStoryMediaPolicy:
    def test_validate_requires_r2_in_recette(self) -> None:
        with pytest.raises(AppError) as exc:
            validate_story_media_storage_config(_settings(local_video_r2_bucket=None))
        assert exc.value.code == "STORY_MEDIA_R2_MISCONFIGURED"

    def test_validate_requires_cdn_in_recette(self) -> None:
        with pytest.raises(AppError) as exc:
            validate_story_media_storage_config(_settings(local_video_cdn_base_url=None))
        assert exc.value.code == "STORY_MEDIA_CDN_MISCONFIGURED"

    def test_validate_dev_missing_r2_is_warning_only(self) -> None:
        warnings = validate_story_media_storage_config(
            _settings(app_env="dev", local_video_r2_bucket=None)
        )
        assert warnings


class TestStoryMediaR2Storage:
    def test_public_url_goes_through_the_protected_api_route(self) -> None:
        """Plus jamais l'URL CDN absolue : elle contournait l'autorisation d'audience."""
        with patch("app.services.story_media.r2_storage.boto3.client", return_value=MagicMock()):
            storage = StoryMediaR2Storage(_settings())
        user_id = uuid.uuid4()
        media_id = uuid.uuid4()
        key = build_story_media_key(user_id, media_id, ".jpg")

        url = storage.public_url(key)

        assert url == f"/api/v1/story-media/{user_id}/{media_id}.jpg"
        assert not url.startswith("http"), "aucune URL absolue"
        assert "media.recette.yunicity.city" not in url
        assert "media.yunicity.city" not in url

    def test_both_backends_produce_the_same_protected_url(self, tmp_path: Path) -> None:
        """Contrat partage : aucun backend ne peut reintroduire un acces direct."""
        from app.services.story_media.filesystem_storage import StoryMediaFilesystemStorage

        user_id, media_id = uuid.uuid4(), uuid.uuid4()
        key = build_story_media_key(user_id, media_id, ".jpg")
        with patch("app.services.story_media.r2_storage.boto3.client", return_value=MagicMock()):
            r2_url = StoryMediaR2Storage(_settings()).public_url(key)
        fs_url = StoryMediaFilesystemStorage(
            _settings(
                app_env="dev",
                story_media_storage_backend="filesystem",
                story_media_upload_dir=str(tmp_path),
            )
        ).public_url(key)

        assert r2_url == fs_url == f"/api/v1/story-media/{user_id}/{media_id}.jpg"

    def test_put_object(self) -> None:
        mock_client = MagicMock()
        user_id = uuid.uuid4()
        media_id = uuid.uuid4()
        key = build_story_media_key(user_id, media_id, ".jpg")
        with patch("app.services.story_media.r2_storage.boto3.client", return_value=mock_client):
            storage = StoryMediaR2Storage(_settings())
            storage.put_object(key, MINIMAL_JPEG_BYTES, "image/jpeg")

        mock_client.put_object.assert_called_once_with(
            Bucket="yunicity-media-recette",
            Key=key,
            Body=MINIMAL_JPEG_BYTES,
            ContentType="image/jpeg",
        )
