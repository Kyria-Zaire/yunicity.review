"""Auth endpoint integration tests."""

from typing import Any, TypedDict

import pytest
from httpx import AsyncClient, Response

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]


class RegisterResult(TypedDict):
    response: Response
    json: dict[str, Any]


async def _register(
    client: AsyncClient,
    payload: dict[str, str],
    *,
    mobile: bool = False,
) -> RegisterResult:
    headers = {"X-Client-Platform": "mobile"} if mobile else {}
    response = await client.post("/api/v1/auth/register", json=payload, headers=headers)
    return RegisterResult(response=response, json=response.json())


@pytest.mark.asyncio
async def test_register_success(auth_client: AsyncClient, register_payload: dict[str, str]) -> None:
    result = await _register(auth_client, register_payload)
    response = result["response"]
    data = result["json"]
    assert response.status_code == 201
    assert data["token_type"] == "bearer"
    assert data["expires_in"] == 900
    assert data["access_token"]
    assert data["user"]["email"] == "citoyen@example.com"
    assert data["user"]["roles"] == ["USER"]
    assert "auth.me.read" in data["user"]["permissions"]
    assert "hashed_password" not in response.text


@pytest.mark.asyncio
async def test_register_duplicate_email(
    auth_client: AsyncClient, register_payload: dict[str, str]
) -> None:
    await _register(auth_client, register_payload)
    result = await _register(auth_client, register_payload)
    assert result["response"].status_code == 409
    assert result["json"]["code"] == "EMAIL_ALREADY_EXISTS"


@pytest.mark.asyncio
async def test_register_weak_password(
    auth_client: AsyncClient, register_payload: dict[str, str]
) -> None:
    weak = {**register_payload, "password": "short"}
    result = await _register(auth_client, weak)
    assert result["response"].status_code == 422
    assert result["json"]["code"] == "WEAK_PASSWORD"


