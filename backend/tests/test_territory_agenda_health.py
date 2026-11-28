"""RF-03B — alerte agenda sous le seuil de 3 événements à venir.

Deux niveaux :

- unitaire, sur la source unique `territory_agenda_health` et sa projection dans
  le contrat cockpit ;
- intégration, sur `_count_events_upcoming` : c'est lui qui décide QUELS
  événements comptent, donc lui qui doit exclure passés, brouillons, rejetés,
  annulés et mauvaise ville. L'alerte n'est fiable que si le compteur l'est.
"""

from __future__ import annotations

import os
import uuid
from collections.abc import AsyncGenerator
from datetime import UTC, datetime, timedelta

import pytest
import sqlalchemy as sa
from app.core.local_event_constants import LocalEventModerationStatus
from app.core.territory_agenda_health import (
    AGENDA_HEALTHY_MIN_EVENTS,
    AgendaHealthStatus,
    territory_agenda_health,
)
from app.db.base import Base
from app.repositories.admin_cockpit_repository import AdminCockpitRepository
from app.services.admin_cockpit_service import _agenda_health_payload
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

# --------------------------------------------------------------------------
# Unitaire — matrice de décision
# --------------------------------------------------------------------------


@pytest.mark.unit
def test_threshold_is_three_and_named() -> None:
    """La roadmap fixe `events_upcoming < 3`. Le seuil est une constante."""
    assert AGENDA_HEALTHY_MIN_EVENTS == 3


@pytest.mark.unit
def test_zero_upcoming_is_critical() -> None:
    health = territory_agenda_health(0)
    assert health.status is AgendaHealthStatus.CRITICAL
    assert health.is_alerting is True
    assert health.label == "Aucun événement à venir"


@pytest.mark.unit
@pytest.mark.parametrize("count", [1, 2])
def test_one_or_two_upcoming_is_warning(count: int) -> None:
    health = territory_agenda_health(count)
    assert health.status is AgendaHealthStatus.WARNING
    assert health.is_alerting is True
    assert health.label == "Agenda faible"


@pytest.mark.unit
@pytest.mark.parametrize("count", [3, 4, 12, 500])
def test_three_or_more_is_healthy(count: int) -> None:
    health = territory_agenda_health(count)
    assert health.status is AgendaHealthStatus.HEALTHY
    assert health.is_alerting is False
    assert health.label == "Agenda vivant"


@pytest.mark.unit
def test_the_boundary_is_exactly_three() -> None:
    assert territory_agenda_health(2).is_alerting is True
    assert territory_agenda_health(3).is_alerting is False


@pytest.mark.unit
def test_a_negative_count_degrades_to_critical_not_to_healthy() -> None:
    """Retombée sûre : jamais « sain » sur une valeur incohérente."""
    health = territory_agenda_health(-5)
    assert health.status is AgendaHealthStatus.CRITICAL
    assert health.upcoming_count == 0


@pytest.mark.unit
@pytest.mark.parametrize(
    ("count", "status", "alerting"),
    [(0, "critical", True), (1, "warning", True), (2, "warning", True), (3, "healthy", False)],
)
def test_cockpit_payload_matches_the_domain(count: int, status: str, alerting: bool) -> None:
    payload = _agenda_health_payload(count)
    assert payload.status == status
    assert payload.is_alerting is alerting
    assert payload.upcoming_count == count
    assert payload.threshold == AGENDA_HEALTHY_MIN_EVENTS
    assert payload.label


# --------------------------------------------------------------------------
# Intégration — le compteur réutilisé filtre-t-il correctement ?
# --------------------------------------------------------------------------

_VILLE = "Reims"
_AUTRE_VILLE = "Épernay"


def _database_url() -> str | None:
    return os.environ.get("TEST_DATABASE_URL") or os.environ.get("DATABASE_URL")


@pytest.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    url = _database_url()
    if not url:
        pytest.skip("base de test non configurée")
    engine = create_async_engine(url, pool_pre_ping=True)
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.drop_all)
        await connection.run_sync(Base.metadata.create_all)
    factory = async_sessionmaker(
        bind=engine, class_=AsyncSession, expire_on_commit=False, autoflush=False
    )
    async with factory() as session:
        yield session
    await engine.dispose()


async def _auteur(session: AsyncSession) -> uuid.UUID:
    """`local_events.created_by_user_id` est NOT NULL : il faut un porteur."""
    user_id = uuid.uuid4()
    await session.execute(
        sa.text(
            "INSERT INTO users (id, email, hashed_password, full_name, is_active,"
            " is_verified, is_system_account, force_password_reset)"
            " VALUES (:id, :email, 'x', 'Agenda RF-03B', true, false, false, false)"
        ),
        {"id": user_id, "email": f"rf03b-{user_id.hex[:10]}@example.com"},
    )
    await session.flush()
    return user_id


