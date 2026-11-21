"""Aucune valeur liée d'une requête SQL dans les journaux ni dans le texte des
erreurs (APP-DEBUG-SQL-ECHO-TOKENS-01).

Les paramètres des requêtes portent des jetons (QR Passport, hash de refresh token)
et des données personnelles. Le moteur de l'application faisait l'écho SQL avec ses
paramètres quand ``DEBUG`` est vrai, et le texte de toute erreur SQL contenait
``[parameters: (…)]`` quelle que soit la valeur de ``DEBUG``.

Chaque test passe une valeur FICTIVE reconnaissable, sous ``DEBUG`` vrai puis faux,
et cherche ce marqueur dans :

- les journaux (handler racine posé APRÈS ``configure_logging``) ;
- la sortie standard et d'erreur (l'écho SQLAlchemy installe son propre handler) ;
- le texte de l'exception et sa trace complète (chaîne des causes incluse).

Le niveau DEBUG est FORCÉ sur ``sqlalchemy.engine`` dans les tests de résultats : la
protection doit tenir sans dépendre du niveau configuré.

LIMITE ASSUMÉE, mesurée : les messages d'erreur de Postgres et d'asyncpg citent la
valeur elle-même ; ``hide_parameters`` ne les couvre pas. APP-SQL-ERROR-VALUES-01
masque ces messages dans les SORTIES (journaux, Sentry, réponse HTTP, résultat arq :
``test_sql_error_redaction.py``), mais ne modifie pas l'objet exception : son texte
brut, que ces tests inspectent aussi, garde la valeur. Ils gardent leurs assertions et
restent ``xfail(strict=True)`` : ils passeront au rouge (XPASS) si l'exception brute
cesse un jour de citer la valeur, et seule une ``AssertionError`` compte comme l'échec
attendu.
"""

from __future__ import annotations

import logging
import os
import traceback
import uuid
from collections.abc import AsyncIterator, Iterator

import pytest
from app.core.config import Settings, get_settings
from app.core.logging import configure_logging
from app.db.session import dispose_db, get_engine, init_db
from scripts.rotate_passport_qr_tokens import build_engine
from sqlalchemy import text
from sqlalchemy.exc import DBAPIError
from sqlalchemy.ext.asyncio import AsyncConnection, AsyncEngine

_SQLALCHEMY_LOGGERS = ("sqlalchemy.engine", "sqlalchemy.engine.Engine")

_FUITE_MESSAGE_SERVEUR = pytest.mark.xfail(
    strict=True,
    raises=AssertionError,
    reason=(
        "APP-SQL-ERROR-VALUES-01 : Postgres cite la valeur dans son message d'erreur "
        "(DETAIL / invalid input syntax) ; masquée aux sorties, elle reste dans le texte "
        "brut de l'exception, que ce test inspecte"
    ),
)
_FUITE_MESSAGE_PILOTE = pytest.mark.xfail(
    strict=True,
    raises=AssertionError,
    reason=(
        "APP-SQL-ERROR-VALUES-01 : asyncpg cite la valeur (tronquée) quand il refuse "
        "d'encoder un argument ; masquée aux sorties, elle reste dans le texte brut de "
        "l'exception, que ce test inspecte"
    ),
)


def _marker() -> str:
    # Court, comme un vrai jeton : asyncpg tronque la valeur citée dans ses erreurs
    # (~30 caractères). Un marqueur long passerait sous la troncature et donnerait un
    # faux vert. On cherche donc le NOYAU aléatoire, placé en tête.
    return f"{uuid.uuid4().hex[:16]}-FICTIF"


def _needle(marker: str) -> str:
    return marker[:16]


def _database_url() -> str | None:
    return os.environ.get("TEST_DATABASE_URL") or os.environ.get("DATABASE_URL")


class _Capture(logging.Handler):
    def __init__(self) -> None:
        super().__init__(level=logging.NOTSET)
        self.lines: list[str] = []

    def emit(self, record: logging.LogRecord) -> None:
        self.lines.append(self.format(record))


@pytest.fixture
def journal() -> Iterator[_Capture]:
    """Capture tout ce qui atteint la racine ; restaure l'état de ``logging`` ensuite."""
    root = logging.getLogger()
    saved_root = (list(root.handlers), root.level)
    saved = {
        name: (logging.getLogger(name).level, list(logging.getLogger(name).handlers))
        for name in _SQLALCHEMY_LOGGERS
    }
    capture = _Capture()
    try:
        yield capture
    finally:
        root.handlers[:] = saved_root[0]
        root.setLevel(saved_root[1])
        for name, (level, handlers) in saved.items():
            logger = logging.getLogger(name)
            logger.setLevel(level)
            logger.handlers[:] = handlers


def _settings(debug: bool) -> Settings:
    url = _database_url()
    if not url:
        pytest.skip("base de test non configuree")
    return get_settings().model_copy(update={"debug": debug, "database_url": url})


@pytest.fixture(params=[True, False], ids=["debug_true", "debug_false"])
async def moteur_app(
    request: pytest.FixtureRequest, journal: _Capture
) -> AsyncIterator[AsyncEngine]:
    """Moteur de l'APPLICATION, configuré comme au démarrage avec DEBUG vrai ou faux."""
    settings = _settings(bool(request.param))
    configure_logging(settings)
    logging.getLogger().addHandler(journal)
    init_db(settings)
    engine = get_engine()
    assert engine is not None
    try:
        yield engine
    finally:
        await dispose_db()


