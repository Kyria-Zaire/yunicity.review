"""VERIFIED-CREATOR-ROLE-DEPLOY-05 — provisionnement du role par migration.

La revision 20260908_0062 cree `VERIFIED_CREATOR` de facon idempotente, sans
permission ni attribution, sans toucher aux roles historiques, et refuse son
downgrade si des utilisateurs portent le role.

Le lanceur de tests ne joue PAS Alembic (il cree une base vide, le schema vient de
`Base.metadata.create_all`). Ces tests executent donc les instructions SQL de la
revision elle-meme — celles que `upgrade()` et `downgrade()` emettent — plutot que
de simuler un harnais Alembic. L'execution Alembic reelle est prouvee separement
sur la pile QA (`alembic upgrade head`).
"""

from __future__ import annotations

import importlib.util
import os
import uuid
from collections.abc import AsyncGenerator
from pathlib import Path
from types import ModuleType

import pytest
import sqlalchemy as sa
from app.core.local_video_duration_policy import (
    VERIFIED_CREATOR_ROLE_KEY,
    max_duration_for_roles,
)
from app.db.base import Base
from app.db.seeds.auth_rbac import ROLE_DEFINITIONS, seed_auth_rbac
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

_MIGRATION_PATH = (
    Path(__file__).resolve().parents[1]
    / "alembic"
    / "versions"
    / "20260908_0062_seed_verified_creator_role.py"
)


def _load_migration() -> ModuleType:
    """Charge la revision par chemin : `alembic/versions` n'est pas un package et le
    nom de module commence par un chiffre."""
    spec = importlib.util.spec_from_file_location("_rev_0062", _MIGRATION_PATH)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


migration = _load_migration()

_HISTORIQUES = ("USER", "MODERATOR", "CITY_ADMIN", "SUPER_ADMIN")


# --------------------------------------------------------------------------
# Unitaire — l'instantane inline ne peut pas diverger sans etre vu
# --------------------------------------------------------------------------


@pytest.mark.unit
def test_inline_snapshot_matches_role_definitions() -> None:
    """La revision inline ses valeurs (convention posee par 20260718_0055 : une
    revision est un instantane historique stable). Ce test garantit qu'elles
    correspondent a `ROLE_DEFINITIONS` aujourd'hui, donc que la duplication
    volontaire ne peut pas diverger en silence."""
    name, description = ROLE_DEFINITIONS[VERIFIED_CREATOR_ROLE_KEY]
    assert migration._ROLE_KEY == VERIFIED_CREATOR_ROLE_KEY
    assert migration._ROLE_NAME == name
    assert migration._ROLE_DESCRIPTION == description


@pytest.mark.unit
def test_revision_extends_the_single_head() -> None:
    assert migration.revision == "20260908_0062"
    assert migration.down_revision == "20260829_0061"


@pytest.mark.unit
def test_policy_grants_one_eighty_to_the_role() -> None:
    assert max_duration_for_roles([VERIFIED_CREATOR_ROLE_KEY]) == 180


@pytest.mark.unit
def test_policy_keeps_standard_user_at_ninety() -> None:
    assert max_duration_for_roles(["USER"]) == 90
    assert max_duration_for_roles([]) == 90
    assert max_duration_for_roles(None) == 90


# --------------------------------------------------------------------------
# Integration — instructions reelles de la revision sur une vraie base
# --------------------------------------------------------------------------

def _database_url() -> str | None:
    return os.environ.get("TEST_DATABASE_URL") or os.environ.get("DATABASE_URL")


@pytest.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    url = _database_url()
    if not url:
        pytest.skip("base de test non configuree")
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


async def _upgrade(session: AsyncSession) -> None:
    """Instruction exacte emise par `upgrade()`."""
    await session.execute(
        migration._INSERT_ROLE,
        {
            "key": migration._ROLE_KEY,
            "name": migration._ROLE_NAME,
            "description": migration._ROLE_DESCRIPTION,
        },
    )


async def _count(session: AsyncSession, sql: str, key: str) -> int:
    return int((await session.execute(sa.text(sql), {"k": key})).scalar_one())


_SQL_ROLE = "SELECT count(*) FROM roles WHERE key = :k"
_SQL_PERMS = (
    "SELECT count(*) FROM role_permissions rp JOIN roles r ON r.id = rp.role_id WHERE r.key = :k"
)
_SQL_ASSIGN = (
    "SELECT count(*) FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.key = :k"
)


@pytest.mark.integration
async def test_upgrade_on_empty_database_creates_the_role_once(db_session: AsyncSession) -> None:
    assert await _count(db_session, _SQL_ROLE, VERIFIED_CREATOR_ROLE_KEY) == 0
    await _upgrade(db_session)
    assert await _count(db_session, _SQL_ROLE, VERIFIED_CREATOR_ROLE_KEY) == 1


@pytest.mark.integration
async def test_upgrade_is_idempotent(db_session: AsyncSession) -> None:
    for _ in range(3):
        await _upgrade(db_session)
    assert await _count(db_session, _SQL_ROLE, VERIFIED_CREATOR_ROLE_KEY) == 1


