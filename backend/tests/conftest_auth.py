"""Auth integration fixtures (PostgreSQL + RBAC seed)."""

from __future__ import annotations

from collections.abc import AsyncGenerator, Iterator

import pytest
from app.core.config import get_settings
from app.db.base import Base
from app.db.search_fts import install_search_fts
from app.db.seeds.auth_rbac import seed_auth_rbac
from app.db.seeds.passport_tiers import seed_passport_tiers
from app.db.seeds.reims_neighborhoods import seed_reims_neighborhoods
from app.db.seeds.reims_neighborhoods_v2_editorial import seed_reims_neighborhoods_v2_editorial
from app.db.seeds.reims_neighborhoods_v2_hero_assets import seed_reims_neighborhoods_v2_hero_assets
from app.db.seeds.stamp_definitions import seed_stamp_definitions
from app.db.session import dispose_db, get_engine, get_session_factory, init_db
from app.integrations.redis import close_redis, init_redis
from app.main import create_app
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text

from tests.qa_support import configure_destructive_qa_db

_TEST_JWT_SECRET = "test-secret-key-at-least-32-characters-long!!"
#: Echeance PILOT de la suite (AUTH-04B). Datee et lointaine plutot que calculee
#: a partir de l'heure courante : une fenetre glissante masquerait une regression
#: du sens de la comparaison, alors qu'une date fixe la revele.
_TEST_REGISTRATION_CLOSES_AT = "2099-01-01T00:00:00+00:00"
_TEST_RATE_LIMIT_PEPPER = "test-rate-limit-pepper-auth04b"


def _reset_database_schema(connection) -> None:  # type: ignore[no-untyped-def]
    """Drop and recreate all ORM tables (PostgreSQL CASCADE for FK chains)."""
    if connection.dialect.name == "postgresql":
        table_names = ", ".join(
            f'"{table.name}"' for table in reversed(Base.metadata.sorted_tables)
        )
        if table_names:
            connection.execute(text(f"DROP TABLE IF EXISTS {table_names} CASCADE"))
    else:
        Base.metadata.drop_all(connection)
    Base.metadata.create_all(connection)


@pytest.fixture
def auth_env(monkeypatch: pytest.MonkeyPatch) -> Iterator[None]:
    # Fail-closed: guard runs before any engine/connection; QA target only (C3-F0-T1-R1).
    configure_destructive_qa_db(monkeypatch)
    monkeypatch.setenv("JWT_SECRET_KEY", _TEST_JWT_SECRET)
    monkeypatch.setenv("REFRESH_COOKIE_SECURE", "false")
    # AUTH-04B : sans `REGISTRATION_MODE`, l'environnement de test retombe sur
    # PILOT, et un pilote n'ouvre plus sans echeance declaree. La suite en pose
    # donc une, lointaine — exactement ce qu'un deploiement doit faire desormais.
    # Sans elle, chaque test d'inscription recevrait un 403 parfaitement legitime.
    monkeypatch.setenv("REGISTRATION_CLOSES_AT", _TEST_REGISTRATION_CLOSES_AT)
    # Le pilote exige aussi un pepper : les cles de comptage ne doivent jamais
    # permettre de retrouver une adresse, y compris dans le Redis de test.
    monkeypatch.setenv("RATE_LIMIT_KEY_PEPPER", _TEST_RATE_LIMIT_PEPPER)
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.fixture
async def auth_client(auth_env: None) -> AsyncGenerator[AsyncClient, None]:
    settings = get_settings()
    init_db(settings)
    await init_redis(settings)

    engine = get_engine()
    assert engine is not None
    async with engine.begin() as connection:
        await connection.run_sync(_reset_database_schema)
        await connection.run_sync(install_search_fts)

    session_factory = get_session_factory()
    assert session_factory is not None
    async with session_factory() as session:
        await seed_auth_rbac(session)
        await seed_passport_tiers(session)
        await seed_stamp_definitions(session)
        await seed_reims_neighborhoods(session)
        await seed_reims_neighborhoods_v2_editorial(session)
        await seed_reims_neighborhoods_v2_hero_assets(session)
        await session.commit()

    application: FastAPI = create_app()
    transport = ASGITransport(app=application)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client

    await close_redis()
    await dispose_db()


@pytest.fixture
def register_payload() -> dict[str, str]:
    return {
        "email": "citoyen@example.com",
        "password": "StrongPassword1!",
        "full_name": "Kyria Mambu",
        "city": "Reims",
    }
