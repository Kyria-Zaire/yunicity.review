"""Fail-closed filesystem backend for story/post media (C3.1-R1D)."""

from __future__ import annotations

from pathlib import Path
from typing import Any
from unittest.mock import patch
from uuid import uuid4

import pytest
from app.core.config import Settings
from app.core.errors import AppError
from app.core.story_media_policy import (
    resolve_story_media_upload_dir,
    validate_story_media_storage_config,
)
from app.services.story_media.filesystem_storage import StoryMediaFilesystemStorage
from app.services.story_media.r2_storage import build_story_media_storage
from app.services.story_media.storage_keys import build_story_media_key

from tests.media_fixtures import MINIMAL_JPEG_BYTES, MINIMAL_PNG_BYTES


def _settings(**overrides: Any) -> Settings:
    base: dict[str, Any] = {
        "app_env": "dev",
        "api_v1_prefix": "/api/v1",
        "story_media_storage_backend": "r2",
        "story_media_upload_dir": None,
        "local_video_r2_endpoint": "https://example.r2.cloudflarestorage.com",
        "local_video_r2_bucket": "yunicity-media-recette",
        "local_video_r2_access_key_id": "key",
        "local_video_r2_secret_access_key": "secret",
        "local_video_cdn_base_url": "https://media.recette.yunicity.city",
        "media_public_base_url": "http://localhost:8000",
    }
    base.update(overrides)
    return Settings.model_construct(**base)


def _filesystem_settings(tmp_path: Path, **overrides: Any) -> Settings:
    root = tmp_path / "story-media"
    root.mkdir(parents=True, exist_ok=True)
    return _settings(
        story_media_storage_backend="filesystem",
        story_media_upload_dir=str(root),
        **overrides,
    )


class TestStoryMediaFilesystemPolicy:
    def test_default_backend_is_r2(self) -> None:
        settings = Settings.model_construct(app_env="dev")
        assert settings.story_media_storage_backend == "r2"

    def test_filesystem_allowed_in_dev_when_explicit(self, tmp_path: Path) -> None:
        settings = _filesystem_settings(tmp_path)
        assert validate_story_media_storage_config(settings) == []
        storage = build_story_media_storage(settings)
        assert isinstance(storage, StoryMediaFilesystemStorage)

    def test_filesystem_not_implied_by_app_env_dev_alone(self) -> None:
        settings = _settings(app_env="dev")
        assert settings.story_media_storage_backend == "r2"

    def test_filesystem_refused_in_production(self, tmp_path: Path) -> None:
        settings = _filesystem_settings(tmp_path, app_env="prod")
        with pytest.raises(AppError) as exc:
            validate_story_media_storage_config(settings)
        assert exc.value.code == "STORY_MEDIA_FILESYSTEM_FORBIDDEN"

    def test_filesystem_refused_in_recette(self, tmp_path: Path) -> None:
        settings = _filesystem_settings(tmp_path, app_env="recette")
        with pytest.raises(AppError) as exc:
            validate_story_media_storage_config(settings)
        assert exc.value.code == "STORY_MEDIA_FILESYSTEM_FORBIDDEN"

    def test_filesystem_refused_under_railway(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.setenv("RAILWAY_ENVIRONMENT", "production")
        settings = _filesystem_settings(tmp_path, app_env="dev")
        with pytest.raises(AppError) as exc:
            validate_story_media_storage_config(settings)
        assert exc.value.code == "STORY_MEDIA_FILESYSTEM_FORBIDDEN"

    def test_r2_still_required_in_recette(self) -> None:
        with pytest.raises(AppError) as exc:
            validate_story_media_storage_config(
                _settings(app_env="recette", local_video_r2_bucket=None)
            )
        assert exc.value.code == "STORY_MEDIA_R2_MISCONFIGURED"

    def test_arbitrary_upload_dir_rejected(self) -> None:
        settings = _settings(
            story_media_storage_backend="filesystem",
            story_media_upload_dir="/etc/passwd-dir",
        )
        with pytest.raises(AppError) as exc:
            validate_story_media_storage_config(settings)
        assert exc.value.code == "STORY_MEDIA_FILESYSTEM_MISCONFIGURED"


class TestStoryMediaFilesystemStorage:
    def test_public_url_is_relative_api_path(self, tmp_path: Path) -> None:
        storage = StoryMediaFilesystemStorage(_filesystem_settings(tmp_path))
        user_id = uuid4()
        media_id = uuid4()
        key = build_story_media_key(user_id, media_id, ".png")
        url = storage.public_url(key)
        assert url.startswith("/api/v1/story-media/")
        assert "localhost" not in url
        assert "127.0.0.1" not in url
        assert ":" not in url.split("/")[0]

    def test_put_object_ignores_user_filename_and_uses_server_key(self, tmp_path: Path) -> None:
        settings = _filesystem_settings(tmp_path)
        storage = StoryMediaFilesystemStorage(settings)
        user_id = uuid4()
        media_id = uuid4()
        key = build_story_media_key(user_id, media_id, ".png")
        storage.put_object(key, MINIMAL_PNG_BYTES, "image/png")
        dest = resolve_story_media_upload_dir(settings.story_media_upload_dir) / key
        assert dest.is_file()
        assert dest.read_bytes() == MINIMAL_PNG_BYTES
        assert ".." not in str(dest)
        assert dest.name == f"{media_id}.png"

    def test_path_traversal_filename_cannot_escape_root(self, tmp_path: Path) -> None:
        storage = StoryMediaFilesystemStorage(_filesystem_settings(tmp_path))
        with pytest.raises(AppError) as exc:
            storage.put_object("../../etc/passwd.png", MINIMAL_PNG_BYTES, "image/png")
        assert exc.value.code == "STORY_MEDIA_INVALID_STORAGE_KEY"
        leaked = list(tmp_path.rglob("passwd.png"))
        assert leaked == []

    def test_failed_write_leaves_no_tmp_file(self, tmp_path: Path) -> None:
        settings = _filesystem_settings(tmp_path)
        storage = StoryMediaFilesystemStorage(settings)
        user_id = uuid4()
        media_id = uuid4()
        key = build_story_media_key(user_id, media_id, ".png")
        with patch("os.replace", side_effect=OSError("disk full")):
            with pytest.raises(OSError):
                storage.put_object(key, MINIMAL_JPEG_BYTES, "image/jpeg")
        media_root = resolve_story_media_upload_dir(settings.story_media_upload_dir)
        leftovers = [path for path in media_root.rglob("*") if path.is_file()]
        assert leftovers == []
