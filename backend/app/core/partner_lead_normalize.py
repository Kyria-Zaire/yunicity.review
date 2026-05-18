"""Partner lead field normalization helpers."""

from __future__ import annotations


def normalize_instagram(value: str | None) -> str:
    if not value:
        return ""
    cleaned = value.strip().lower()
    cleaned = cleaned.removeprefix("https://instagram.com/")
    cleaned = cleaned.removeprefix("https://www.instagram.com/")
    cleaned = cleaned.removeprefix("instagram.com/")
    cleaned = cleaned.lstrip("@").strip("/")
    return cleaned
