"""Unit tests for presence credentials (PASSPORT-PRESENCE-01B, ADR § 6). No I/O."""

from __future__ import annotations

import hashlib
import hmac
import secrets
from collections.abc import Callable

import pytest
from app.core import presence_credentials as pc
from app.core.presence_constants import (
    PRESENCE_MANUAL_CODE_ALPHABET,
    PRESENCE_QR_PREFIX,
    PRESENCE_QR_TOKEN_LENGTH,
    PresenceSource,
)

# Test-only value, long enough for the minimum length; not a secret of any environment.
PEPPER = "unit-test-presence-pepper-0123456789abcdef"
OTHER_PEPPER = "another-unit-test-presence-pepper-0123456789"
BASE64URL = set("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_")


# --- QR token -----------------------------------------------------------------------


def test_qr_token_has_256_bits_in_base64url() -> None:
    token = pc.generate_qr_token()
    assert len(token) == PRESENCE_QR_TOKEN_LENGTH == 43
    assert set(token) <= BASE64URL


def test_qr_tokens_do_not_repeat() -> None:
    tokens = {pc.generate_qr_token() for _ in range(2000)}
    assert len(tokens) == 2000


def test_qr_payload_round_trip() -> None:
    token = pc.generate_qr_token()
    payload = pc.format_qr_payload(token)
    assert payload == f"YNCP2:{token}"
    assert pc.parse_qr_payload(payload) == token


@pytest.mark.parametrize(
    "mutate",
    [
        pytest.param(lambda t: t, id="no-prefix"),
        pytest.param(lambda t: f"YNCP1:{t}", id="static-passport-scheme"),
        pytest.param(lambda t: f"yncp2:{t}", id="lowercase-prefix"),
        pytest.param(lambda t: f"YNCP2:{t[:-1]}", id="one-char-short"),
        pytest.param(lambda t: f"YNCP2:{t}A", id="one-char-long"),
        pytest.param(lambda t: f"YNCP2:{t[:-1]}+", id="base64-plus"),
        pytest.param(lambda t: f"YNCP2:{t[:-1]}/", id="base64-slash"),
        pytest.param(lambda t: f"YNCP2:{t[:-1]}=", id="padding"),
        pytest.param(lambda t: f"YNCP2:{t[:-1]} ", id="trailing-space"),
        pytest.param(lambda t: f" YNCP2:{t[:-1]}", id="leading-space"),
        pytest.param(lambda t: f"YNCP2:{t[:-1]}é", id="non-ascii"),
        pytest.param(lambda t: "", id="empty"),
    ],
)
def test_malformed_qr_payload_is_refused(mutate: Callable[[str], str]) -> None:
    token = pc.generate_qr_token()
    assert pc.parse_qr_payload(mutate(token)) is None


# --- Manual code --------------------------------------------------------------------


def test_manual_code_has_eight_crockford_characters() -> None:
    for _ in range(500):
        code = pc.generate_manual_code()
        assert len(code) == 8
        assert set(code) <= set(PRESENCE_MANUAL_CODE_ALPHABET)
        assert not set(code) & set("ILOU")


def test_manual_code_draws_cover_the_whole_alphabet() -> None:
    seen = set("".join(pc.generate_manual_code() for _ in range(4000)))
    assert seen == set(PRESENCE_MANUAL_CODE_ALPHABET)


def test_manual_code_is_independent_from_the_qr_token(monkeypatch: pytest.MonkeyPatch) -> None:
    """Freezing the QR generator must not freeze the code (B7: no derivation)."""
    monkeypatch.setattr(secrets, "token_urlsafe", lambda nbytes=None: "A" * 43)
    issued = [pc.issue_credentials(PEPPER) for _ in range(50)]
    assert {i.qr_token for i in issued} == {"A" * 43}
    assert len({i.manual_code for i in issued}) > 1
    for item in issued:
        assert item.manual_code not in item.qr_token


def test_manual_code_display_round_trip() -> None:
    code = pc.generate_manual_code()
    display = pc.format_manual_code(code)
    assert display == f"{code[:4]}-{code[4:]}"
    assert pc.normalize_manual_code(display) == code


@pytest.mark.parametrize(
    ("typed", "expected"),
    [
        ("ABCD-EFGH", "ABCDEFGH"),
        ("abcd-efgh", "ABCDEFGH"),
        ("ABCDEFGH", "ABCDEFGH"),
        (" ab cd - ef gh ", "ABCDEFGH"),
        ("IiLl-oO00", "11110000"),
        ("--12-34-56-78--", "12345678"),
    ],
)
def test_manual_code_normalisation(typed: str, expected: str) -> None:
    assert pc.normalize_manual_code(typed) == expected


