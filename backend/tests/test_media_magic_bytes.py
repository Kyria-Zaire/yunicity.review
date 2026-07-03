"""Media magic bytes unit tests (VIDEO-03B.1)."""

from __future__ import annotations

import pytest
from app.core.media_magic_bytes import (
    ContentTypeMismatchError,
    assert_content_matches_declared_type,
    detect_supported_content_types,
)
from tests.media_fixtures import (
    FAKE_MP4_BYTES,
    MINIMAL_JPEG_BYTES,
    MINIMAL_MP4_BYTES,
    MINIMAL_PNG_BYTES,
    MINIMAL_WEBP_BYTES,
)


class TestMediaMagicBytes:
    def test_valid_mp4_accepted(self) -> None:
        assert_content_matches_declared_type(MINIMAL_MP4_BYTES, "video/mp4")

    def test_valid_mov_accepted(self) -> None:
        assert_content_matches_declared_type(MINIMAL_MP4_BYTES, "video/quicktime")

    def test_valid_jpeg_accepted(self) -> None:
        assert_content_matches_declared_type(MINIMAL_JPEG_BYTES, "image/jpeg")

    def test_valid_png_accepted(self) -> None:
        assert_content_matches_declared_type(MINIMAL_PNG_BYTES, "image/png")

    def test_valid_webp_accepted(self) -> None:
        assert_content_matches_declared_type(MINIMAL_WEBP_BYTES, "image/webp")

    def test_fake_mp4_with_valid_extension_rejected(self) -> None:
        with pytest.raises(ContentTypeMismatchError, match="ne correspond pas"):
            assert_content_matches_declared_type(FAKE_MP4_BYTES, "video/mp4")

    def test_jpeg_declared_as_mp4_rejected(self) -> None:
        with pytest.raises(ContentTypeMismatchError, match="ne correspond pas"):
            assert_content_matches_declared_type(MINIMAL_JPEG_BYTES, "video/mp4")

    def test_mp4_declared_as_jpeg_rejected(self) -> None:
        with pytest.raises(ContentTypeMismatchError, match="ne correspond pas"):
            assert_content_matches_declared_type(MINIMAL_MP4_BYTES, "image/jpeg")

    def test_empty_file_rejected(self) -> None:
        with pytest.raises(ContentTypeMismatchError, match="vide"):
            assert_content_matches_declared_type(b"", "video/mp4")

    def test_unsupported_mime_rejected(self) -> None:
        with pytest.raises(ContentTypeMismatchError, match="non supporté"):
            assert_content_matches_declared_type(MINIMAL_MP4_BYTES, "video/webm")

    def test_detect_supported_content_types(self) -> None:
        detected = detect_supported_content_types(MINIMAL_MP4_BYTES)
        assert detected == frozenset({"video/mp4", "video/quicktime"})

        assert detect_supported_content_types(MINIMAL_JPEG_BYTES) == frozenset({"image/jpeg"})
        assert detect_supported_content_types(FAKE_MP4_BYTES) == frozenset()
