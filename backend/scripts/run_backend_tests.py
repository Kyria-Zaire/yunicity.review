"""Runner de la suite backend sur une base JETABLE et distincte (C3.1-R1G).

Pourquoi ce script existe
-------------------------
`yunicity_qa` est la baseline de Playwright et de la revue manuelle. Lancer pytest
contre elle la detruisait : mesure C3.1-R1G, `users=1 posts=0 tribes=0` au lieu de
`2/3/2` apres un simple run cible. Le decouplage est donc porte par une base creee
puis supprimee par ce runner, dont le nom porte le prefixe reserve `yunicity_test_`.

Fail-closed
-----------
La cible est validee par `evaluate_pytest_database_target` AVANT toute connexion :
le garde refuse `yunicity_qa`, `yunicity_dev`, tout nom sans prefixe reserve, le port
de dev, les hotes manages/distants et la presence d'une variable Railway. Aucun
socket n'est ouvert tant que la decision n'est pas prise.

Usage (depuis le conteneur backend QA) :

    python -m scripts.run_backend_tests            # suite complete
    python -m scripts.run_backend_tests tests/qa   # sous-ensemble
"""

from __future__ import annotations

import os
import subprocess
import sys
import uuid

import asyncpg
from app.qa.guard import (
    PYTEST_DB_NAME_PREFIX,
    QA_MODE_ENV,
    QA_TOKEN_ENV,
    TEST_DB_ENV,
    evaluate_pytest_database_target,
)
from sqlalchemy.engine import make_url

#: Serveur portant la base jetable — le meme conteneur Postgres local que la QA,
#: mais une base DISTINCTE. Aucune donnee de `yunicity_qa` n'est lue ni ecrite.
_DEFAULT_HOST = "postgres-qa"
_DEFAULT_PORT = 5432
_DEFAULT_USER = "yunicity_qa"
_DEFAULT_PASSWORD = "yunicity_qa_password"

#: Base de maintenance utilisee uniquement pour CREATE/DROP DATABASE.
_MAINTENANCE_DB = "postgres"

#: Redis logique distinct : la suite fait `flushdb`, ce qui viderait sinon les
#: compteurs de la baseline QA (db 0).
_TEST_REDIS_URL = "redis://redis-qa:6379/1"


def _dsn(dbname: str) -> str:
    return f"postgresql://{_DEFAULT_USER}:{_DEFAULT_PASSWORD}@{_DEFAULT_HOST}:{_DEFAULT_PORT}/{dbname}"


def _test_database_url(dbname: str) -> str:
    return (
        f"postgresql+asyncpg://{_DEFAULT_USER}:{_DEFAULT_PASSWORD}"
        f"@{_DEFAULT_HOST}:{_DEFAULT_PORT}/{dbname}"
    )


async def _recreate_database(dbname: str) -> None:
    connection = await asyncpg.connect(_dsn(_MAINTENANCE_DB))
    try:
        await connection.execute(f'DROP DATABASE IF EXISTS "{dbname}" WITH (FORCE)')
        await connection.execute(f'CREATE DATABASE "{dbname}"')
    finally:
        await connection.close()

    created = await asyncpg.connect(_dsn(dbname))
    try:
        await created.execute("CREATE EXTENSION IF NOT EXISTS postgis")
    finally:
        await created.close()


async def _flush_test_redis() -> None:
    """Vide le Redis logique de test (C3.1-R1I).

    La suite y ecrit des compteurs de rate-limit et des caches. Sans ce nettoyage,
    l'etat d'un run fuiterait vers le suivant — et la baseline QA (db 0) resterait
    intacte mais le db 1 accumulerait indefiniment.
    """
    from redis.asyncio import Redis

    client = Redis.from_url(_TEST_REDIS_URL, decode_responses=True)
    try:
        await client.flushdb()
    finally:
        await client.aclose()


async def _drop_database(dbname: str) -> None:
    connection = await asyncpg.connect(_dsn(_MAINTENANCE_DB))
    try:
        await connection.execute(f'DROP DATABASE IF EXISTS "{dbname}" WITH (FORCE)')
    finally:
        await connection.close()


def main(argv: list[str]) -> int:
    import asyncio

    dbname = os.environ.get("BACKEND_TEST_DB_NAME", "").strip()
    if not dbname:
        dbname = f"{PYTEST_DB_NAME_PREFIX}{uuid.uuid4().hex[:12]}"

    env = dict(os.environ)
    env[QA_MODE_ENV] = "1"
    env.setdefault(QA_TOKEN_ENV, f"backend-tests-{uuid.uuid4()}")
    env[TEST_DB_ENV] = _test_database_url(dbname)
    env["REDIS_URL"] = _TEST_REDIS_URL
    # La suite ne doit pas heriter du backend media du conteneur : chaque test
    # exige explicitement `r2` ou `filesystem` (C3.1-R1G, mission 4).
    env.pop("STORY_MEDIA_STORAGE_BACKEND", None)
    env.pop("STORY_MEDIA_UPLOAD_DIR", None)

    # Decision AVANT toute connexion : fail-closed, sans I/O.
    target = evaluate_pytest_database_target(env)
    parsed = make_url(env[TEST_DB_ENV])
    print(f"backend tests -> host={target.host} port={target.port} db={target.dbname}")
    print(f"redis tests   -> {_TEST_REDIS_URL}")
    assert parsed.database == dbname

    asyncio.run(_recreate_database(dbname))
    try:
        completed = subprocess.run(
            [sys.executable, "-m", "pytest", *argv],
            env=env,
            check=False,
        )
        return completed.returncode
    finally:
        asyncio.run(_drop_database(dbname))
        asyncio.run(_flush_test_redis())
        print(f"base jetable supprimee : {dbname}")
        print(f"redis de test vide     : {_TEST_REDIS_URL}")


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
