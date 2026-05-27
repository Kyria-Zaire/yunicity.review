"""Cultural media normalization tests (WEB-SEARCH-02B.1)."""

from __future__ import annotations

from app.services.cultural_media import normalize_cultural_media


def test_normalize_sets_legacy_image_url_from_hero() -> None:
    media = normalize_cultural_media(
        hero_image_url="https://commons.wikimedia.org/wiki/Special:FilePath/Test.jpg?width=800",
        gallery_images=[],
    )
    assert media.hero_image_url is not None
    assert media.image_url == media.hero_image_url
    assert media.thumbnail_image_url == media.hero_image_url


def test_normalize_dedupes_gallery_and_builds_thumbnail() -> None:
    url = "https://commons.wikimedia.org/wiki/Special:FilePath/Cathedral.jpg?width=1200"
    media = normalize_cultural_media(
        gallery_images=[
            {"url": url, "alt": "Vue 1", "source": "wikimedia_commons"},
            {"url": url, "alt": "Doublon"},
            {"url": "not-a-url", "alt": "Invalid"},
        ],
    )
    assert len(media.gallery_images) == 1
    assert media.hero_image_url == url
    assert media.thumbnail_image_url == url


def test_normalize_rejects_unknown_image_source() -> None:
    media = normalize_cultural_media(
        hero_image_url="https://example.com/photo.jpg",
        image_source="google_scraping",
        photo_credit="Unknown",
    )
    assert media.image_source is None
    assert media.hero_image_url == "https://example.com/photo.jpg"


def test_normalize_photo_credit_fallback() -> None:
    media = normalize_cultural_media(image_credit="Crédit legacy")
    assert media.photo_credit == "Crédit legacy"
    assert media.image_credit == "Crédit legacy"


def test_normalize_rejects_non_https_url() -> None:
    media = normalize_cultural_media(hero_image_url="ftp://example.com/a.jpg")
    assert media.hero_image_url is None
    assert media.image_url is None
