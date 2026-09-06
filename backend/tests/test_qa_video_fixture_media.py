"""QA sample video fixture media contract (C3-VIDEO-QA-REAL-MEDIA-RECOVERY-02)."""

from __future__ import annotations

import subprocess
from collections.abc import Iterator
from pathlib import Path

import pytest
from app.db.seeds.qa_fixtures import _write_placeholder_video
from app.db.seeds.qa_video_media import (
    QA_LANDSCAPE_DURATION_SECONDS,
    QA_LANDSCAPE_HEIGHT,
    QA_LANDSCAPE_SPEC,
    QA_LANDSCAPE_VIDEO_NAME,
    QA_LANDSCAPE_WIDTH,
    QA_PORTRAIT_DURATION_SECONDS,
    QA_PORTRAIT_HEIGHT,
    QA_PORTRAIT_SPEC,
    QA_PORTRAIT_VIDEO_NAME,
    QA_PORTRAIT_WIDTH,
    _generate_mp4,
    classify_orientation,
    ensure_qa_sample_video,
    media_matches_spec,
    probe_video_media,
)


@pytest.fixture
def qa_media_dir(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Iterator[Path]:
    media_dir = tmp_path / "qa"
    monkeypatch.setenv("MEDIA_UPLOAD_DIR", str(tmp_path))
    monkeypatch.setenv("MEDIA_PUBLIC_BASE_URL", "http://localhost:8010")
    from app.core.config import get_settings

    get_settings.cache_clear()
    try:
        yield media_dir
    finally:
        get_settings.cache_clear()


def _assert_probe_contract(
    path: Path,
    *,
    expected_width: int,
    expected_height: int,
    expected_duration: float,
) -> None:
    probed = probe_video_media(path)
    assert probed is not None
    duration, width, height = probed
    assert width == expected_width
    assert height == expected_height
    assert abs(duration - expected_duration) <= 0.35


def test_qa_landscape_fixture_ffprobe_contract(qa_media_dir: Path) -> None:
    path = qa_media_dir / QA_LANDSCAPE_VIDEO_NAME
    assert ensure_qa_sample_video(path, QA_LANDSCAPE_SPEC) is True
    _assert_probe_contract(
        path,
        expected_width=QA_LANDSCAPE_WIDTH,
        expected_height=QA_LANDSCAPE_HEIGHT,
        expected_duration=QA_LANDSCAPE_DURATION_SECONDS,
    )
    probed = probe_video_media(path)
    assert probed is not None
    _, width, height = probed
    assert classify_orientation(width, height) == "landscape"


def test_qa_portrait_fixture_ffprobe_contract(qa_media_dir: Path) -> None:
    path = qa_media_dir / QA_PORTRAIT_VIDEO_NAME
    assert ensure_qa_sample_video(path, QA_PORTRAIT_SPEC) is True
    _assert_probe_contract(
        path,
        expected_width=QA_PORTRAIT_WIDTH,
        expected_height=QA_PORTRAIT_HEIGHT,
        expected_duration=QA_PORTRAIT_DURATION_SECONDS,
    )
    probed = probe_video_media(path)
    assert probed is not None
    _, width, height = probed
    assert classify_orientation(width, height) == "portrait"


def test_qa_fixture_regeneration_is_idempotent(qa_media_dir: Path) -> None:
    landscape = qa_media_dir / QA_LANDSCAPE_VIDEO_NAME
    portrait = qa_media_dir / QA_PORTRAIT_VIDEO_NAME
    assert ensure_qa_sample_video(landscape, QA_LANDSCAPE_SPEC) is True
    assert ensure_qa_sample_video(portrait, QA_PORTRAIT_SPEC) is True
    assert ensure_qa_sample_video(landscape, QA_LANDSCAPE_SPEC) is False
    assert ensure_qa_sample_video(portrait, QA_PORTRAIT_SPEC) is False
    assert media_matches_spec(landscape, QA_LANDSCAPE_SPEC)
    assert media_matches_spec(portrait, QA_PORTRAIT_SPEC)


def test_write_placeholder_video_uses_contract(qa_media_dir: Path) -> None:
    _write_placeholder_video()
    landscape = qa_media_dir / QA_LANDSCAPE_VIDEO_NAME
    portrait = qa_media_dir / QA_PORTRAIT_VIDEO_NAME
    assert media_matches_spec(landscape, QA_LANDSCAPE_SPEC)
    assert media_matches_spec(portrait, QA_PORTRAIT_SPEC)


def test_corrupted_existing_file_is_regenerated(qa_media_dir: Path) -> None:
    path = qa_media_dir / QA_LANDSCAPE_VIDEO_NAME
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(b"not-a-valid-mp4")
    assert probe_video_media(path) is None
    assert ensure_qa_sample_video(path, QA_LANDSCAPE_SPEC) is True
    _assert_probe_contract(
        path,
        expected_width=QA_LANDSCAPE_WIDTH,
        expected_height=QA_LANDSCAPE_HEIGHT,
        expected_duration=QA_LANDSCAPE_DURATION_SECONDS,
    )


def test_probe_video_media_invalid_ffprobe_json(
    qa_media_dir: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    path = qa_media_dir / QA_LANDSCAPE_VIDEO_NAME
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(b"stub")

    def _run(*args: object, **kwargs: object) -> subprocess.CompletedProcess[str]:
        del args, kwargs
        return subprocess.CompletedProcess(["ffprobe"], 0, stdout="not-json", stderr="")

    monkeypatch.setattr("app.db.seeds.qa_video_media.shutil.which", lambda _: "ffprobe")
    monkeypatch.setattr("app.db.seeds.qa_video_media.subprocess.run", _run)
    assert probe_video_media(path) is None


def test_probe_video_media_invalid_width_metadata(
    qa_media_dir: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    path = qa_media_dir / QA_LANDSCAPE_VIDEO_NAME
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(b"stub")
    stdout = (
        '{"streams":[{"width":"N/A","height":1080}],'
        '"format":{"duration":"12.0"}}'
    )

    def _run(*args: object, **kwargs: object) -> subprocess.CompletedProcess[str]:
        del args, kwargs
        return subprocess.CompletedProcess(["ffprobe"], 0, stdout=stdout, stderr="")

    monkeypatch.setattr("app.db.seeds.qa_video_media.shutil.which", lambda _: "ffprobe")
    monkeypatch.setattr("app.db.seeds.qa_video_media.subprocess.run", _run)
    assert probe_video_media(path) is None


def test_probe_video_media_invalid_duration_metadata(
    qa_media_dir: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    path = qa_media_dir / QA_LANDSCAPE_VIDEO_NAME
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(b"stub")
    stdout = (
        '{"streams":[{"width":1920,"height":1080}],'
        '"format":{"duration":"0"}}'
    )

    def _run(*args: object, **kwargs: object) -> subprocess.CompletedProcess[str]:
        del args, kwargs
        return subprocess.CompletedProcess(["ffprobe"], 0, stdout=stdout, stderr="")

    monkeypatch.setattr("app.db.seeds.qa_video_media.shutil.which", lambda _: "ffprobe")
    monkeypatch.setattr("app.db.seeds.qa_video_media.subprocess.run", _run)
    assert probe_video_media(path) is None


def test_generate_mp4_called_process_error_raises_runtime_error(
    qa_media_dir: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    path = qa_media_dir / QA_LANDSCAPE_VIDEO_NAME

    def _run(*args: object, **kwargs: object) -> subprocess.CompletedProcess[str]:
        del args, kwargs
        raise subprocess.CalledProcessError(1, ["ffmpeg"], stderr="boom")

    monkeypatch.setattr("app.db.seeds.qa_video_media.shutil.which", lambda _: "ffmpeg")
    monkeypatch.setattr("app.db.seeds.qa_video_media.subprocess.run", _run)
    with pytest.raises(RuntimeError, match="ffmpeg failed to generate QA sample video fixture"):
        _generate_mp4(path, QA_LANDSCAPE_SPEC)


def test_generate_mp4_timeout_raises_runtime_error(
    qa_media_dir: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    path = qa_media_dir / QA_LANDSCAPE_VIDEO_NAME

    def _run(*args: object, **kwargs: object) -> subprocess.CompletedProcess[str]:
        del args, kwargs
        raise subprocess.TimeoutExpired(cmd=["ffmpeg"], timeout=120)

    monkeypatch.setattr("app.db.seeds.qa_video_media.shutil.which", lambda _: "ffmpeg")
    monkeypatch.setattr("app.db.seeds.qa_video_media.subprocess.run", _run)
    with pytest.raises(RuntimeError, match="ffmpeg timed out generating QA sample video fixture"):
        _generate_mp4(path, QA_LANDSCAPE_SPEC)
