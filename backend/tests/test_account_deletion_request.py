"""Demande de suppression et délai de grâce — AUTH-02A.

Ce fichier doit prouver deux choses opposées :

- **l'accès est réellement coupé**, y compris pour un jeton d'accès déjà émis ;
- **aucune donnée n'est perdue** — ni les contenus du compte, ni ceux d'autrui,
  ni les preuves de modération.

Aucun envoi réel : le lien d'annulation est intercepté à l'émission.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta
from typing import Any
from urllib.parse import parse_qs, urlparse

import pytest
from app.core.config import Settings, get_settings
from app.db.session import get_session_factory
from httpx import AsyncClient
from sqlalchemy import select, text

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]

_MOT_DE_PASSE = "MotDePasseSolide1!"
_PEPPER = "pepper-de-test-annulation-suppression"


@pytest.fixture
def deletion_env(auth_env: None, monkeypatch: pytest.MonkeyPatch):  # type: ignore[no-untyped-def]
    """Fonctionnalité activée et pepper posé, pour ce fichier seulement."""
    monkeypatch.setenv("ACCOUNT_DELETION_ENABLED", "true")
    monkeypatch.setenv("ACCOUNT_DELETION_TOKEN_PEPPER", _PEPPER)
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.fixture(autouse=True)
def no_rate_limit(monkeypatch: pytest.MonkeyPatch) -> None:
    async def _noop(*_a: object, **_k: object) -> None:
        return None

    monkeypatch.setattr("app.api.v1.auth.enforce_rate_limit", _noop)


@pytest.fixture
def outbox(monkeypatch: pytest.MonkeyPatch) -> list[str]:
    """Boîte d'envoi interne : aucun e-mail ne part réellement."""
    liens: list[str] = []

    async def _capture(*, to: str, cancellation_url: str, **_k: Any) -> None:
        liens.append(cancellation_url)

    monkeypatch.setattr("app.integrations.resend_email.send_account_deletion_email", _capture)
    return liens


def _compte() -> dict[str, str]:
    return {
        "email": f"suppression-{uuid.uuid4().hex[:8]}@example.com",
        "password": _MOT_DE_PASSE,
        "full_name": "Compte A Supprimer",
        "city": "Reims",
    }


async def _inscrire(client: AsyncClient) -> tuple[dict[str, str], str]:
    charge = _compte()
    reponse = await client.post("/api/v1/auth/register", json=charge)
    assert reponse.status_code in (201, 202), reponse.text
    jeton = reponse.json().get("access_token", "")
    return charge, jeton


async def _demander(client: AsyncClient, jeton: str, mot_de_passe: str = _MOT_DE_PASSE) -> Any:
    return await client.post(
        "/api/v1/auth/account/deletion",
        json={"password": mot_de_passe, "confirm": True},
        headers={"Authorization": f"Bearer {jeton}"},
    )


def _token_de(lien: str) -> str:
    valeur = parse_qs(urlparse(lien).query).get("token", [None])[0]
    assert valeur
    return valeur


# --------------------------------------------------------------- feature flag


async def test_the_feature_is_invisible_when_the_flag_is_absent(
    auth_client: AsyncClient,
) -> None:
    """Fail-closed : sans le drapeau, la route n'existe pas."""
    _, jeton = await _inscrire(auth_client)
    reponse = await _demander(auth_client, jeton)

    assert reponse.status_code == 404, "une fonctionnalite desactivee ne doit pas s'annoncer"


# ------------------------------------------------------------------ demande


async def test_a_valid_request_opens_a_thirty_day_grace_period(
    deletion_env: None, auth_client: AsyncClient, outbox: list[str]
) -> None:
    _, jeton = await _inscrire(auth_client)
    avant = datetime.now(UTC)

    reponse = await _demander(auth_client, jeton)

    assert reponse.status_code == 200, reponse.text
    corps = reponse.json()
    echeance = datetime.fromisoformat(corps["scheduled_for"])
    ecart = echeance - avant
    assert timedelta(days=29, hours=23) < ecart < timedelta(days=30, minutes=5), (
        f"delai obtenu : {ecart}"
    )
    assert corps["email_sent"] is True
    assert len(outbox) == 1


async def test_a_wrong_password_is_refused(
    deletion_env: None, auth_client: AsyncClient, outbox: list[str]
) -> None:
    """La session seule ne suffit pas pour une décision irréversible."""
    _, jeton = await _inscrire(auth_client)

    reponse = await _demander(auth_client, jeton, mot_de_passe="PasLeBon2026!xY")

    assert reponse.status_code == 403
    assert reponse.json()["code"] == "INVALID_CREDENTIALS"
    assert outbox == [], "aucun e-mail ne doit partir sur un refus"