async def _table(conn: AsyncConnection) -> None:
    await conn.execute(text("CREATE TEMPORARY TABLE sql_log_probe (tok text UNIQUE, n integer)"))


def _assert_absent(marker: str, journal: _Capture, *texts: str) -> None:
    needle = _needle(marker)
    assert not [line for line in journal.lines if needle in line], "marqueur dans les journaux"
    for index, chunk in enumerate(texts):
        assert needle not in chunk, f"marqueur dans la sortie #{index}"


def _exception_text(exc: BaseException) -> str:
    return str(exc) + "\n" + "".join(traceback.format_exception(exc))


async def test_requete_reussie_aucune_valeur_journalisee(
    moteur_app: AsyncEngine, journal: _Capture, capsys: pytest.CaptureFixture[str]
) -> None:
    marker = _marker()
    async with moteur_app.connect() as conn:
        await _table(conn)
        await conn.execute(text("INSERT INTO sql_log_probe (tok) VALUES (:tok)"), {"tok": marker})
        returned = (
            await conn.execute(
                text("SELECT tok FROM sql_log_probe WHERE tok = :tok"), {"tok": marker}
            )
        ).scalar_one()

    assert returned == marker  # la requête a bien manipulé la valeur
    out = capsys.readouterr()
    _assert_absent(marker, journal, out.out, out.err)


async def test_resultats_non_journalises_meme_si_niveau_debug_force(
    moteur_app: AsyncEngine, journal: _Capture, capsys: pytest.CaptureFixture[str]
) -> None:
    """La protection ne doit pas reposer sur le niveau configuré : on le force à DEBUG."""
    marker = _marker()
    logging.getLogger().setLevel(logging.DEBUG)
    for name in _SQLALCHEMY_LOGGERS:
        logging.getLogger(name).setLevel(logging.DEBUG)

    async with moteur_app.connect() as conn:
        returned = (
            await conn.execute(text("SELECT CAST(:tok AS text) AS tok"), {"tok": marker})
        ).scalar_one()

    assert returned == marker
    assert any("SELECT CAST" in line for line in journal.lines), (
        "l'instrument doit voir l'écho SQL au niveau DEBUG forcé, sinon le test ne prouve rien"
    )
    out = capsys.readouterr()
    _assert_absent(marker, journal, out.out, out.err)


@_FUITE_MESSAGE_SERVEUR
async def test_erreur_contrainte_aucune_valeur(
    moteur_app: AsyncEngine, journal: _Capture, capsys: pytest.CaptureFixture[str]
) -> None:
    marker = _marker()
    async with moteur_app.connect() as conn:
        await _table(conn)
        await conn.execute(text("INSERT INTO sql_log_probe (tok) VALUES (:tok)"), {"tok": marker})
        with pytest.raises(DBAPIError) as caught:
            await conn.execute(
                text("INSERT INTO sql_log_probe (tok) VALUES (:tok)"), {"tok": marker}
            )
        logging.getLogger("app.test").error("erreur SQL", exc_info=caught.value)

    out = capsys.readouterr()
    _assert_absent(marker, journal, _exception_text(caught.value), out.out, out.err)


@_FUITE_MESSAGE_SERVEUR
async def test_erreur_valeur_invalide_cote_serveur_aucune_valeur(
    moteur_app: AsyncEngine, journal: _Capture, capsys: pytest.CaptureFixture[str]
) -> None:
    """Conversion refusée PAR LE SERVEUR : Postgres cite la valeur dans son message."""
    marker = _marker()
    async with moteur_app.connect() as conn:
        with pytest.raises(DBAPIError) as caught:
            await conn.execute(text("SELECT CAST(CAST(:v AS text) AS integer)"), {"v": marker})
        logging.getLogger("app.test").error("erreur SQL", exc_info=caught.value)

    out = capsys.readouterr()
    _assert_absent(marker, journal, _exception_text(caught.value), out.out, out.err)


@_FUITE_MESSAGE_PILOTE
async def test_erreur_valeur_invalide_cote_pilote_aucune_valeur(
    moteur_app: AsyncEngine, journal: _Capture, capsys: pytest.CaptureFixture[str]
) -> None:
    """Encodage refusé PAR LE PILOTE asyncpg avant envoi au serveur."""
    marker = _marker()
    async with moteur_app.connect() as conn:
        await _table(conn)
        with pytest.raises(DBAPIError) as caught:
            await conn.execute(text("INSERT INTO sql_log_probe (n) VALUES (:n)"), {"n": marker})
        logging.getLogger("app.test").error("erreur SQL", exc_info=caught.value)

    out = capsys.readouterr()
    _assert_absent(marker, journal, _exception_text(caught.value), out.out, out.err)


@_FUITE_MESSAGE_SERVEUR
async def test_moteur_script_rotation_erreur_contrainte_aucune_valeur(
    journal: _Capture, capsys: pytest.CaptureFixture[str]
) -> None:
    url = _settings(True).database_url
    assert url
    logging.getLogger().addHandler(journal)
    marker = _marker()
    engine = build_engine(url)
    try:
        async with engine.connect() as conn:
            await _table(conn)
            await conn.execute(
                text("INSERT INTO sql_log_probe (tok) VALUES (:tok)"), {"tok": marker}
            )
            with pytest.raises(DBAPIError) as caught:
                await conn.execute(
                    text("INSERT INTO sql_log_probe (tok) VALUES (:tok)"), {"tok": marker}
                )
    finally:
        await engine.dispose()

    out = capsys.readouterr()
    _assert_absent(marker, journal, _exception_text(caught.value), out.out, out.err)
