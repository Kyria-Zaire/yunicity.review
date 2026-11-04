"""FEED-NEW-UX-01 (I5 de la revue finale) — migration 20261103_0066.

Le reste de la suite construit son schéma par ``Base.metadata.create_all`` : le
fichier de migration n'y est jamais exécuté. Ce test le joue réellement, avec
Alembic, sur une base vide (fixture ``migration_env``), et vérifie sur le schéma
MIGRÉ — pas sur le modèle — ce que la zone rouge exige :

- les publications existantes passent sans remplissage (clé ``NULL``) ;
- l'index unique est scopé à l'auteur et tolère plusieurs ``NULL`` ;
- la même clé est refusée pour un même auteur, acceptée pour un autre ;
- le ``downgrade`` retire colonnes et index sans perdre une publication.
"""

from __future__ import annotations

import asyncio
import uuid
from collections.abc import Awaitable, Callable
from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from app.core.config import get_settings
from app.db.session import dispose_db, get_engine, init_db
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

pytestmark = pytest.mark.integration

BACKEND_ROOT = Path(__file__).resolve().parents[1]
REVISION_AVANT = "20260923_0065"
REVISION = "20261103_0066"
INDEX = "uq_posts_author_client_request"


def _config() -> Config:
    cfg = Config(str(BACKEND_ROOT / "alembic.ini"))
    cfg.set_main_option("script_location", str(BACKEND_ROOT / "alembic"))
    return cfg


async def _inserer_publication(author_id: uuid.UUID, cle: uuid.UUID | None = None) -> None:
    engine = get_engine()
    assert engine is not None
    colonnes = "id, author_type, author_id, body"
    valeurs = ":id, 'citizen', :author_id, 'Publication existante'"
    params: dict[str, object] = {"id": uuid.uuid4(), "author_id": author_id}
    if cle is not None:
        colonnes += ", client_request_id"
        valeurs += ", :cle"
        params["cle"] = cle
    async with engine.begin() as connection:
        await connection.execute(
            text(f"INSERT INTO posts ({colonnes}) VALUES ({valeurs})"), params
        )


async def _scalaire(sql: str, params: dict[str, object] | None = None) -> object:
    engine = get_engine()
    assert engine is not None
    async with engine.connect() as connection:
        return (await connection.execute(text(sql), params or {})).scalar_one()


async def _colonnes_cle() -> dict[str, str]:
    engine = get_engine()
    assert engine is not None
    async with engine.connect() as connection:
        rows = await connection.execute(
            text(
                """
                SELECT column_name, is_nullable FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'posts'
                  AND column_name IN ('client_request_id', 'client_request_fingerprint')
                """
            )
        )
        return {row[0]: row[1] for row in rows.fetchall()}


def _executer(coro_factory: Callable[[], Awaitable[object]]) -> object:
    """Ouvre le moteur, exécute, referme : Alembic tourne entre deux phases."""

    async def _phase() -> object:
        init_db(get_settings())
        try:
            return await coro_factory()
        finally:
            await dispose_db()

    return asyncio.run(_phase())


def test_migration_0066_upgrade_downgrade_sur_schema_reel(migration_env: None) -> None:
    cfg = _config()
    auteur_a = uuid.uuid4()
    auteur_b = uuid.uuid4()

    command.upgrade(cfg, REVISION_AVANT)

    async def _publications_existantes() -> None:
        await _inserer_publication(auteur_a)
        await _inserer_publication(auteur_a)

    _executer(_publications_existantes)

    command.upgrade(cfg, REVISION)

    async def _verifier_upgrade() -> None:
        # Colonnes ajoutées, nullables : aucun remplissage rétroactif.
        assert await _colonnes_cle() == {
            "client_request_id": "YES",
            "client_request_fingerprint": "YES",
        }
        assert await _scalaire("SELECT count(*) FROM posts WHERE client_request_id IS NULL") == 2

        # Index unique, scopé à l'auteur — jamais global.
        definition = await _scalaire(
            "SELECT indexdef FROM pg_indexes WHERE tablename = 'posts' AND indexname = :n",
            {"n": INDEX},
        )
        assert isinstance(definition, str)
        assert "UNIQUE" in definition
        assert "(author_id, client_request_id)" in definition

        # Plusieurs NULL pour un même auteur : l'existant et le chemin sans clé passent.
        await _inserer_publication(auteur_a)

        cle = uuid.uuid4()
        await _inserer_publication(auteur_a, cle)
        # La même clé pour un AUTRE auteur : acceptée (isolation entre comptes).
        await _inserer_publication(auteur_b, cle)
        # La même clé pour le MÊME auteur : refusée par la base elle-même.
        with pytest.raises(IntegrityError):
            await _inserer_publication(auteur_a, cle)

    _executer(_verifier_upgrade)

    command.downgrade(cfg, REVISION_AVANT)

    async def _verifier_downgrade() -> None:
        assert await _colonnes_cle() == {}
        assert (
            await _scalaire(
                "SELECT count(*) FROM pg_indexes WHERE tablename = 'posts' AND indexname = :n",
                {"n": INDEX},
            )
            == 0
        )
        # Aucune publication perdue : 2 existantes + 1 sans clé + 2 avec clé.
        assert await _scalaire("SELECT count(*) FROM posts") == 5

    _executer(_verifier_downgrade)