async def _ajouter_event(
    session: AsyncSession,
    *,
    titre: str,
    dans_heures: float = 48,
    ville: str = _VILLE,
    moderation: str = LocalEventModerationStatus.APPROVED.value,
    annule: bool = False,
) -> None:
    await session.execute(
        sa.text(
            # Colonnes NOT NULL sans defaut : id, created_by_user_id, title,
            # city, starts_at, location_name.
            "INSERT INTO local_events (id, city, title, description, starts_at,"
            " location_name, moderation_status, is_cancelled, event_type,"
            " created_by_user_id, created_at, updated_at)"
            " VALUES (:id, :city, :title, 'desc', :starts, 'Lieu QA', :mod,"
            " :cancelled, 'community', :auteur, now(), now())"
        ),
        {
            "id": uuid.uuid4(),
            "city": ville,
            "title": titre,
            "starts": datetime.now(UTC) + timedelta(hours=dans_heures),
            "mod": moderation,
            "cancelled": annule,
            "auteur": await _auteur(session),
        },
    )
    await session.flush()


async def _compter(session: AsyncSession) -> int:
    return await AdminCockpitRepository(session)._count_events_upcoming(city=_VILLE)


@pytest.mark.integration
@pytest.mark.asyncio
async def test_an_empty_agenda_alerts(db_session: AsyncSession) -> None:
    assert territory_agenda_health(await _compter(db_session)).is_alerting is True


@pytest.mark.integration
@pytest.mark.asyncio
async def test_two_events_still_alert_three_do_not(db_session: AsyncSession) -> None:
    await _ajouter_event(db_session, titre="A")
    await _ajouter_event(db_session, titre="B")
    assert await _compter(db_session) == 2
    assert territory_agenda_health(await _compter(db_session)).is_alerting is True

    await _ajouter_event(db_session, titre="C")
    assert await _compter(db_session) == 3
    assert territory_agenda_health(await _compter(db_session)).is_alerting is False


@pytest.mark.integration
@pytest.mark.asyncio
async def test_an_expired_event_is_excluded(db_session: AsyncSession) -> None:
    await _ajouter_event(db_session, titre="passé", dans_heures=-48)
    assert await _compter(db_session) == 0


@pytest.mark.integration
@pytest.mark.asyncio
@pytest.mark.parametrize(
    "moderation",
    [LocalEventModerationStatus.PENDING_REVIEW.value, LocalEventModerationStatus.REJECTED.value],
)
async def test_a_non_publishable_event_is_excluded(
    db_session: AsyncSession, moderation: str
) -> None:
    await _ajouter_event(db_session, titre="brouillon", moderation=moderation)
    assert await _compter(db_session) == 0


@pytest.mark.integration
@pytest.mark.asyncio
async def test_a_cancelled_event_is_excluded(db_session: AsyncSession) -> None:
    await _ajouter_event(db_session, titre="annulé", annule=True)
    assert await _compter(db_session) == 0


@pytest.mark.integration
@pytest.mark.asyncio
async def test_another_city_is_excluded(db_session: AsyncSession) -> None:
    for i in range(4):
        await _ajouter_event(db_session, titre=f"ailleurs {i}", ville=_AUTRE_VILLE)
    assert await _compter(db_session) == 0
    assert territory_agenda_health(await _compter(db_session)).is_alerting is True


@pytest.mark.integration
@pytest.mark.asyncio
async def test_the_time_boundary_uses_utc(db_session: AsyncSession) -> None:
    """Un événement une minute dans le passé sort ; une minute dans le futur reste."""
    await _ajouter_event(db_session, titre="juste passé", dans_heures=-1 / 60)
    assert await _compter(db_session) == 0
    await _ajouter_event(db_session, titre="juste futur", dans_heures=1 / 60)
    assert await _compter(db_session) == 1


@pytest.mark.integration
@pytest.mark.asyncio
async def test_the_alert_needs_no_extra_query(db_session: AsyncSession) -> None:
    """L'alerte est dérivée en mémoire : elle ne doit pas retoucher la base."""
    await _ajouter_event(db_session, titre="unique")
    compte = await _compter(db_session)
    requetes: list[str] = []

    @sa.event.listens_for(db_session.sync_session, "do_orm_execute")
    def _tracer(state: object) -> None:  # pragma: no cover - compteur de test
        requetes.append("x")

    territory_agenda_health(compte)
    _agenda_health_payload(compte)
    assert requetes == []
