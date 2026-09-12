"""Corrections AUTH-04A-CORRECTION-01.

Quatre exigences, chacune née d'un défaut du premier jet :

1. **L'IP ne doit plus jamais bloquer une salle.** 10/min rendait une
   présentation scolaire impraticable : cent personnes soumettent dans la même
   minute derrière une seule adresse publique.
2. **Le compteur par adresse ne se consomme qu'après les validations locales.**
   Une faute de frappe dans le mot de passe ne doit rien coûter.
3. **Plus de fail-open sur le budget d'e-mails.** Sans compteur lisible, rien ne
   garantit qu'on n'épuise pas le quota : on diffère l'envoi.
4. **PUBLIC mal configuré refuse d'ouvrir.** L'absence d'une site key n'est
   jamais une raison de désactiver Turnstile silencieusement.
"""

from __future__ import annotations

from typing import Any

import pytest
from app.core.config import Settings
from app.core.registration_mode import (
    RegistrationMode,
    registration_config_problems,
    resolve_registration_policy,
)
from app.services.email_budget import EmailBudget, EmailCategory

_JWT = "dev-only-insecure-jwt-secret-change-in-env-32chars"


def _settings(**kwargs: Any) -> Settings:
    return Settings(JWT_SECRET_KEY=_JWT, **kwargs)


def _public_complet(**surcharges: Any) -> Settings:
    base: dict[str, Any] = {
        "REGISTRATION_MODE": "public",
        "TURNSTILE_SITE_KEY": "1x00000000000000000000AA",
        "TURNSTILE_SECRET_KEY": "1x0000000000000000000000000000000AA",
        "TURNSTILE_EXPECTED_HOSTNAME": "yunicity.city",
        "RATE_LIMIT_KEY_PEPPER": "pepper-de-test-limitation",
        "REDIS_URL": "redis://localhost:6379/0",
    }
    base.update(surcharges)
    return _settings(**base)


# ------------------------------------------------- seuils reseau partage


@pytest.mark.parametrize("mode", ["pilot", "public"])
def test_a_classroom_is_never_blocked_by_the_ip_dimension(mode: str) -> None:
    """Cent personnes, une minute, une seule IP : les deux axes IP doivent tenir."""
    settings = (
        _public_complet(REGISTRATION_MODE=mode)
        if mode == "public"
        else _settings(REGISTRATION_MODE="pilot")
    )
    policy = resolve_registration_policy(settings)

    assert policy.ip_burst_limit >= 120, "cent soumissions dans la meme minute"
    assert policy.ip_hourly_limit >= 200, "et de la marge sur l'heure"


@pytest.mark.parametrize("mode", ["pilot", "public"])
def test_the_global_ceiling_is_the_real_protection(mode: str) -> None:
    """Le plafond global reste bas : c'est lui qui arrête un robot, pas l'IP."""
    settings = _public_complet() if mode == "public" else _settings(REGISTRATION_MODE="pilot")
    policy = resolve_registration_policy(settings)

    assert policy.global_hourly_limit == 100
    assert policy.global_hourly_limit < policy.ip_hourly_limit, (
        "le plafond global doit mordre avant la dimension IP"
    )


def test_the_email_attempt_limit_is_not_punitive() -> None:
    assert _settings().registration_email_daily_limit == 10


# ------------------------------------------ configuration PUBLIC fail-closed


def test_a_fully_configured_public_mode_has_no_problem() -> None:
    assert registration_config_problems(_public_complet()) == []


@pytest.mark.parametrize(
    "variable",
    [
        "TURNSTILE_SITE_KEY",
        "TURNSTILE_SECRET_KEY",
        "TURNSTILE_EXPECTED_HOSTNAME",
        "RATE_LIMIT_KEY_PEPPER",
        "REDIS_URL",
    ],
)
def test_each_missing_requirement_blocks_public_mode(variable: str) -> None:
    """Chacune manquante, isolément, doit suffire à refuser l'ouverture."""
    manquants = registration_config_problems(_public_complet(**{variable: ""}))
    assert manquants == [variable]


def test_an_absent_site_key_never_silently_disables_turnstile() -> None:
    """Le piège central : ne jamais convertir « pas de clé » en « pas de défi »."""
    settings = _public_complet(TURNSTILE_SITE_KEY="")
    policy = resolve_registration_policy(settings)

    assert policy.turnstile_required is True, "l'exigence reste entiere"
    assert registration_config_problems(settings, policy), "et l'ouverture est refusee"


def test_pilot_mode_does_not_demand_the_public_configuration() -> None:
    """Un pilote encadré se surveille à la main ; l'exiger ici casserait le dev local."""
    assert registration_config_problems(_settings(REGISTRATION_MODE="pilot")) == []
    assert registration_config_problems(_settings(REGISTRATION_MODE="closed")) == []


def test_public_mode_is_still_public_even_when_misconfigured() -> None:
    """Le mode ne change pas : c'est l'ouverture qui est refusée."""
    policy = resolve_registration_policy(_public_complet(RATE_LIMIT_KEY_PEPPER=""))
    assert policy.mode is RegistrationMode.PUBLIC


# ------------------------------------------------- budget desormais fail-closed


@pytest.mark.asyncio
async def test_an_unreachable_redis_now_defers_the_email(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Changement assumé : sans compteur, on n'envoie pas.

    Le compte reste créé et son jeton en base ; le renvoi régénère un lien quand
    Redis revient. Envoyer sans pouvoir compter ouvrirait une fenêtre
    d'épuisement du quota et de spam.
    """

    class _Redis:
        async def incr(self, _key: str) -> int:
            raise RuntimeError("redis down")

        async def expire(self, _key: str, _ttl: int) -> None:
            return None

    monkeypatch.setattr("app.services.email_budget.get_redis_client", lambda: _Redis())

    budget = EmailBudget(_settings(EMAIL_DAILY_BUDGET=90))
    assert await budget.try_consume(EmailCategory.CRITICAL) is False
    assert await budget.try_consume(EmailCategory.ROUTINE) is False


@pytest.mark.asyncio
async def test_a_declared_budget_without_redis_is_refused(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Un budget déclaré sans Redis est une erreur de configuration, pas un no-op."""
    monkeypatch.setattr("app.services.email_budget.get_redis_client", lambda: None)

    budget = EmailBudget(_settings(EMAIL_DAILY_BUDGET=90))
    assert await budget.try_consume(EmailCategory.CRITICAL) is False


@pytest.mark.asyncio
async def test_no_budget_declared_remains_a_deliberate_no_op(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Aucun budget : rien à garantir, donc rien à bloquer — dev local inclus."""
    monkeypatch.setattr("app.services.email_budget.get_redis_client", lambda: None)

    budget = EmailBudget(_settings(EMAIL_DAILY_BUDGET=0))
    assert await budget.try_consume(EmailCategory.CRITICAL) is True