@pytest.mark.parametrize(
    "typed",
    [
        pytest.param("ABCD-EFGU", id="u-not-in-alphabet"),
        pytest.param("ABCD-EFG", id="seven-characters"),
        pytest.param("ABCD-EFGHJ", id="nine-characters"),
        pytest.param("ABCD_EFGH", id="underscore"),
        pytest.param("ABCD\tEFGH", id="tab"),
        pytest.param("ABCD EFGH", id="non-breaking-space"),
        pytest.param("ABCD-EFGÉ", id="non-ascii"),
        pytest.param("ＡＢＣＤ-ＥＦＧＨ", id="fullwidth"),
        pytest.param(" " * 30 + "ABCDEFGH", id="too-long-input"),
        pytest.param("", id="empty"),
    ],
)
def test_invalid_manual_code_is_refused(typed: str) -> None:
    assert pc.normalize_manual_code(typed) is None


# --- HMAC ---------------------------------------------------------------------------


def _reference_hmac(pepper: str, message: str) -> str:
    return hmac.new(pepper.encode(), message.encode(), hashlib.sha256).hexdigest()


def test_hmac_known_answer_with_domain_prefixes() -> None:
    assert pc.qr_token_hmac("tok", PEPPER) == _reference_hmac(PEPPER, "qr:tok")
    assert pc.manual_code_hmac("ABCDEFGH", PEPPER) == _reference_hmac(PEPPER, "code:ABCDEFGH")


def test_hmac_domains_are_separated() -> None:
    value = "ABCDEFGH"
    assert pc.qr_token_hmac(value, PEPPER) != pc.manual_code_hmac(value, PEPPER)


def test_hmac_is_64_lowercase_hex_and_deterministic() -> None:
    digest = pc.qr_token_hmac("tok", PEPPER)
    assert len(digest) == 64
    assert set(digest) <= set("0123456789abcdef")
    assert digest == pc.qr_token_hmac("tok", PEPPER)


def test_hmac_depends_on_the_pepper() -> None:
    assert pc.qr_token_hmac("tok", PEPPER) != pc.qr_token_hmac("tok", OTHER_PEPPER)


def test_pepper_surrounding_whitespace_is_ignored() -> None:
    assert pc.qr_token_hmac("tok", f"  {PEPPER}\n") == pc.qr_token_hmac("tok", PEPPER)


@pytest.mark.parametrize("pepper", ["", "   ", "x" * 31, " " * 10 + "x" * 31 + " " * 10])
def test_missing_or_short_pepper_refuses_to_compute(pepper: str) -> None:
    with pytest.raises(pc.PresencePepperError) as excinfo:
        pc.qr_token_hmac("tok", pepper)
    with pytest.raises(pc.PresencePepperError):
        pc.manual_code_hmac("ABCDEFGH", pepper)
    with pytest.raises(pc.PresencePepperError):
        pc.issue_credentials(pepper)
    if pepper.strip():
        assert pepper.strip() not in str(excinfo.value)


# --- Issued credentials and lookup digests ------------------------------------------


def test_issued_credentials_digests_match_their_clear_values() -> None:
    issued = pc.issue_credentials(PEPPER)
    assert issued.qr_token_hmac == pc.qr_token_hmac(issued.qr_token, PEPPER)
    assert issued.manual_code_hmac == pc.manual_code_hmac(issued.manual_code, PEPPER)
    assert issued.qr_payload == PRESENCE_QR_PREFIX + issued.qr_token
    assert pc.normalize_manual_code(issued.manual_code_display) == issued.manual_code


def test_issued_credentials_representation_reveals_nothing() -> None:
    issued = pc.issue_credentials(PEPPER)
    for rendering in (repr(issued), str(issued), f"{issued}", f"{issued!r}"):
        for secret in (
            issued.qr_token,
            issued.manual_code,
            issued.manual_code_display,
            issued.qr_token_hmac,
            issued.manual_code_hmac,
        ):
            assert secret not in rendering


def test_credential_digest_for_a_qr_payload() -> None:
    issued = pc.issue_credentials(PEPPER)
    digest = pc.credential_digest("qr", issued.qr_payload, PEPPER)
    assert digest is not None
    assert digest.source is PresenceSource.SCAN
    assert digest.digest == issued.qr_token_hmac
    assert issued.qr_token_hmac not in repr(digest)


def test_credential_digest_for_a_typed_manual_code() -> None:
    issued = pc.issue_credentials(PEPPER)
    typed = issued.manual_code_display.lower()
    digest = pc.credential_digest("manual", typed, PEPPER)
    assert digest is not None
    assert digest.source is PresenceSource.MANUAL
    assert digest.digest == issued.manual_code_hmac


@pytest.mark.parametrize(
    ("credential_type", "value"),
    [
        ("qr", "YNCP1:" + "A" * 43),
        ("qr", "ABCD-EFGH"),
        ("manual", "YNCP2:" + "A" * 43),
        ("manual", "ABCD-EFGU"),
        ("nfc", "ABCD-EFGH"),
        ("", "ABCD-EFGH"),
    ],
)
def test_malformed_or_mismatched_credential_gives_no_digest(
    credential_type: str, value: str
) -> None:
    assert pc.credential_digest(credential_type, value, PEPPER) is None
