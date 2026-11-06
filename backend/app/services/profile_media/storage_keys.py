"""Cles d'objet et URL publique des medias de profil.

Source UNIQUE partagee par les deux backends. Le backend R2 construisait une URL CDN
absolue, enregistree telle quelle dans `user_profiles` : l'objet etait alors designe
directement, hors de toute route applicative. Les deux backends derivent desormais de
`profile_media_api_url`, donc aucun ne peut reintroduire une URL directe par divergence.

Avatar et banniere sont des medias de PROFIL PUBLIC : leur lecture est anonyme. Ce qui
est verrouille ici n'est pas l'identite du lecteur, mais le fait qu'un objet ne soit
servi que s'il est REELLEMENT reference par le profil demande.
"""

from __future__ import annotations

import re
import uuid

from app.core.errors import AppError
from app.core.profile_media_constants import ProfileMediaKind

PROFILE_MEDIA_EXTENSIONS = (".jpg", ".png", ".webp")

_STORAGE_KEY_RE = re.compile(
    r"^profiles/"
    r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/"
    r"(avatar|banner)\.(jpg|png|webp)$",
    re.IGNORECASE,
)

CONTENT_TYPE_BY_EXT = {
    ".jpg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
}


def build_profile_media_key(user_id: uuid.UUID, kind: ProfileMediaKind, ext: str) -> str:
    normalized_ext = ext if ext.startswith(".") else f".{ext}"
    return f"profiles/{user_id}/{kind.value}{normalized_ext}"


def list_profile_media_variant_keys(user_id: uuid.UUID, kind: ProfileMediaKind) -> list[str]:
    return [build_profile_media_key(user_id, kind, ext) for ext in PROFILE_MEDIA_EXTENSIONS]


def assert_valid_profile_media_key(storage_key: str) -> str:
    normalized = storage_key.replace("\\", "/").lstrip("/")
    if ".." in normalized.split("/") or not _STORAGE_KEY_RE.fullmatch(normalized):
        raise AppError(
            status_code=400,
            code="PROFILE_MEDIA_INVALID_STORAGE_KEY",
            detail="Clé de stockage profil invalide.",
        )
    return normalized


def profile_media_api_url(api_v1_prefix: str, storage_key: str) -> str:
    """URL enregistree en base : TOUJOURS la route API, jamais un objet direct."""
    key = assert_valid_profile_media_key(storage_key)
    _prefix, user_id, filename = key.split("/")
    return f"{api_v1_prefix.rstrip('/')}/profile-media/{user_id}/{filename}"


def profile_media_key_for(user_id: uuid.UUID, filename: str) -> str:
    """Cle confinee derivee des segments d'URL, validee avant tout acces au stockage."""
    return assert_valid_profile_media_key(f"profiles/{user_id}/{filename}")
