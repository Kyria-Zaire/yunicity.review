"""Presence credentials: QR token and manual code (PASSPORT-PRESENCE-01, ADR § 6).

Pure functions only: generation, strict parsing, normalisation and peppered HMAC.
No I/O, no logging. Clear values never leave this module except through
``IssuedCredentials``, whose representation is redacted.

- QR token: ``secrets.token_urlsafe(32)`` (256 bits), presented as ``YNCP2:<token>``.
- Manual code: 8 independent ``secrets.choice`` draws in Crockford Base32 (40 bits),
  presented as ``XXXX-XXXX``. It is never derived from the QR token (B7).
- Storage: ``HMAC-SHA256(pepper, "qr:" + token)`` and
  ``HMAC-SHA256(pepper, "code:" + normalised_code)``; the prefixes separate the domains.
"""

from __future__ import annotations

import hashlib
import hmac
import secrets
from dataclasses import dataclass, field

from app.core.presence_constants import (
    PRESENCE_MANUAL_CODE_ALPHABET,
    PRESENCE_MANUAL_CODE_LENGTH,
    PRESENCE_MANUAL_CODE_MAX_INPUT_LENGTH,
    PRESENCE_QR_PREFIX,
    PRESENCE_QR_TOKEN_BYTES,
    PRESENCE_QR_TOKEN_LENGTH,
    PRESENCE_TOKEN_PEPPER_MIN_LENGTH,
    PresenceSource,
)

_QR_DOMAIN = "qr:"
_CODE_DOMAIN = "code:"
_BASE64URL_ALPHABET = frozenset("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_")
_MANUAL_CODE_ALPHABET = frozenset(PRESENCE_MANUAL_CODE_ALPHABET)
#: Crockford decoding of characters that are easy to confuse when typed.
_MANUAL_CODE_ALIASES = str.maketrans({"I": "1", "L": "1", "O": "0"})
_MANUAL_CODE_SEPARATORS = str.maketrans("", "", " -")


class PresencePepperError(RuntimeError):
    """Raised instead of computing an HMAC with a missing or too short pepper.

    The message never contains the pepper. Configuration validation already refuses to
    start with the flag on and an invalid pepper; this is a defensive second barrier.
    """


@dataclass(frozen=True, slots=True)
class IssuedCredentials:
    """Clear credentials returned once to the participant, with their digests.

    ``repr`` is redacted so that a clear value cannot reach a log line, a traceback or
    an error report by accident.
    """

    qr_token: str = field(repr=False)
    manual_code: str = field(repr=False)
    qr_token_hmac: str = field(repr=False)
    manual_code_hmac: str = field(repr=False)

    @property
    def qr_payload(self) -> str:
        return format_qr_payload(self.qr_token)

    @property
    def manual_code_display(self) -> str:
        return format_manual_code(self.manual_code)


@dataclass(frozen=True, slots=True)
class CredentialDigest:
    """A credential reduced to its source and digest: the only form used for lookups."""

    source: PresenceSource
    digest: str = field(repr=False)


def generate_qr_token() -> str:
    return secrets.token_urlsafe(PRESENCE_QR_TOKEN_BYTES)


def generate_manual_code() -> str:
    """Eight independent draws; returned normalised (no separator)."""
    return "".join(
        secrets.choice(PRESENCE_MANUAL_CODE_ALPHABET) for _ in range(PRESENCE_MANUAL_CODE_LENGTH)
    )


def format_qr_payload(token: str) -> str:
    return f"{PRESENCE_QR_PREFIX}{token}"


def format_manual_code(code: str) -> str:
    half = PRESENCE_MANUAL_CODE_LENGTH // 2
    return f"{code[:half]}-{code[half:]}"


def parse_qr_payload(value: str) -> str | None:
    """Return the token of a well-formed ``YNCP2:`` payload, ``None`` otherwise.

    Strict: exact prefix, exact length, base64url alphabet only. A malformed payload is
    refused here, before any database lookup.
    """
    if len(value) != len(PRESENCE_QR_PREFIX) + PRESENCE_QR_TOKEN_LENGTH:
        return None
    if not value.startswith(PRESENCE_QR_PREFIX):
        return None
    token = value[len(PRESENCE_QR_PREFIX) :]
    if not all(char in _BASE64URL_ALPHABET for char in token):
        return None
    return token


def normalize_manual_code(value: str) -> str | None:
    """Normalise a typed manual code, ``None`` if it cannot be a valid code.

    Upper case, spaces and hyphens removed, ``I``/``L`` -> ``1``, ``O`` -> ``0``. Any
    other character, or a length other than 8, makes the input invalid. A malformed
    input is refused here, before any database lookup.
    """
    if len(value) > PRESENCE_MANUAL_CODE_MAX_INPUT_LENGTH:
        return None
    normalised = value.upper().translate(_MANUAL_CODE_SEPARATORS).translate(_MANUAL_CODE_ALIASES)
    if len(normalised) != PRESENCE_MANUAL_CODE_LENGTH:
        return None
    if not all(char in _MANUAL_CODE_ALPHABET for char in normalised):
        return None
    return normalised


def _pepper_key(pepper: str) -> bytes:
    key = pepper.strip()
    if len(key) < PRESENCE_TOKEN_PEPPER_MIN_LENGTH:
        raise PresencePepperError("presence token pepper is missing or too short")
    return key.encode("utf-8")


def _hmac_hex(pepper: str, domain: str, value: str) -> str:
    message = (domain + value).encode("utf-8")
    return hmac.new(_pepper_key(pepper), message, hashlib.sha256).hexdigest()


def qr_token_hmac(token: str, pepper: str) -> str:
    return _hmac_hex(pepper, _QR_DOMAIN, token)


def manual_code_hmac(normalised_code: str, pepper: str) -> str:
    return _hmac_hex(pepper, _CODE_DOMAIN, normalised_code)


def issue_credentials(pepper: str) -> IssuedCredentials:
    """Draw a fresh, independent QR token and manual code, with their digests."""
    token = generate_qr_token()
    code = generate_manual_code()
    return IssuedCredentials(
        qr_token=token,
        manual_code=code,
        qr_token_hmac=qr_token_hmac(token, pepper),
        manual_code_hmac=manual_code_hmac(code, pepper),
    )


def credential_digest(credential_type: str, value: str, pepper: str) -> CredentialDigest | None:
    """Reduce an agent-supplied credential to its digest; ``None`` if malformed.

    ``credential_type`` is ``"qr"`` or ``"manual"`` (PRD § 6). Used by 01C; the clear
    value is dropped as soon as the digest is computed.
    """
    if credential_type == "qr":
        token = parse_qr_payload(value)
        if token is None:
            return None
        return CredentialDigest(source=PresenceSource.SCAN, digest=qr_token_hmac(token, pepper))
    if credential_type == "manual":
        code = normalize_manual_code(value)
        if code is None:
            return None
        return CredentialDigest(source=PresenceSource.MANUAL, digest=manual_code_hmac(code, pepper))
    return None
