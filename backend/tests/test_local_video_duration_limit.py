"""VIDEO-04A-CONTRACT-FIX-01 — frontiere de duree et alignement du contrat.

Le client annoncait « max. 90 s » (`LOCAL_VIDEO_MAX_DURATION_SECONDS` cote TS)
alors que le serveur rejetait a 60 s : la valeur appliquee ne venait pas de la
constante du domaine mais d'un defaut duplique dans `Settings`. Une video de
61-90 s passait la validation client puis etait refusee par un message annoncant
une limite fausse.

Ces tests verrouillent les deux moities du contrat :
  - le defaut de `Settings` derive bien de la constante du domaine ;
  - la frontiere appliquee est 90 s, message inclus.

Aucune video n'est generee : `_probe_media` est mocke, comme dans
`test_local_video_processor_probe.py`.
"""

from __future__ import annotations

import shutil
import uuid
from pathlib import Path

import pytest
from app.core.config import Settings, get_settings
from app.core.errors import AppError
from app.core.local_video_constants import (
    LOCAL_VIDEO_MAX_BYTES,
    LOCAL_VIDEO_MAX_DURATION_SECONDS,
    LOCAL_VIDEO_UPLOAD_RATE_LIMIT,
)
from app.services.local_video.processor import LocalVideoMediaProcessor

pytestmark = pytest.mark.unit


class _StubStorage:
    """Stockage minimal : ecrit un fichier source, accepte les uploads."""

    def read_to_path(self, storage_key: str, destination: Path) -> None:
        del storage_key
        destination.write_bytes(b"\x00" * 32)

    def build_processed_key(self, *, city_slug: str, video_id: uuid.UUID) -> str:
        return f"local-video/{city_slug}/{video_id}/processed.mp4"

    def build_thumbnail_key(self, *, city_slug: str, video_id: uuid.UUID) -> str:
        return f"local-video/{city_slug}/{video_id}/thumbnail.jpg"

    def upload_file(self, source: Path, storage_key: str, content_type: str) -> None:
        del source, storage_key, content_type


def _processor(
    monkeypatch: pytest.MonkeyPatch,
    duration_seconds: float,
) -> LocalVideoMediaProcessor:
    """Processeur dont la sonde renvoie `duration_seconds`, limite forcee a la constante."""
    settings: Settings = get_settings().model_copy(
        update={"local_video_max_duration_seconds": LOCAL_VIDEO_MAX_DURATION_SECONDS},
    )
    proc = LocalVideoMediaProcessor(settings, _StubStorage())  # type: ignore[arg-type]

    monkeypatch.setattr(shutil, "which", lambda name: f"/usr/bin/{name}")
    monkeypatch.setattr(proc, "_probe_media", lambda path: (duration_seconds, 640, 360))
    monkeypatch.setattr(proc, "_maybe_transcode", lambda *args, **kwargs: None)
    monkeypatch.setattr(
        proc,
        "_extract_thumbnail",
        lambda source, destination: Path(destination).write_bytes(b"\xff\xd8\xff"),
    )
    return proc


def _run(proc: LocalVideoMediaProcessor):  # type: ignore[no-untyped-def]
    return proc.process(
        source_storage_key="local-video/reims/source.mp4",
        city_slug="reims",
        video_id=uuid.uuid4(),
        content_type="video/mp4",
    )


def test_settings_default_derives_from_domain_constant() -> None:
    """Le defaut applique ne doit plus pouvoir diverger de la constante."""
    get_settings.cache_clear()
    assert get_settings().local_video_max_duration_seconds == LOCAL_VIDEO_MAX_DURATION_SECONDS


def test_domain_constant_is_pilot_ninety_seconds() -> None:
    """Profil pilote citoyen — spec Founder, FEATURE-ROADMAP-POST-RC."""
    assert LOCAL_VIDEO_MAX_DURATION_SECONDS == 90


def test_eighty_nine_seconds_is_accepted(monkeypatch: pytest.MonkeyPatch) -> None:
    result = _run(_processor(monkeypatch, 89.0))
    assert result.duration_seconds == 89.0


def test_ninety_seconds_is_accepted(monkeypatch: pytest.MonkeyPatch) -> None:
    result = _run(_processor(monkeypatch, 90.0))
    assert result.duration_seconds == 90.0


def test_ninety_one_seconds_is_rejected(monkeypatch: pytest.MonkeyPatch) -> None:
    with pytest.raises(AppError) as exc_info:
        _run(_processor(monkeypatch, 91.0))
    err = exc_info.value
    assert err.status_code == 400
    assert err.code == "LOCAL_VIDEO_TOO_LONG"
    assert err.detail == "Vidéo trop longue (max. 90 s)."


def test_rejection_message_carries_the_authoritative_value(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Le message serveur derive de la limite appliquee, pas d'un litteral fige."""
    with pytest.raises(AppError) as exc_info:
        _run(_processor(monkeypatch, 500.0))
    assert f"max. {LOCAL_VIDEO_MAX_DURATION_SECONDS} s" in exc_info.value.detail


def test_size_and_quota_are_unchanged() -> None:
    """Ce ticket ne touche ni la taille ni le quota."""
    assert LOCAL_VIDEO_MAX_BYTES == 50 * 1024 * 1024
    assert LOCAL_VIDEO_UPLOAD_RATE_LIMIT == 10
