"""Protection multicouche des inscriptions — AUTH-04A.

Trois propriétés structurent ce fichier, et chacune répare un défaut mesuré :

1. **Aucune adresse en clair dans Redis.** Les clés portaient l'adresse telle
   quelle, faisant de Redis un index énumérable des comptes.
2. **Une fenêtre toujours bornée.** `INCR` et `EXPIRE` séparés laissaient, en cas
   d'échec entre les deux, une clé sans expiration — donc un blocage définitif.
3. **Cent personnes derrière une seule IP doivent pouvoir s'inscrire.** C'est le
   cas qui a motivé tout le ticket.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any

import pytest
from app.core.config import Settings
from app.core.rate_limit import rate_limit_identity
from app.core.registration_mode import (
    RegistrationMode,
    resolve_registration_policy,
)
from app.integrations.turnstile import (
    TurnstileUnavailable,
    verify_turnstile_token,
)
from app.services.email_budget import EmailBudget, EmailCategory, budget_key

_JWT = "dev-only-insecure-jwt-secret-change-in-env-32chars"


def _settings(**kwargs: Any) -> Settings:
    return Settings(JWT_SECRET_KEY=_JWT, **kwargs)


# ------------------------------------------------------------ clés sans PII


def test_no_raw_email_ever_appears_in_a_rate_limit_key() -> None:
    adresse = "citoyen.test@example.com"
    empreinte = rate_limit_identity(adresse)

    assert adresse not in empreinte
    assert "@" not in empreinte
    assert "example.com" not in empreinte
    # Une clé complète, telle qu'elle atterrit dans Redis.
    assert adresse not in f"rl:register:email:{empreinte}"


def test_the_identity_is_stable_for_the_same_pepper(monkeypatch: pytest.MonkeyPatch) -> None:
    """Un compteur n'a de sens que si la même adresse donne toujours la même clé."""
    from app.core.config import get_settings

    monkeypatch.setenv("RATE_LIMIT_KEY_PEPPER", "pepper-stable-auth04a")
    get_settings.cache_clear()
    try:
        premier = rate_limit_identity("citoyen@example.com")
        second = rate_limit_identity("citoyen@example.com")
        assert premier == second
        assert rate_limit_identity("autre@example.com") != premier
    finally:
        get_settings.cache_clear()


