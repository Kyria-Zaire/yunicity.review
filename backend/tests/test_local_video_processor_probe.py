"""Unit tests for LocalVideoMediaProcessor._probe_media rotation handling."""

from __future__ import annotations

import json
import subprocess
from pathlib import Path
from typing import Any

import pytest
from app.core.config import get_settings
from app.core.errors import AppError
from app.services.local_video.processor import LocalVideoMediaProcessor
from app.services.local_video.storage import build_local_video_storage

pytestmark = pytest.mark.unit


@pytest.fixture
def processor() -> LocalVideoMediaProcessor:
    get_settings.cache_clear()
    return LocalVideoMediaProcessor(get_settings(), build_local_video_storage(get_settings()))


def _ffprobe_payload(
    *,
    width: object = 640,
    height: object = 360,
    rotation_side: object | None = None,
    rotate_tag: object | None = None,
    duration: object = "12.5",
) -> str:
    stream: dict[str, Any] = {"width": width, "height": height, "tags": {}}
    if rotate_tag is not None:
        stream["tags"]["rotate"] = rotate_tag
    if rotation_side is not None:
        stream["side_data_list"] = [{"rotation": rotation_side}]
    return json.dumps({"streams": [stream], "format": {"duration": duration}})


def _patch_ffprobe(monkeypatch: pytest.MonkeyPatch, stdout: str) -> None:
    def _run(cmd: list[str], **kwargs: object) -> subprocess.CompletedProcess[str]:
        del kwargs
        assert cmd[0] == "ffprobe"
        return subprocess.CompletedProcess(cmd, 0, stdout=stdout, stderr="")

    monkeypatch.setattr(subprocess, "run", _run)


