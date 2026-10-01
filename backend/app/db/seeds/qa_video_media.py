"""Deterministic QA sample video media (C3-VIDEO-QA-REAL-MEDIA-RECOVERY-02).

Generates browser-compatible MP4 fixtures under the QA media upload dir.
Idempotent: skips regeneration when ffprobe confirms width, height and duration.
"""

from __future__ import annotations

import json
import logging
import math
import shutil
import subprocess
from dataclasses import dataclass
from pathlib import Path

logger = logging.getLogger(__name__)

QA_LANDSCAPE_VIDEO_NAME = "qa-sample-video.mp4"
QA_PORTRAIT_VIDEO_NAME = "qa-sample-video-portrait.mp4"
QA_LANDSCAPE_THUMB_NAME = "qa-sample-video.png"
QA_PORTRAIT_THUMB_NAME = "qa-sample-video-portrait.png"

# Contract aligned with qa_fixtures LocalVideo rows (do not downgrade to 320×240 / 3 s).
QA_LANDSCAPE_WIDTH = 1920
QA_LANDSCAPE_HEIGHT = 1080
QA_LANDSCAPE_DURATION_SECONDS = 12.0

QA_PORTRAIT_WIDTH = 1080
QA_PORTRAIT_HEIGHT = 1920
QA_PORTRAIT_DURATION_SECONDS = 18.0

_DURATION_TOLERANCE_SECONDS = 0.35


@dataclass(frozen=True)
class QaVideoMediaSpec:
    filename: str
    width: int
    height: int
    duration_seconds: float
    lavfi_color: str


QA_LANDSCAPE_SPEC = QaVideoMediaSpec(
    filename=QA_LANDSCAPE_VIDEO_NAME,
    width=QA_LANDSCAPE_WIDTH,
    height=QA_LANDSCAPE_HEIGHT,
    duration_seconds=QA_LANDSCAPE_DURATION_SECONDS,
    lavfi_color="0x2A2FFF",
)

QA_PORTRAIT_SPEC = QaVideoMediaSpec(
    filename=QA_PORTRAIT_VIDEO_NAME,
    width=QA_PORTRAIT_WIDTH,
    height=QA_PORTRAIT_HEIGHT,
    duration_seconds=QA_PORTRAIT_DURATION_SECONDS,
    lavfi_color="0xFF2A8A",
)


def _parse_probe_dimension(raw: object) -> int | None:
    if isinstance(raw, bool):
        return None
    if isinstance(raw, int):
        value = raw
    elif isinstance(raw, float):
        if not raw.is_integer():
            return None
        value = int(raw)
    elif isinstance(raw, str):
        stripped = raw.strip()
        if not stripped:
            return None
        try:
            parsed = float(stripped)
        except (TypeError, ValueError, OverflowError):
            return None
        if not parsed.is_integer():
            return None
        value = int(parsed)
    else:
        return None
    if value <= 0:
        return None
    return value


def _parse_probe_duration(raw: object) -> float | None:
    if isinstance(raw, bool):
        return None
    if isinstance(raw, (int, float)):
        duration = float(raw)
    elif isinstance(raw, str):
        stripped = raw.strip()
        if not stripped:
            return None
        try:
            duration = float(stripped)
        except (TypeError, ValueError, OverflowError):
            return None
    else:
        return None
    if not math.isfinite(duration) or duration <= 0:
        return None
    return duration


def probe_video_media(path: Path) -> tuple[float, int, int] | None:
    """Return (duration_seconds, width, height) or None if unreadable."""
    if not path.is_file():
        return None
    ffprobe = shutil.which("ffprobe")
    if ffprobe is None:
        return None
    try:
        proc = subprocess.run(
            [
                ffprobe,
                "-v",
                "error",
                "-select_streams",
                "v:0",
                "-show_entries",
                "stream=width,height",
                "-show_entries",
                "format=duration",
                "-of",
                "json",
                str(path),
            ],
            capture_output=True,
            text=True,
            check=True,
            timeout=30,
        )
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired, OSError):
        return None
    try:
        payload = json.loads(proc.stdout)
    except json.JSONDecodeError:
        return None
    if not isinstance(payload, dict):
        return None

    streams = payload.get("streams")
    if not isinstance(streams, list) or not streams:
        return None
    stream = streams[0]
    if not isinstance(stream, dict):
        return None

    width = _parse_probe_dimension(stream.get("width"))
    height = _parse_probe_dimension(stream.get("height"))
    if width is None or height is None:
        return None

    format_payload = payload.get("format")
    if not isinstance(format_payload, dict):
        return None
    duration = _parse_probe_duration(format_payload.get("duration"))
    if duration is None:
        return None

    return duration, width, height


def media_matches_spec(path: Path, spec: QaVideoMediaSpec) -> bool:
    probed = probe_video_media(path)
    if probed is None:
        return False
    duration, width, height = probed
    return (
        width == spec.width
        and height == spec.height
        and abs(duration - spec.duration_seconds) <= _DURATION_TOLERANCE_SECONDS
    )


def _generate_mp4(path: Path, spec: QaVideoMediaSpec) -> None:
    ffmpeg = shutil.which("ffmpeg")
    if ffmpeg is None:
        raise RuntimeError("ffmpeg required to generate QA sample video fixtures")
    path.parent.mkdir(parents=True, exist_ok=True)
    lavfi = (
        f"color=c={spec.lavfi_color}:s={spec.width}x{spec.height}:"
        f"d={spec.duration_seconds}:r=30"
    )
    cmd = [
        ffmpeg,
        "-y",
        "-hide_banner",
        "-loglevel",
        "error",
        "-f",
        "lavfi",
        "-i",
        lavfi,
        "-c:v",
        "libx264",
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        str(path),
    ]
    try:
        subprocess.run(cmd, check=True, timeout=120)
    except subprocess.CalledProcessError as exc:
        raise RuntimeError("ffmpeg failed to generate QA sample video fixture") from exc
    except subprocess.TimeoutExpired as exc:
        raise RuntimeError("ffmpeg timed out generating QA sample video fixture") from exc
    except OSError as exc:
        raise RuntimeError("ffmpeg OS error generating QA sample video fixture") from exc


def ensure_qa_sample_video(path: Path, spec: QaVideoMediaSpec) -> bool:
    """Ensure ``path`` matches ``spec``. Returns True if (re)generated."""
    if media_matches_spec(path, spec):
        return False
    _generate_mp4(path, spec)
    if not media_matches_spec(path, spec):
        raise RuntimeError(f"QA fixture generation failed for {path.name}")
    logger.info(
        "qa_video_fixture_regenerated",
        extra={
            "file": path.name,
            "width": spec.width,
            "height": spec.height,
            "duration_seconds": spec.duration_seconds,
        },
    )
    return True


def classify_orientation(width: int, height: int, *, threshold: float = 1.05) -> str:
    if width <= 0 or height <= 0:
        return "landscape"
    return "portrait" if height / width > threshold else "landscape"