@pytest.mark.integration
async def test_upgrade_after_seed_creates_no_duplicate(db_session: AsyncSession) -> None:
    """Le seed CLI a deja cree le role : la revision ne doit rien dupliquer ni ecraser."""
    await seed_auth_rbac(db_session)
    await db_session.flush()
    assert await _count(db_session, _SQL_ROLE, VERIFIED_CREATOR_ROLE_KEY) == 1
    await _upgrade(db_session)
    assert await _count(db_session, _SQL_ROLE, VERIFIED_CREATOR_ROLE_KEY) == 1


@pytest.mark.integration
async def test_seed_after_upgrade_creates_no_duplicate(db_session: AsyncSession) -> None:
    """Ordre inverse : la revision a joue, puis le seed CLI."""
    await _upgrade(db_session)
    await seed_auth_rbac(db_session)
    await db_session.flush()
    assert await _count(db_session, _SQL_ROLE, VERIFIED_CREATOR_ROLE_KEY) == 1


@pytest.mark.integration
async def test_role_labels_and_system_flag(db_session: AsyncSession) -> None:
    await _upgrade(db_session)
    row = (
        await db_session.execute(
            sa.text("SELECT name, description, is_system FROM roles WHERE key = :k"),
            {"k": VERIFIED_CREATOR_ROLE_KEY},
        )
    ).one()
    name, description = ROLE_DEFINITIONS[VERIFIED_CREATOR_ROLE_KEY]
    assert (row[0], row[1], row[2]) == (name, description, True)


@pytest.mark.integration
async def test_role_gets_no_permission_and_no_assignment(db_session: AsyncSession) -> None:
    await _upgrade(db_session)
    await seed_auth_rbac(db_session)
    await db_session.flush()
    assert await _count(db_session, _SQL_PERMS, VERIFIED_CREATOR_ROLE_KEY) == 0
    assert await _count(db_session, _SQL_ASSIGN, VERIFIED_CREATOR_ROLE_KEY) == 0


@pytest.mark.integration
async def test_historical_roles_are_untouched(db_session: AsyncSession) -> None:
    await seed_auth_rbac(db_session)
    await db_session.flush()
    avant = {
        key: (
            await db_session.execute(
                sa.text("SELECT name, description FROM roles WHERE key = :k"), {"k": key}
            )
        ).one()
        for key in _HISTORIQUES
    }
    await _upgrade(db_session)
    for key in _HISTORIQUES:
        apres = (
            await db_session.execute(
                sa.text("SELECT name, description FROM roles WHERE key = :k"), {"k": key}
            )
        ).one()
        assert apres == avant[key]


@pytest.mark.integration
async def test_downgrade_removes_only_this_role_when_unassigned(db_session: AsyncSession) -> None:
    await seed_auth_rbac(db_session)
    await _upgrade(db_session)
    await db_session.flush()

    assigned = (
        await db_session.execute(
            migration._COUNT_ASSIGNMENTS, {"key": VERIFIED_CREATOR_ROLE_KEY}
        )
    ).scalar_one()
    assert assigned == 0
    await db_session.execute(migration._DELETE_ROLE, {"key": migration._ROLE_KEY})

    assert await _count(db_session, _SQL_ROLE, VERIFIED_CREATOR_ROLE_KEY) == 0
    for key in _HISTORIQUES:
        assert await _count(db_session, _SQL_ROLE, key) == 1


@pytest.mark.integration
async def test_downgrade_refuses_when_the_role_is_assigned(db_session: AsyncSession) -> None:
    """Refus ferme : le compteur de la revision voit l'attribution, et la base
    elle-meme protege la ligne (`user_roles.role_id` ON DELETE RESTRICT)."""
    await _upgrade(db_session)
    user_id = uuid.uuid4()
    await db_session.execute(
        sa.text(
            "INSERT INTO users (id, email, hashed_password, full_name, is_active,"
            " is_verified, is_system_account, force_password_reset)"
            " VALUES (:id, :email, 'x', 'Gate 0062', true, false, false, false)"
        ),
        {"id": user_id, "email": f"gate-0062-{user_id.hex[:8]}@example.com"},
    )
    role_id = (
        await db_session.execute(
            sa.text("SELECT id FROM roles WHERE key = :k"), {"k": VERIFIED_CREATOR_ROLE_KEY}
        )
    ).scalar_one()
    await db_session.execute(
        sa.text("INSERT INTO user_roles (id, user_id, role_id) VALUES (:i, :u, :r)"),
        {"i": uuid.uuid4(), "u": user_id, "r": role_id},
    )
    await db_session.flush()

    assigned = (
        await db_session.execute(
            migration._COUNT_ASSIGNMENTS, {"key": VERIFIED_CREATOR_ROLE_KEY}
        )
    ).scalar_one()
    assert assigned == 1, "le downgrade doit voir l'attribution et refuser"

    with pytest.raises(IntegrityError):
        await db_session.execute(migration._DELETE_ROLE, {"key": migration._ROLE_KEY})
        await db_session.flush()
