"""Password hashing, JWT access tokens, opaque refresh token hashing."""

from __future__ import annotations

import hashlib
import re
import secrets
import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

from app.core.config import Settings, get_settings
from app.core.errors import AppError

_password_hasher = PasswordHasher()

_PASSWORD_MIN_LENGTH = 12
_PASSWORD_UPPER = re.compile(r"[A-Z]")
_PASSWORD_LOWER = re.compile(r"[a-z]")
_PASSWORD_DIGIT = re.compile(r"\d")


def normalize_email(email: str) -> str:
    return email.strip().lower()


def validate_password_strength(password: str) -> None:
    if len(password) > 128:
        raise AppError(
            status_code=422,
            code="WEAK_PASSWORD",
            detail="Le mot de passe ne doit pas dépasser 128 caractères.",
        )
    if len(password) < _PASSWORD_MIN_LENGTH:
        raise AppError(
            status_code=422,
            code="WEAK_PASSWORD",
            detail="Le mot de passe doit contenir au moins 12 caractères.",
        )
    if _PASSWORD_UPPER.search(password) is None:
        raise AppError(
            status_code=422,
            code="WEAK_PASSWORD",
            detail="Le mot de passe doit contenir au moins une majuscule.",
        )
    if _PASSWORD_LOWER.search(password) is None:
        raise AppError(
            status_code=422,
            code="WEAK_PASSWORD",
            detail="Le mot de passe doit contenir au moins une minuscule.",
        )
    if _PASSWORD_DIGIT.search(password) is None:
        raise AppError(
            status_code=422,
            code="WEAK_PASSWORD",
            detail="Le mot de passe doit contenir au moins un chiffre.",
        )


def hash_password(password: str) -> str:
    validate_password_strength(password)
    return _password_hasher.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    try:
        return _password_hasher.verify(hashed_password, password)
    except VerifyMismatchError:
        return False


def generate_opaque_token() -> str:
    return secrets.token_urlsafe(64)


def generate_temporary_password() -> str:
    """Generate a one-time bootstrap password meeting platform strength rules."""
    for _ in range(32):
        core = secrets.token_urlsafe(16)
        candidate = f"Yn{core}9A"
        try:
            validate_password_strength(candidate)
            return candidate
        except AppError:
            continue
    raise RuntimeError("Unable to generate a compliant temporary password.")


def hash_refresh_token(raw_token: str, pepper: str = "") -> str:
    payload = f"{pepper}{raw_token}".encode()
    return hashlib.sha256(payload).hexdigest()


def create_access_token(user_id: uuid.UUID, settings: Settings | None = None) -> str:
    settings = settings or get_settings()
    now = datetime.now(UTC)
    expires = now + timedelta(minutes=settings.access_token_expire_minutes)
    payload: dict[str, Any] = {
        "sub": str(user_id),
        "type": "access",
        "iat": now,
        "exp": expires,
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str, settings: Settings | None = None) -> dict[str, Any]:
    settings = settings or get_settings()
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
    except jwt.PyJWTError as exc:
        raise AppError(
            status_code=401,
            code="UNAUTHORIZED",
            detail="Token d'accès invalide ou expiré.",
        ) from exc
    if payload.get("type") != "access":
        raise AppError(
            status_code=401,
            code="UNAUTHORIZED",
            detail="Token d'accès invalide ou expiré.",
        )
    return payload