def test_a_different_pepper_yields_a_different_identity(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Une rotation de pepper doit invalider les compteurs, pas les conserver."""
    from app.core.config import get_settings

    empreintes = set()
    for pepper in ("pepper-un-auth04a", "pepper-deux-auth04a"):
        monkeypatch.setenv("RATE_LIMIT_KEY_PEPPER", pepper)
        get_settings.cache_clear()
        empreintes.add(rate_limit_identity("citoyen@example.com"))
    get_settings.cache_clear()

    assert len(empreintes) == 2


def test_the_rate_limit_pepper_is_distinct_from_the_token_peppers() -> None:
    settings = _settings(
        RATE_LIMIT_KEY_PEPPER="pepper-limitation",
        REFRESH_TOKEN_PEPPER="pepper-refresh",
        EMAIL_VERIFICATION_TOKEN_PEPPER="pepper-verification",
    )
    peppers = {
        settings.rate_limit_key_pepper,
        settings.refresh_token_pepper,
        settings.email_verification_token_pepper,
    }
    assert len(peppers) == 3, "chaque pepper doit avoir son propre role"


def test_identities_are_not_reversible_by_simple_lowercasing() -> None:
    """L'empreinte est un HMAC : sa longueur et son alphabet le montrent."""
    empreinte = rate_limit_identity("citoyen@example.com")
    assert len(empreinte) == 32
    assert all(c in "0123456789abcdef" for c in empreinte)


# ------------------------------------------------------------------- modes


def test_closed_mode_refuses_and_carries_no_turnstile_requirement() -> None:
    policy = resolve_registration_policy(_settings(REGISTRATION_MODE="closed"))
    assert policy.mode is RegistrationMode.CLOSED
    assert policy.open is False
    assert policy.turnstile_required is False


def test_pilot_mode_tolerates_a_shared_network() -> None:
    policy = resolve_registration_policy(_settings(REGISTRATION_MODE="pilot"))
    assert policy.open is True
    assert policy.ip_hourly_limit >= 100, (
        "une salle de 100 personnes derriere une seule IP doit passer"
    )


def test_public_mode_always_requires_turnstile() -> None:
    """Non configurable : c'est la couche qui distingue PUBLIC de PILOT."""
    policy = resolve_registration_policy(
        _settings(REGISTRATION_MODE="public", TURNSTILE_REQUIRED_IN_PILOT=False)
    )
    assert policy.turnstile_required is True


def test_an_unset_mode_preserves_the_existing_deployment_behaviour() -> None:
    """Installer cette version ne doit changer le comportement d'aucun déploiement."""
    ouvert = resolve_registration_policy(_settings(REGISTRATION_ENABLED=True))
    ferme = resolve_registration_policy(_settings(REGISTRATION_ENABLED=False))

    assert ouvert.open is True and ouvert.mode is RegistrationMode.PILOT
    assert ferme.open is False and ferme.mode is RegistrationMode.CLOSED


def test_the_declared_mode_wins_over_the_legacy_flag() -> None:
    policy = resolve_registration_policy(
        _settings(REGISTRATION_MODE="closed", REGISTRATION_ENABLED=True)
    )
    assert policy.open is False


def test_the_pilot_closing_date_is_exposed_as_aware() -> None:
    policy = resolve_registration_policy(
        _settings(REGISTRATION_MODE="pilot", REGISTRATION_CLOSES_AT="2026-09-12T07:36:04+00:00")
    )
    assert policy.closes_at is not None
    assert policy.closes_at.tzinfo is not None


# --------------------------------------------------------------- Turnstile


class _Reponse:
    def __init__(self, status_code: int, body: Any, headers: dict[str, str] | None = None):
        self.status_code = status_code
        self._body = body
        self.headers = headers or {}

    def json(self) -> Any:
        if isinstance(self._body, Exception):
            raise self._body
        return self._body


def _patch_siteverify(monkeypatch: pytest.MonkeyPatch, resultat: Any) -> None:
    class _Client:
        async def __aenter__(self) -> _Client:
            return self

        async def __aexit__(self, *_a: object) -> None:
            return None

        async def post(self, *_a: object, **_k: object) -> Any:
            if isinstance(resultat, Exception):
                raise resultat
            return resultat

    monkeypatch.setattr("app.integrations.turnstile.httpx.AsyncClient", lambda **_k: _Client())


def _turnstile_settings(**kwargs: Any) -> Settings:
    return _settings(TURNSTILE_SECRET_KEY="secret-de-test", **kwargs)


@pytest.mark.asyncio
async def test_a_valid_token_is_accepted(monkeypatch: pytest.MonkeyPatch) -> None:
    _patch_siteverify(
        monkeypatch,
        _Reponse(200, {"success": True, "hostname": "yunicity.city", "action": "register"}),
    )
    verdict = await verify_turnstile_token(
        "jeton", settings=_turnstile_settings(TURNSTILE_EXPECTED_HOSTNAME="yunicity.city")
    )
    assert verdict.success is True


@pytest.mark.asyncio
async def test_an_absent_token_is_refused_without_calling_the_provider() -> None:
    verdict = await verify_turnstile_token("   ", settings=_turnstile_settings())
    assert verdict.success is False
    assert "missing-input-response" in verdict.codes


@pytest.mark.asyncio
async def test_a_replayed_token_is_refused(monkeypatch: pytest.MonkeyPatch) -> None:
    """Cloudflare marque un jeton déjà validé `timeout-or-duplicate`."""
    _patch_siteverify(
        monkeypatch,
        _Reponse(200, {"success": False, "error-codes": ["timeout-or-duplicate"]}),
    )
    verdict = await verify_turnstile_token("jeton", settings=_turnstile_settings())
    assert verdict.success is False
    assert "timeout-or-duplicate" in verdict.codes


@pytest.mark.asyncio
async def test_a_token_from_another_host_is_refused(monkeypatch: pytest.MonkeyPatch) -> None:
    _patch_siteverify(
        monkeypatch, _Reponse(200, {"success": True, "hostname": "site-copie.example"})
    )
    verdict = await verify_turnstile_token(
        "jeton", settings=_turnstile_settings(TURNSTILE_EXPECTED_HOSTNAME="yunicity.city")
    )
    assert verdict.success is False
    assert "hostname-mismatch" in verdict.codes


@pytest.mark.asyncio
async def test_a_token_from_another_action_is_refused(monkeypatch: pytest.MonkeyPatch) -> None:
    _patch_siteverify(monkeypatch, _Reponse(200, {"success": True, "action": "login"}))
    verdict = await verify_turnstile_token(
        "jeton", settings=_turnstile_settings(), expected_action="register"
    )
    assert verdict.success is False
    assert "action-mismatch" in verdict.codes


@pytest.mark.asyncio
async def test_an_old_challenge_is_refused(monkeypatch: pytest.MonkeyPatch) -> None:
    """Cinq minutes, imposées par nous et non par le fournisseur."""
    vieux = (datetime.now(UTC) - timedelta(minutes=30)).isoformat()
    _patch_siteverify(monkeypatch, _Reponse(200, {"success": True, "challenge_ts": vieux}))
    verdict = await verify_turnstile_token("jeton", settings=_turnstile_settings())
    assert verdict.success is False
    assert "challenge-expired" in verdict.codes


@pytest.mark.asyncio
async def test_a_recent_challenge_is_accepted(monkeypatch: pytest.MonkeyPatch) -> None:
    recent = (datetime.now(UTC) - timedelta(seconds=20)).isoformat()
    _patch_siteverify(monkeypatch, _Reponse(200, {"success": True, "challenge_ts": recent}))
    assert (await verify_turnstile_token("jeton", settings=_turnstile_settings())).success


@pytest.mark.asyncio
async def test_a_malformed_body_is_an_outage_not_a_verdict(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Ne jamais accepter faute de comprendre la réponse."""
    _patch_siteverify(monkeypatch, _Reponse(200, ValueError("pas du json")))
    with pytest.raises(TurnstileUnavailable):
        await verify_turnstile_token("jeton", settings=_turnstile_settings())


@pytest.mark.asyncio
async def test_a_network_failure_is_an_outage(monkeypatch: pytest.MonkeyPatch) -> None:
    import httpx

    _patch_siteverify(monkeypatch, httpx.ConnectError("injoignable"))
    with pytest.raises(TurnstileUnavailable):
        await verify_turnstile_token("jeton", settings=_turnstile_settings())


@pytest.mark.asyncio
async def test_a_provider_5xx_is_an_outage(monkeypatch: pytest.MonkeyPatch) -> None:
    _patch_siteverify(monkeypatch, _Reponse(503, {}))
    with pytest.raises(TurnstileUnavailable):
        await verify_turnstile_token("jeton", settings=_turnstile_settings())


@pytest.mark.asyncio
async def test_a_missing_secret_is_an_outage_not_a_silent_pass() -> None:
    """Sans secret, on ne laisse pas passer : on signale l'indisponibilité."""
    with pytest.raises(TurnstileUnavailable):
        await verify_turnstile_token("jeton", settings=_settings())


# ------------------------------------------------------------ budget e-mail


def test_the_budget_key_follows_the_utc_day() -> None:
    veille = datetime(2026, 9, 11, 23, 59, 59, tzinfo=UTC)
    lendemain = datetime(2026, 9, 12, 0, 0, 1, tzinfo=UTC)
    assert budget_key(veille) != budget_key(lendemain)
    assert budget_key(veille).endswith("20260911")
    assert budget_key(lendemain).endswith("20260912")


@pytest.mark.asyncio
async def test_no_budget_configured_never_blocks() -> None:
    budget = EmailBudget(_settings(EMAIL_DAILY_BUDGET=0))
    assert await budget.try_consume(EmailCategory.ROUTINE) is True


@pytest.mark.asyncio
async def test_routine_email_stops_before_the_reserve(monkeypatch: pytest.MonkeyPatch) -> None:
    """Une vague d'inscriptions ne doit pas épuiser la récupération de compte."""
    compteur = {"valeur": 0}

    class _Redis:
        async def incr(self, _key: str) -> int:
            compteur["valeur"] += 1
            return compteur["valeur"]

        async def expire(self, _key: str, _ttl: int) -> None:
            return None

    monkeypatch.setattr("app.services.email_budget.get_redis_client", lambda: _Redis())

    budget = EmailBudget(_settings(EMAIL_DAILY_BUDGET=90, EMAIL_DAILY_BUDGET_RESERVE=10))
    resultats = [await budget.try_consume(EmailCategory.ROUTINE) for _ in range(82)]

    assert resultats[:80] == [True] * 80, "les 80 premiers envoyes doivent passer"
    assert resultats[80] is False, "le 81e entame la reserve : refuse"


@pytest.mark.asyncio
async def test_critical_email_may_use_the_reserve(monkeypatch: pytest.MonkeyPatch) -> None:
    compteur = {"valeur": 80}

    class _Redis:
        async def incr(self, _key: str) -> int:
            compteur["valeur"] += 1
            return compteur["valeur"]

        async def expire(self, _key: str, _ttl: int) -> None:
            return None

    monkeypatch.setattr("app.services.email_budget.get_redis_client", lambda: _Redis())

    budget = EmailBudget(_settings(EMAIL_DAILY_BUDGET=90, EMAIL_DAILY_BUDGET_RESERVE=10))
    # 81 a 90 : au-dela du plafond courant, mais dans la reserve critique.
    for rang in range(10):
        assert await budget.try_consume(EmailCategory.CRITICAL) is True, (
            f"la reserve critique doit couvrir l'envoi {81 + rang}"
        )
    # 91 : la reserve elle-meme est epuisee.
    assert await budget.try_consume(EmailCategory.CRITICAL) is False


# Le fail-open du budget a ete RETIRE par AUTH-04A-CORRECTION-01 : sans compteur
# lisible, rien ne garantit qu'on n'epuise pas le quota du fournisseur. Le
# comportement de remplacement est verifie dans
# `test_registration_protection_correction.py`.