@pytest.mark.asyncio
async def test_login_success(auth_client: AsyncClient, register_payload: dict[str, str]) -> None:
    await _register(auth_client, register_payload)
    response = await auth_client.post(
        "/api/v1/auth/login",
        json={"email": register_payload["email"], "password": register_payload["password"]},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["access_token"]
    assert data["user"]["email"] == register_payload["email"]


@pytest.mark.asyncio
async def test_login_wrong_password(
    auth_client: AsyncClient, register_payload: dict[str, str]
) -> None:
    await _register(auth_client, register_payload)
    response = await auth_client.post(
        "/api/v1/auth/login",
        json={"email": register_payload["email"], "password": "WrongPassword1!"},
    )
    assert response.status_code == 401
    assert response.json()["code"] == "INVALID_CREDENTIALS"


@pytest.mark.asyncio
async def test_inactive_user_cannot_login(
    auth_client: AsyncClient,
    register_payload: dict[str, str],
) -> None:
    from app.db.session import get_engine
    from app.models.user import User
    from sqlalchemy import select
    from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

    await _register(auth_client, register_payload)
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        result = await session.execute(select(User).where(User.email == register_payload["email"]))
        user = result.scalar_one()
        user.is_active = False
        await session.commit()

    response = await auth_client.post(
        "/api/v1/auth/login",
        json={"email": register_payload["email"], "password": register_payload["password"]},
    )
    assert response.status_code == 403
    assert response.json()["code"] == "ACCOUNT_SUSPENDED"


@pytest.mark.asyncio
async def test_me_authorized(auth_client: AsyncClient, register_payload: dict[str, str]) -> None:
    reg = await _register(auth_client, register_payload)
    token = reg["json"]["access_token"]
    response = await auth_client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == register_payload["email"]
    assert "USER" in data["roles"]
    assert "users.read.self" in data["permissions"]


@pytest.mark.asyncio
async def test_me_unauthorized(auth_client: AsyncClient) -> None:
    response = await auth_client.get("/api/v1/auth/me")
    assert response.status_code == 401
    assert response.json()["code"] == "UNAUTHORIZED"


@pytest.mark.asyncio
async def test_logout_revokes_and_clears_cookie(
    auth_client: AsyncClient, register_payload: dict[str, str]
) -> None:
    await _register(auth_client, register_payload)
    logout = await auth_client.post("/api/v1/auth/logout")
    assert logout.status_code == 204
    refresh = await auth_client.post("/api/v1/auth/refresh")
    assert refresh.status_code == 401


@pytest.mark.asyncio
async def test_user_gets_user_role_on_register(
    auth_client: AsyncClient, register_payload: dict[str, str]
) -> None:
    result = await _register(auth_client, register_payload)
    assert result["json"]["user"]["roles"] == ["USER"]


@pytest.mark.asyncio
async def test_register_mobile_returns_refresh_token_in_body(
    auth_client: AsyncClient, register_payload: dict[str, str]
) -> None:
    result = await _register(auth_client, register_payload, mobile=True)
    assert result["response"].status_code == 201
    assert result["json"].get("refresh_token")


# ─── REGISTRATION-CONTAINMENT-01 ────────────────────────────────────────────
# Fermer la beta ne doit rien coûter aux comptes déjà créés. Ces tests couvrent
# donc les deux faces : la porte fermée, et le fait que les habitants gardent
# leurs clés.


async def _compte_utilisateurs_et_profils() -> tuple[int, int]:
    """Nombre de lignes User et UserProfile, pour prouver l'absence d'effet de bord."""
    from app.db.session import get_engine
    from app.models.user import User
    from app.models.user_profile import UserProfile
    from sqlalchemy import func, select
    from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        utilisateurs = await session.scalar(select(func.count()).select_from(User))
        profils = await session.scalar(select(func.count()).select_from(UserProfile))
    return int(utilisateurs or 0), int(profils or 0)


def _fermer_les_inscriptions(monkeypatch: pytest.MonkeyPatch) -> None:
    from app.core.config import get_settings

    monkeypatch.setenv("REGISTRATION_ENABLED", "false")
    get_settings.cache_clear()


@pytest.mark.asyncio
async def test_registration_is_enabled_by_default() -> None:
    """Aucun déploiement existant ne change de comportement en installant cette version."""
    from app.core.config import get_settings

    assert get_settings().registration_enabled is True


@pytest.mark.asyncio
async def test_register_refused_when_registration_closed(
    auth_client: AsyncClient,
    register_payload: dict[str, str],
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    avant = await _compte_utilisateurs_et_profils()
    _fermer_les_inscriptions(monkeypatch)

    result = await _register(auth_client, register_payload)

    assert result["response"].status_code == 403
    assert result["json"]["code"] == "REGISTRATION_CLOSED"
    # Ni utilisateur, ni profil : la garde est posée avant tout accès base.
    assert await _compte_utilisateurs_et_profils() == avant


@pytest.mark.asyncio
async def test_register_refused_on_mobile_client_too(
    auth_client: AsyncClient,
    register_payload: dict[str, str],
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Le client mobile emprunte la même route : il ne contourne pas la fermeture."""
    _fermer_les_inscriptions(monkeypatch)
    result = await _register(auth_client, register_payload, mobile=True)
    assert result["response"].status_code == 403
    assert result["json"]["code"] == "REGISTRATION_CLOSED"


@pytest.mark.asyncio
async def test_existing_account_keeps_working_when_registration_closed(
    auth_client: AsyncClient,
    register_payload: dict[str, str],
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    inscription = await _register(auth_client, register_payload)
    assert inscription["response"].status_code == 201

    _fermer_les_inscriptions(monkeypatch)

    # Un NOUVEAU compte est refusé…
    refuse = await _register(
        auth_client, {**register_payload, "email": "nouvelle.arrivante@example.com"}
    )
    assert refuse["response"].status_code == 403

    # …mais le compte existant se connecte, rafraîchit et se déconnecte.
    connexion = await auth_client.post(
        "/api/v1/auth/login",
        json={"email": register_payload["email"], "password": register_payload["password"]},
    )
    assert connexion.status_code == 200
    assert connexion.json()["access_token"]

    rafraichissement = await auth_client.post("/api/v1/auth/refresh")
    assert rafraichissement.status_code == 200
    assert rafraichissement.json()["access_token"]

    deconnexion = await auth_client.post("/api/v1/auth/logout")
    assert deconnexion.status_code == 204


@pytest.mark.asyncio
async def test_password_recovery_still_answers_when_registration_closed(
    auth_client: AsyncClient,
    register_payload: dict[str, str],
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """La récupération de mot de passe sert les comptes existants : elle reste ouverte."""
    await _register(auth_client, register_payload)
    _fermer_les_inscriptions(monkeypatch)

    reponse = await auth_client.post(
        "/api/v1/auth/forgot-password", json={"email": register_payload["email"]}
    )
    assert reponse.status_code == 200
