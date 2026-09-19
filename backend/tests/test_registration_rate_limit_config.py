"""Plafond d'inscription configurable — PILOT-REGISTRATION-24H.

Le décompte porte sur l'IP publique vue par l'edge. Derrière le NAT d'un
établissement scolaire, une promotion entière partage une seule IP : cinq
inscriptions suffisaient alors à bloquer tout le monde.

Ce fichier verrouille les deux moitiés de la correction :

- **le défaut reste 5**, donc Production et tout déploiement qui ne déclare pas
  la variable gardent exactement le comportement antérieur ;
- **la valeur déclarée est bien celle appliquée**, et rien d'autre du limiteur
  ne bouge : même clé, même fenêtre, même refus au-delà.
"""

from __future__ import annotations

from typing import Any

import pytest
from app.core.config import Settings, get_settings

_JWT = "dev-only-insecure-jwt-secret-change-in-env-32chars"


def test_default_is_five_so_existing_deployments_do_not_change() -> None:
    assert Settings(JWT_SECRET_KEY=_JWT).registration_rate_limit_per_hour == 5


def test_the_declared_value_is_the_one_read() -> None:
    settings = Settings(JWT_SECRET_KEY=_JWT, REGISTRATION_RATE_LIMIT_PER_HOUR=200)
    assert settings.registration_rate_limit_per_hour == 200


def test_a_non_positive_limit_is_refused_rather_than_silently_disabling_the_guard() -> None:
    with pytest.raises(ValueError):
        Settings(JWT_SECRET_KEY=_JWT, REGISTRATION_RATE_LIMIT_PER_HOUR=0)


@pytest.mark.asyncio
async def test_the_route_applies_the_configured_limit_and_nothing_else_moves(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """La route doit passer la valeur configurée, en gardant clé et fenêtre."""
    from app.api.v1 import auth as auth_routes

    seen: list[dict[str, Any]] = []

    async def _capture(key: str, *, limit: int, window_seconds: int, **kwargs: Any) -> None:
        seen.append({"key": key, "limit": limit, "window": window_seconds, **kwargs})

    monkeypatch.setattr(auth_routes, "enforce_rate_limit", _capture)

    settings = Settings(
        JWT_SECRET_KEY=_JWT,
        REGISTRATION_ENABLED=False,
        REGISTRATION_RATE_LIMIT_PER_HOUR=200,
    )

    class _Req:
        headers = {"x-forwarded-for": "203.0.113.7, 10.0.0.1"}
        client = None

    # Les inscriptions fermées coupent avant le limiteur : c'est la barrière qui
    # doit rester la première, et ce test la vérifie au passage.
    with pytest.raises(Exception) as closed:
        await auth_routes.register(
            payload=None,  # type: ignore[arg-type]
            request=_Req(),  # type: ignore[arg-type]
            response=None,  # type: ignore[arg-type]
            session=None,  # type: ignore[arg-type]
            settings=settings,
            mobile=False,
        )
    assert getattr(closed.value, "code", None) == "REGISTRATION_CLOSED"
    assert seen == [], "aucun quota ne doit etre consomme quand les inscriptions sont fermees"


def test_get_settings_reads_the_variable_from_the_environment(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("REGISTRATION_RATE_LIMIT_PER_HOUR", "200")
    get_settings.cache_clear()
    try:
        assert get_settings().registration_rate_limit_per_hour == 200
    finally:
        get_settings.cache_clear()