async def test_an_unauthenticated_request_is_refused(
    deletion_env: None, auth_client: AsyncClient
) -> None:
    reponse = await auth_client.post(
        "/api/v1/auth/account/deletion", json={"password": _MOT_DE_PASSE, "confirm": True}
    )
    assert reponse.status_code == 401


async def test_a_repeated_request_is_idempotent(
    deletion_env: None, auth_client: AsyncClient, outbox: list[str]
) -> None:
    """Un double clic ne doit pas repousser l'échéance."""
    charge, jeton = await _inscrire(auth_client)
    premiere = await _demander(auth_client, jeton)
    assert premiere.status_code == 200

    # L'acces etant coupe, on rejoue via le service pour eprouver l'idempotence.
    from app.models.user import User
    from app.services.account_deletion_service import AccountDeletionService

    factory = get_session_factory()
    assert factory is not None
    async with factory() as session:
        user = (
            await session.execute(select(User).where(User.email == charge["email"]))
        ).scalar_one()
        seconde = await AccountDeletionService(session).request_deletion(user, _MOT_DE_PASSE)

    attendue = datetime.fromisoformat(premiere.json()["scheduled_for"])
    assert seconde.scheduled_for == attendue, "l'echeance ne doit pas bouger"
    assert len(outbox) == 1, "aucun second e-mail"


# -------------------------------------------------------------- acces coupe


async def test_an_already_issued_access_token_stops_working(
    deletion_env: None, auth_client: AsyncClient, outbox: list[str]
) -> None:
    """Le point central : révoquer les refresh tokens ne suffisait pas.

    Le jeton d'accès vit jusqu'à quinze minutes. `get_current_user` relit
    l'utilisateur à chaque requête, donc l'accès tombe immédiatement.
    """
    _, jeton = await _inscrire(auth_client)
    entetes = {"Authorization": f"Bearer {jeton}"}

    avant = await auth_client.get("/api/v1/auth/me", headers=entetes)
    assert avant.status_code == 200, "le jeton doit fonctionner avant la demande"

    assert (await _demander(auth_client, jeton)).status_code == 200

    apres = await auth_client.get("/api/v1/auth/me", headers=entetes)
    assert apres.status_code == 403, "le MEME jeton doit etre refuse"
    assert apres.json()["code"] == "ACCOUNT_PENDING_DELETION"


async def test_a_normal_login_does_not_silently_reactivate(
    deletion_env: None, auth_client: AsyncClient, outbox: list[str]
) -> None:
    charge, jeton = await _inscrire(auth_client)
    assert (await _demander(auth_client, jeton)).status_code == 200

    connexion = await auth_client.post(
        "/api/v1/auth/login",
        json={"email": charge["email"], "password": _MOT_DE_PASSE},
    )

    assert connexion.status_code == 403
    assert connexion.json()["code"] == "ACCOUNT_PENDING_DELETION"


async def test_refresh_tokens_are_revoked(
    deletion_env: None, auth_client: AsyncClient, outbox: list[str]
) -> None:
    _, jeton = await _inscrire(auth_client)
    assert (await _demander(auth_client, jeton)).status_code == 200

    rotation = await auth_client.post("/api/v1/auth/refresh")
    assert rotation.status_code == 401


# ------------------------------------------------------------- annulation


async def test_the_cancellation_link_restores_the_account(
    deletion_env: None, auth_client: AsyncClient, outbox: list[str]
) -> None:
    charge, jeton = await _inscrire(auth_client)
    assert (await _demander(auth_client, jeton)).status_code == 200

    annulation = await auth_client.post(
        "/api/v1/auth/account/deletion/cancel", json={"token": _token_de(outbox[0])}
    )
    assert annulation.status_code == 200

    # Le compte redevient utilisable, mais il faut se reconnecter.
    reconnexion = await auth_client.post(
        "/api/v1/auth/login",
        json={"email": charge["email"], "password": _MOT_DE_PASSE},
    )
    assert reconnexion.status_code == 200, reconnexion.text


async def test_an_old_session_is_not_restored_by_the_cancellation(
    deletion_env: None, auth_client: AsyncClient, outbox: list[str]
) -> None:
    """Annuler ne rend pas la main aux sessions fermées : reconnexion obligatoire."""
    _, jeton = await _inscrire(auth_client)
    assert (await _demander(auth_client, jeton)).status_code == 200
    await auth_client.post(
        "/api/v1/auth/account/deletion/cancel", json={"token": _token_de(outbox[0])}
    )

    rotation = await auth_client.post("/api/v1/auth/refresh")
    assert rotation.status_code == 401, "l'ancienne session doit rester fermee"


