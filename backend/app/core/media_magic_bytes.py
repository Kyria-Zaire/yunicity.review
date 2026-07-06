"""Binary signature validation for Yunicity-supported media (VIDEO-03B.1)."""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass

MAGIC_BYTES_READ_LENGTH = 32

# Minimal ISO BMFF header (ftyp isom) — sufficient for video/mp4 and video/quicktime.
PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"


class ContentTypeMismatchError(ValueError):
    """Raised when file bytes do not match the declared MIME type."""


@dataclass(frozen=True)
class MediaSignature:
    content_types: frozenset[str]
    matches: Callable[[bytes], bool]


def _is_jpeg(data: bytes) -> bool:
    return len(data) >= 3 and data[:3] == b"\xff\xd8\xff"


def _is_png(data: bytes) -> bool:
    return len(data) >= len(PNG_SIGNATURE) and data[: len(PNG_SIGNATURE)] == PNG_SIGNATURE


def _is_webp(data: bytes) -> bool:
    return len(data) >= 12 and data[:4] == b"RIFF" and data[8:12] == b"WEBP"


def _is_iso_bmff(data: bytes) -> bool:
    """MP4 and QuickTime (.mov) use ISO Base Media File Format with an ftyp box."""
    return len(data) >= 8 and data[4:8] == b"ftyp"


def _is_webm(data: bytes) -> bool:
    return len(data) >= 4 and data[:4] == b"\x1a\x45\xdf\xa3"


_MEDIA_SIGNATURES: tuple[MediaSignature, ...] = (
    MediaSignature(frozenset({"image/jpeg"}), _is_jpeg),
    MediaSignature(frozenset({"image/png"}), _is_png),
    MediaSignature(frozenset({"image/webp"}), _is_webp),
    MediaSignature(
        frozenset({"video/mp4", "video/quicktime"}),
        _is_iso_bmff,
    ),
    MediaSignature(frozenset({"video/webm"}), _is_webm),
)

_SIGNATURE_BY_CONTENT_TYPE: dict[str, Callable[[bytes], bool]] = {}
for _spec in _MEDIA_SIGNATURES:
    for _mime in _spec.content_types:
        _SIGNATURE_BY_CONTENT_TYPE[_mime] = _spec.matches

SUPPORTED_MAGIC_BYTE_CONTENT_TYPES = frozenset(_SIGNATURE_BY_CONTENT_TYPE)


def detect_supported_content_types(data: bytes) -> frozenset[str]:
    """Return MIME types whose binary signature matches the given prefix."""
    sample = data[:MAGIC_BYTES_READ_LENGTH]
    detected: set[str] = set()
    for spec in _MEDIA_SIGNATURES:
        if spec.matches(sample):
            detected.update(spec.content_types)
    return frozenset(detected)


def assert_content_matches_declared_type(data: bytes, declared_content_type: str) -> None:
    """Verify that file bytes match the declared MIME type."""
    normalized = declared_content_type.strip().lower()
    matcher = _SIGNATURE_BY_CONTENT_TYPE.get(normalized)
    if matcher is None:
        raise ContentTypeMismatchError("Type de média non supporté.")
    if not data:
        raise ContentTypeMismatchError("Fichier vide.")
    sample = data[:MAGIC_BYTES_READ_LENGTH]
    if not matcher(sample):
        raise ContentTypeMismatchError(
            "Le contenu du fichier ne correspond pas au type déclaré."
        )
