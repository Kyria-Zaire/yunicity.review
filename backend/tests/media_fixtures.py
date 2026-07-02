"""Binary fixtures for media magic-bytes tests (VIDEO-03B.1)."""

from __future__ import annotations

# Minimal ISO BMFF header (ftyp isom) — valid for video/mp4 and video/quicktime.
MINIMAL_MP4_BYTES = bytes.fromhex("000000206674797069736f6d0000020069736f6d69736f32")

MINIMAL_JPEG_BYTES = bytes.fromhex("ffd8ffe0") + b"\x00" * 12

MINIMAL_PNG_BYTES = bytes.fromhex("89504e470d0a1a0a") + b"\x00" * 16

MINIMAL_WEBP_BYTES = b"RIFF" + b"\x00\x00\x00\x08" + b"WEBP" + b"VP8 " + b"\x00" * 12

FAKE_MP4_BYTES = b"fake-mp4-bytes-for-test"