async def test_a_replayed_cancellation_token_is_refused(
    deletion_env: None, auth_client: AsyncClient, outbox: list[str]
) -> None:
    _, jeton = await _inscrire(auth_client)
    assert (await _demander(auth_client, jeton)).status_code == 200
    lien = _token_de(outbox[0])

    assert (
        await auth_client.post("/api/v1/auth/account/deletion/cancel", json={"token": lien})
    ).status_code == 200

    rejeu = await auth_client.post("/api/v1/auth/account/deletion/cancel", json={"token": lien})
    assert rejeu.status_code == 400
    assert rejeu.json()["code"] == "INVALID_CANCELLATION_TOKEN"


async def test_an_unknown_cancellation_token_is_refused(
    deletion_env: None, auth_client: AsyncClient
) -> None:
    reponse = await auth_client.post(
        "/api/v1/auth/account/deletion/cancel",
        json={"token": f"inexistant-{uuid.uuid4().hex}"},
    )
    assert reponse.status_code == 400
    assert reponse.json()["code"] == "INVALID_CANCELLATION_TOKEN"


async def test_the_raw_cancellation_token_is_never_stored(
    deletion_env: None, auth_client: AsyncClient, outbox: list[str]
) -> None:
    from app.models.account_deletion_token import AccountDeletionToken

    _, jeton = await _inscrire(auth_client)
    assert (await _demander(auth_client, jeton)).status_code == 200
    brut = _token_de(outbox[0])

    factory = get_session_factory()
    assert factory is not None
    async with factory() as session:
        lignes = (await session.execute(select(AccountDeletionToken))).scalars().all()

    assert lignes
    for ligne in lignes:
        assert ligne.token_hash != brut
        assert len(ligne.token_hash) == 64


# ------------------------------------------ aucune donnee supprimee (regression)


async def test_nothing_is_deleted_when_the_grace_period_opens(
    deletion_env: None, auth_client: AsyncClient, outbox: list[str]
) -> None:
    """Le test de non-régression exigé : tout survit au passage en attente.

    Une tribu, des publications, les commentaires d'autrui, les signalements et
    les actions administratives doivent exister à l'identique après la demande.
    """
    from app.models.user import User

    charge, jeton = await _inscrire(auth_client)

    factory = get_session_factory()
    assert factory is not None
    async with factory() as session:
        user = (
            await session.execute(select(User).where(User.email == charge["email"]))
        ).scalar_one()
        user_id = user.id

    tables = (
        "posts",
        "comments",
        "likes",
        "tribes",
        "tribe_members",
        "reports",
        "report_admin_actions",
        "passports",
        "yuni_wallets",
        "user_profiles",
    )

    async def _compter() -> dict[str, int]:
        async with factory() as session:
            return {
                nom: int((await session.execute(text(f"SELECT count(*) FROM {nom}"))).scalar_one())
                for nom in tables
            }

    avant = await _compter()
    assert (await _demander(auth_client, jeton)).status_code == 200
    apres = await _compter()

    assert avant == apres, f"des lignes ont disparu : {avant} -> {apres}"

    # Le profil existe toujours, et le compte n'est NI supprime NI suspendu.
    async with factory() as session:
        user = (await session.execute(select(User).where(User.id == user_id))).scalar_one()
        assert user is not None, "la ligne utilisateur ne doit pas etre supprimee"
        assert user.deletion_requested_at is not None
        assert user.deletion_scheduled_for is not None
        assert user.is_active is True, (
            "is_active porte la suspension administrative : il ne doit pas bouger"
        )


async def test_the_settings_default_keeps_the_feature_closed() -> None:
    """Le défaut du code, indépendamment de tout environnement."""
    assert Settings(JWT_SECRET_KEY="x" * 40).account_deletion_enabled is False


# -------------------------------------------------------------- cas bloquants


async def _utilisateur(email: str):  # type: ignore[no-untyped-def]
    from app.models.user import User

    factory = get_session_factory()
    assert factory is not None
    async with factory() as session:
        return (await session.execute(select(User).where(User.email == email))).scalar_one()


async def test_a_critical_role_blocks_the_request(
    deletion_env: None, auth_client: AsyncClient, outbox: list[str]
) -> None:
    """Partir en emportant l'administration de la plateforme n'est pas au choix
    de son seul titulaire."""
    from app.core.errors import AppError
    from app.repositories.rbac_repository import RbacRepository
    from app.services.account_deletion_service import AccountDeletionService

    charge, _ = await _inscrire(auth_client)
    factory = get_session_factory()
    assert factory is not None

    async with factory() as session:
        user = (
            await session.execute(
                select(__import__("app.models.user", fromlist=["User"]).User).where(
                    __import__("app.models.user", fromlist=["User"]).User.email == charge["email"]
                )
            )
        ).scalar_one()
        await RbacRepository(session).assign_role_to_user(user.id, "MODERATOR")
        await session.commit()

        with pytest.raises(AppError) as refus:
            await AccountDeletionService(session).request_deletion(user, _MOT_DE_PASSE)

    assert refus.value.code == "ADMIN_ROLE_TRANSFER_REQUIRED"
    assert refus.value.status_code == 409
    assert outbox == []


