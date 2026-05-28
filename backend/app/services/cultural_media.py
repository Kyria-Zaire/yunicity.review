"""Cultural place media normalization (WEB-SEARCH-02B.1)."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Final
from urllib.parse import urlparse

ALLOWED_IMAGE_EXTENSIONS: Final[tuple[str, ...]] = (
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".gif",
)

ALLOWED_IMAGE_SOURCES: Final[frozenset[str]] = frozenset(
    {
        "wikimedia_commons",
        "unsplash",
        "openverse",
        "official",
        "yunicity_asset",
    }
)

_GALLERY_KEYS = ("url", "alt", "credit", "source")


@dataclass(frozen=True, slots=True)
class NormalizedCulturalMedia:
    image_url: str | None
    hero_image_url: str | None
    thumbnail_image_url: str | None
    gallery_images: list[dict[str, str | None]]
    photo_credit: str | None
    image_credit: str | None
    image_source: str | None
    editorial_excerpt: str | None
    image_blurhash: str | None


def _clean_text(value: str | None, *, max_len: int) -> str | None:
    if value is None:
        return None
    trimmed = value.strip()
    if not trimmed:
        return None
    return trimmed[:max_len]


def _normalize_url(url: str | None) -> str | None:
    if url is None:
        return None
    trimmed = url.strip()
    if not trimmed:
        return None
    parsed = urlparse(trimmed)
    if parsed.scheme not in {"http", "https"}:
        return None
    if not parsed.netloc:
        return None

    path_lower = (parsed.path or "").lower()
    has_allowed_ext = any(path_lower.endswith(ext) for ext in ALLOWED_IMAGE_EXTENSIONS)
    if not has_allowed_ext:
        netloc = parsed.netloc.lower()
        query_lower = parsed.query.lower()

        # Unsplash image URLs often omit the extension in the path, while
        # the format is specified via query params (e.g. `fm=jpg` + `auto=format`).
        if "images.unsplash.com" in netloc:
            if "auto=format" in query_lower or "fm=jpg" in query_lower or "fm=png" in query_lower:
                return trimmed[:500]
            return None

        # Wikimedia Special:FilePath redirects without file extension in path.
        if "wikimedia.org" not in netloc and "commons.wikimedia.org" not in netloc:
            return None

    return trimmed[:500]


def _normalize_gallery_item(raw: Any) -> dict[str, str | None] | None:
    if not isinstance(raw, dict):
        return None
    url = _normalize_url(str(raw.get("url", "")) if raw.get("url") is not None else None)
    if url is None:
        return None
    source = _clean_text(
        str(raw.get("source")) if raw.get("source") is not None else None,
        max_len=64,
    )
    if source is not None and source not in ALLOWED_IMAGE_SOURCES:
        source = None
    return {
        "url": url,
        "alt": _clean_text(
            str(raw.get("alt")) if raw.get("alt") is not None else None,
            max_len=255,
        ),
        "credit": _clean_text(
            str(raw.get("credit")) if raw.get("credit") is not None else None,
            max_len=255,
        ),
        "source": source,
    }


def _dedupe_gallery(items: list[dict[str, str | None]]) -> list[dict[str, str | None]]:
    seen: set[str] = set()
    unique: list[dict[str, str | None]] = []
    for item in items:
        url = item.get("url")
        if not url or url in seen:
            continue
        seen.add(url)
        unique.append(item)
    return unique


def normalize_cultural_media(
    *,
    image_url: str | None = None,
    hero_image_url: str | None = None,
    thumbnail_image_url: str | None = None,
    gallery_images: list[Any] | None = None,
    photo_credit: str | None = None,
    image_credit: str | None = None,
    image_source: str | None = None,
    editorial_excerpt: str | None = None,
    image_blurhash: str | None = None,
) -> NormalizedCulturalMedia:
    """Normalize URLs, gallery payload, credits, and legacy image_url compatibility."""

    cleaned_hero = _normalize_url(hero_image_url) or _normalize_url(image_url)
    cleaned_legacy = _normalize_url(image_url) or cleaned_hero

    gallery: list[dict[str, str | None]] = []
    if gallery_images:
        for raw in gallery_images:
            item = _normalize_gallery_item(raw)
            if item is not None:
                gallery.append(item)

    gallery = _dedupe_gallery(gallery)

    if cleaned_hero is None and gallery:
        cleaned_hero = gallery[0].get("url")

    cleaned_thumbnail = _normalize_url(thumbnail_image_url) or cleaned_hero

    credit = _clean_text(photo_credit, max_len=255) or _clean_text(image_credit, max_len=255)
    legacy_credit = _clean_text(image_credit, max_len=255) or credit

    source = _clean_text(image_source, max_len=64)
    if source is not None and source not in ALLOWED_IMAGE_SOURCES:
        source = None

    excerpt = _clean_text(editorial_excerpt, max_len=2000)
    blurhash = _clean_text(image_blurhash, max_len=64)

    return NormalizedCulturalMedia(
        image_url=cleaned_legacy,
        hero_image_url=cleaned_hero,
        thumbnail_image_url=cleaned_thumbnail,
        gallery_images=gallery,
        photo_credit=credit,
        image_credit=legacy_credit,
        image_source=source,
        editorial_excerpt=excerpt,
        image_blurhash=blurhash,
    )


def gallery_for_api(gallery: list[dict[str, str | None]] | None) -> list[dict[str, str | None]]:
    if not gallery:
        return []
    return [{key: item.get(key) for key in _GALLERY_KEYS} for item in gallery]