def test_probe_media_without_rotation(
    processor: LocalVideoMediaProcessor,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _patch_ffprobe(monkeypatch, _ffprobe_payload())
    duration, width, height = processor._probe_media(Path("sample.mp4"))
    assert duration == 12.5
    assert width == 640
    assert height == 360


def test_probe_media_rotation_zero(
    processor: LocalVideoMediaProcessor,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _patch_ffprobe(monkeypatch, _ffprobe_payload(rotation_side=0))
    _, width, height = processor._probe_media(Path("sample.mp4"))
    assert (width, height) == (640, 360)


def test_probe_media_rotation_ninety(
    processor: LocalVideoMediaProcessor,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _patch_ffprobe(monkeypatch, _ffprobe_payload(rotation_side=90))
    _, width, height = processor._probe_media(Path("sample.mp4"))
    assert (width, height) == (360, 640)


def test_probe_media_rotation_negative_ninety(
    processor: LocalVideoMediaProcessor,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _patch_ffprobe(monkeypatch, _ffprobe_payload(rotation_side=-90))
    _, width, height = processor._probe_media(Path("sample.mp4"))
    assert (width, height) == (360, 640)


def test_probe_media_rotation_two_seventy(
    processor: LocalVideoMediaProcessor,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _patch_ffprobe(monkeypatch, _ffprobe_payload(rotation_side=270))
    _, width, height = processor._probe_media(Path("sample.mp4"))
    assert (width, height) == (360, 640)


def test_probe_media_rotation_one_eighty(
    processor: LocalVideoMediaProcessor,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _patch_ffprobe(monkeypatch, _ffprobe_payload(rotation_side=180))
    _, width, height = processor._probe_media(Path("sample.mp4"))
    assert (width, height) == (640, 360)


def test_probe_media_prefers_display_matrix_over_rotate_tag(
    processor: LocalVideoMediaProcessor,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _patch_ffprobe(monkeypatch, _ffprobe_payload(rotation_side=90, rotate_tag="180"))
    _, width, height = processor._probe_media(Path("sample.mp4"))
    assert (width, height) == (360, 640)


def test_probe_media_rotate_tag_fallback(
    processor: LocalVideoMediaProcessor,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _patch_ffprobe(monkeypatch, _ffprobe_payload(rotate_tag="90"))
    _, width, height = processor._probe_media(Path("sample.mp4"))
    assert (width, height) == (360, 640)


def test_probe_media_missing_width(
    processor: LocalVideoMediaProcessor,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _patch_ffprobe(monkeypatch, _ffprobe_payload(width=None, height=360))
    with pytest.raises(AppError, match="Dimensions vidéo introuvables"):
        processor._probe_media(Path("sample.mp4"))


def test_probe_media_missing_height(
    processor: LocalVideoMediaProcessor,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _patch_ffprobe(monkeypatch, _ffprobe_payload(width=640, height=None))
    with pytest.raises(AppError, match="Dimensions vidéo introuvables"):
        processor._probe_media(Path("sample.mp4"))


def test_probe_media_missing_dimensions(
    processor: LocalVideoMediaProcessor,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _patch_ffprobe(monkeypatch, _ffprobe_payload(width=None, height=None))
    with pytest.raises(AppError, match="Dimensions vidéo introuvables"):
        processor._probe_media(Path("sample.mp4"))


def test_probe_media_valid_metadata_serializes_dimensions(
    processor: LocalVideoMediaProcessor,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _patch_ffprobe(monkeypatch, _ffprobe_payload(width=720, height=1328, duration="5.64"))
    duration, width, height = processor._probe_media(Path("sample.mp4"))
    assert duration == 5.64
    assert width == 720
    assert height == 1328


def test_probe_media_ffprobe_failure(
    processor: LocalVideoMediaProcessor,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    def _run(cmd: list[str], **kwargs: object) -> subprocess.CompletedProcess[str]:
        del kwargs
        raise subprocess.CalledProcessError(1, cmd, stderr="invalid data")

    monkeypatch.setattr(subprocess, "run", _run)
    with pytest.raises(AppError, match="Fichier vidéo illisible"):
        processor._probe_media(Path("broken.mp4"))


def test_probe_media_invalid_duration(
    processor: LocalVideoMediaProcessor,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _patch_ffprobe(monkeypatch, _ffprobe_payload(duration="0"))
    with pytest.raises(AppError, match="Durée vidéo invalide"):
        processor._probe_media(Path("sample.mp4"))


def _assert_invalid_rotation_app_error(
    processor: LocalVideoMediaProcessor,
    monkeypatch: pytest.MonkeyPatch,
    **payload_kwargs: object,
) -> None:
    _patch_ffprobe(monkeypatch, _ffprobe_payload(**payload_kwargs))
    with pytest.raises(AppError) as exc_info:
        processor._probe_media(Path("sample.mp4"))
    err = exc_info.value
    assert err.status_code == 400
    assert err.code == "LOCAL_VIDEO_INVALID_MEDIA"
    assert err.detail == "Rotation vidéo invalide."


def test_probe_media_invalid_side_data_rotation_na(
    processor: LocalVideoMediaProcessor,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _assert_invalid_rotation_app_error(processor, monkeypatch, rotation_side="N/A")


def test_probe_media_invalid_side_data_rotation_empty_string(
    processor: LocalVideoMediaProcessor,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _assert_invalid_rotation_app_error(processor, monkeypatch, rotation_side="")


def test_probe_media_invalid_side_data_rotation_bool(
    processor: LocalVideoMediaProcessor,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _assert_invalid_rotation_app_error(processor, monkeypatch, rotation_side=True)


def test_probe_media_invalid_side_data_rotation_non_integer_float(
    processor: LocalVideoMediaProcessor,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _assert_invalid_rotation_app_error(processor, monkeypatch, rotation_side=90.5)


def test_probe_media_invalid_side_data_rotation_no_tag_fallback(
    processor: LocalVideoMediaProcessor,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _assert_invalid_rotation_app_error(
        processor,
        monkeypatch,
        rotation_side="N/A",
        rotate_tag="90",
    )


def test_probe_media_invalid_rotate_tag_only(
    processor: LocalVideoMediaProcessor,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _assert_invalid_rotation_app_error(processor, monkeypatch, rotate_tag="N/A")


def test_probe_media_rotation_stripped_negative_ninety_string(
    processor: LocalVideoMediaProcessor,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _patch_ffprobe(monkeypatch, _ffprobe_payload(rotation_side=" -90 "))
    _, width, height = processor._probe_media(Path("sample.mp4"))
    assert (width, height) == (360, 640)


def test_probe_media_rotation_integer_float_ninety(
    processor: LocalVideoMediaProcessor,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _patch_ffprobe(monkeypatch, _ffprobe_payload(rotation_side=90.0))
    _, width, height = processor._probe_media(Path("sample.mp4"))
    assert (width, height) == (360, 640)