async def test_a_tribe_without_successor_blocks_the_request(
    deletion_env: None, auth_client: AsyncClient, outbox: list[str]
) -> None:
    """Aucune tribu n'est archivée ni transférée automatiquement ici."""
    from app.core.errors import AppError
    from app.models.tribe import Tribe
    from app.models.user import User
    from app.services.account_deletion_service import AccountDeletionService

    charge, _ = await _inscrire(auth_client)
    factory = get_session_factory()
    assert factory is not None

    async with factory() as session:
        user = (
            await session.execute(select(User).where(User.email == charge["email"]))
        ).scalar_one()
        session.add(
            Tribe(
                name="Tribu sans successeur",
                slug=f"tribu-{uuid.uuid4().hex[:8]}",
                description="Tribu de test AUTH-02A",
                city="Reims",
                category="culture",
                visibility="public",
                created_by_user_id=user.id,
            )
        )
        await session.commit()

        with pytest.raises(AppError) as refus:
            await AccountDeletionService(session).request_deletion(user, _MOT_DE_PASSE)

    assert refus.value.code == "TRIBE_TRANSFER_REQUIRED"
    assert "transf" in refus.value.detail.lower(), "l'instruction doit etre explicite"


async def test_a_live_subscription_blocks_the_request(
    deletion_env: None, auth_client: AsyncClient, outbox: list[str]
) -> None:
    """Aucun appel au prestataire de paiement n'est fait : on refuse et on oriente."""
    from app.core.errors import AppError
    from app.models.user import User
    from app.models.user_subscription import UserSubscription
    from app.services.account_deletion_service import AccountDeletionService

    charge, _ = await _inscrire(auth_client)
    factory = get_session_factory()
    assert factory is not None

    async with factory() as session:
        user = (
            await session.execute(select(User).where(User.email == charge["email"]))
        ).scalar_one()
        session.add(
            UserSubscription(
                user_id=user.id,
                plan_code="plus",
                billing_interval="monthly",
                status="active",
                stripe_customer_id="cus_double_de_test",
                stripe_subscription_id="sub_double_de_test",
            )
        )
        await session.commit()

        with pytest.raises(AppError) as refus:
            await AccountDeletionService(session).request_deletion(user, _MOT_DE_PASSE)

    assert refus.value.code == "SUBSCRIPTION_CANCELLATION_REQUIRED"
    assert "ne l'interrompt pas" in refus.value.detail, (
        "ne jamais laisser croire que la suppression resilie l'abonnement"
    )


async def test_a_tribe_with_another_member_does_not_block(
    deletion_env: None, auth_client: AsyncClient, outbox: list[str]
) -> None:
    """Une succession possible existe : la demande passe, la tribu reste intacte."""
    from app.models.tribe import Tribe, TribeMember
    from app.models.user import User
    from app.services.account_deletion_service import AccountDeletionService

    charge, _ = await _inscrire(auth_client)
    autre, _ = await _inscrire(auth_client)
    factory = get_session_factory()
    assert factory is not None

    async with factory() as session:
        user = (
            await session.execute(select(User).where(User.email == charge["email"]))
        ).scalar_one()
        second = (
            await session.execute(select(User).where(User.email == autre["email"]))
        ).scalar_one()
        tribu = Tribe(
            name="Tribu avec successeur",
            slug=f"tribu-{uuid.uuid4().hex[:8]}",
            description="Tribu de test AUTH-02A",
            city="Reims",
            category="culture",
            visibility="public",
            created_by_user_id=user.id,
        )
        session.add(tribu)
        await session.flush()
        session.add(
            TribeMember(
                tribe_id=tribu.id,
                user_id=second.id,
                role="member",
                joined_at=datetime.now(UTC),
                charter_accepted_at=datetime.now(UTC),
            )
        )
        await session.commit()
        tribe_id = tribu.id

        resultat = await AccountDeletionService(session).request_deletion(user, _MOT_DE_PASSE)
        assert resultat.scheduled_for is not None

    # La tribu existe toujours, avec son createur d'origine.
    async with factory() as session:
        encore = (
            await session.execute(select(Tribe).where(Tribe.id == tribe_id))
        ).scalar_one_or_none()
        assert encore is not None, "aucune tribu ne doit disparaitre"
        assert encore.created_by_user_id is not None
