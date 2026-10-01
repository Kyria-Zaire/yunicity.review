"""Revue AUTH-04B — ce que le ticket doit tenir en exploitation, pas en théorie.

`test_registration_cutoff.py` épingle la règle sur des `Settings` construits à la
main. Ce fichier vérifie les trois propriétés qui décident si le cutoff peut
réellement refermer un pilote DÉJÀ OUVERT :

1. la valeur vient d'une vraie variable d'environnement, lue par un seul
   parseur, et une saisie fautive ne fait pas tomber l'API ;
2. le résultat temporel n'est jamais mis en cache — la même instance, avec les
   mêmes `Settings`, bascule à l'échéance sans redémarrage ni invalidation ;
3. une page ouverte avant l'échéance ne permet pas de s'inscrire après : c'est
   l'heure de RÉCEPTION du POST qui décide.

La troisième est celle qui compte le jour du pilote : c'est exactement ce que
ferait quelqu'un qui a laissé l'onglet ouvert.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from types import SimpleNamespace
from typing import Any

import pytest
from app.core import registration_mode
from app.core.config import get_settings
from app.core.registration_mode import parse_registration_cutoff, resolve_registration_policy
from httpx import ASGITransport, AsyncClient

_JWT = "dev-only-insecure-jwt-secret-change-in-env-32chars"
ECHEANCE = datetime(2026, 9, 20, 12, 0, 0, tzinfo=UTC)


def _figer(monkeypatch: pytest.MonkeyPatch, instant: datetime) -> None:
    """Fige l'horloge VUE PAR LA RESOLUTION, sans toucher aux `Settings`.

    C'est le seul moyen de faire varier le temps sans rien reconstruire : si le
    test devait recreer l'application ou vider un cache entre deux instants, il
    ne prouverait justement pas ce qu'on cherche a prouver.
    """

    # Substitut plutot que sous-classe de `datetime` : redefinir `now` sur une
    # sous-classe change sa signature et rend le module non typable. Ici on
    # n'expose que ce que la resolution utilise reellement.
    horloge = SimpleNamespace(
        now=lambda tz=None: instant,  # noqa: ARG005
        fromisoformat=datetime.fromisoformat,
    )
    monkeypatch.setattr(registration_mode, "datetime", horloge)


def _env_pilote(monkeypatch: pytest.MonkeyPatch, brut: str) -> None:
    """Pose un pilote COMPLET depuis de vraies variables d'environnement."""
    monkeypatch.setenv("JWT_SECRET_KEY", _JWT)
    monkeypatch.setenv("REGISTRATION_MODE", "pilot")
    monkeypatch.setenv("REGISTRATION_CLOSES_AT", brut)
    monkeypatch.setenv("RATE_LIMIT_KEY_PEPPER", "pepper-revue-auth04b")
    monkeypatch.setenv("REDIS_URL", "redis://127.0.0.1:6379/15")
    get_settings.cache_clear()


# ------------------------------------------------- PHASE 2 : lecture reelle


@pytest.mark.parametrize(
    ("brut", "ouvrable"),
    [
        pytest.param("", False, id="absent"),
        pytest.param("   ", False, id="espaces"),
        pytest.param("2026-09-20T12:00:00Z", True, id="iso-Z"),
        pytest.param("2026-09-20T14:00:00+02:00", True, id="offset-paris"),
        pytest.param("2026-09-20T12:00:00+00:00", True, id="utc-explicite"),
        pytest.param("2026-09-20T12:00:00", False, id="naif"),
        pytest.param("bientot", False, id="illisible"),
        pytest.param("2026-02-30T12:00:00Z", False, id="date-impossible"),
    ],
)
def test_the_cutoff_is_read_from_the_real_environment(
    monkeypatch: pytest.MonkeyPatch, brut: str, ouvrable: bool
) -> None:
    """Une variable Railway arrive sous forme de CHAINE : c'est ce chemin-la qu'on teste.

    Les trois formes valides designent le MEME instant : une echeance annoncee a
    Paris et la meme en UTC ne doivent pas fermer a deux moments differents.
    """
    _env_pilote(monkeypatch, brut)
    settings = get_settings()

    avant = resolve_registration_policy(settings, now=ECHEANCE - timedelta(hours=1))
    assert avant.open is ouvrable

    if ouvrable:
        assert avant.closes_at == ECHEANCE
        # Et la borne tient, quelle que soit la forme ecrite.
        assert resolve_registration_policy(settings, now=ECHEANCE).open is False


def test_an_invalid_cutoff_never_prevents_the_application_from_starting(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Une faute de frappe ferme l'inscription ; elle ne coupe pas la connexion.

    C'est la raison d'etre de la lecture en texte brut : avant AUTH-04B, Pydantic
    levait au demarrage et l'API entiere refusait de se lancer.
    """
    from app.main import create_app

    _env_pilote(monkeypatch, "pas du tout une date")
    application = create_app()  # ne leve pas

    assert application is not None
    assert resolve_registration_policy(get_settings(), now=ECHEANCE).open is False


def test_the_faulty_value_never_appears_anywhere(monkeypatch: pytest.MonkeyPatch) -> None:
    """Le diagnostic nomme la variable ; il n'en recopie jamais le contenu."""
    fautif = "sentinelle-a-ne-jamais-divulguer"
    _env_pilote(monkeypatch, fautif)
    settings = get_settings()

    manquants = registration_mode.registration_config_problems(settings)
    assert manquants == ["REGISTRATION_CLOSES_AT"]

    policy = resolve_registration_policy(settings, now=ECHEANCE)
    assert policy.closes_at is None
    assert fautif not in repr(policy), "la valeur brute ne doit pas transiter par la policy"


def test_one_single_parser_is_authoritative(monkeypatch: pytest.MonkeyPatch) -> None:
    """La policy et la readiness doivent lire la valeur DE LA MEME FACON.

    Deux lectures divergentes produiraient le pire des cas : un `/ready` vert sur
    une echeance que la policy juge illisible, donc un pilote qu'on croit
    ouvrable et qui ne s'ouvrira jamais.
    """
    for brut in ("2026-09-20T12:00:00Z", "naif-2026", "", "2026-09-20T12:00:00"):
        _env_pilote(monkeypatch, brut)
        settings = get_settings()
        lisible = parse_registration_cutoff(brut) is not None
        signale = "REGISTRATION_CLOSES_AT" in registration_mode.registration_config_problems(
            settings
        )
        porte = resolve_registration_policy(settings, now=ECHEANCE).closes_at is not None

        assert lisible is not signale, f"readiness diverge du parseur sur {brut!r}"
        assert lisible is porte, f"la policy diverge du parseur sur {brut!r}"


# ------------------------------- PHASE 3 : aucune mise en cache du temporel


@pytest.mark.asyncio
async def test_the_same_instance_closes_at_the_deadline_without_restarting(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """LE test du ticket : une instance deja lancee doit refermer d'elle-meme.

    Une seule application, un seul objet `Settings`, aucun vidage de cache entre
    les trois appels — seule l'heure change. Si `open` etait calcule au
    demarrage, mis en cache, ou porte par une dependance memoisee, le deuxieme
    appel resterait ouvert et ce test echouerait.
    """
    from app.main import create_app

    _env_pilote(monkeypatch, ECHEANCE.isoformat())
    application = create_app()
    settings_initial = get_settings()

    async def _statut() -> dict[str, Any]:
        transport = ASGITransport(app=application)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            reponse = await client.get("/api/v1/auth/registration-status")
        assert reponse.status_code == 200
        return dict(reponse.json())

    _figer(monkeypatch, ECHEANCE - timedelta(minutes=1))
    avant = await _statut()

    _figer(monkeypatch, ECHEANCE)
    pile = await _statut()

    _figer(monkeypatch, ECHEANCE + timedelta(minutes=1))
    apres = await _statut()

    assert avant["open"] is True
    assert pile["open"] is False, "la borne est fermee : a l'echeance, c'est fini"
    assert apres["open"] is False

    # La configuration, elle, est bien restee la meme : c'est la preuve que le
    # basculement vient du temps et de rien d'autre.
    assert get_settings() is settings_initial
    assert apres["mode"] == "pilot"
    assert apres["closes_at"] is not None
    assert apres["temporarily_unavailable"] is False


# ------------------------------------- PHASE 4 : soumission tardive reelle


class _SessionInterdite:
    def __getattr__(self, nom: str) -> Any:
        raise AssertionError(f"acces base interdit apres l'echeance : session.{nom}")


class _ServiceInterdit:
    def __init__(self, *_: Any, **__: Any) -> None:
        raise AssertionError("AuthService instancie apres l'echeance")


_CHARGE_VALIDE = {
    "email": "onglet-reste-ouvert@example.com",
    "password": "Un-Mot-De-Passe-Solide-42",
    "full_name": "Sonde Tardive",
    "city": "reims",
}


@pytest.mark.asyncio
async def test_a_page_opened_before_the_deadline_cannot_register_after_it(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """L'onglet laisse ouvert : cas le plus probable le jour de la fermeture.

    Le formulaire a ete obtenu alors que le pilote etait ouvert. Ce qui decide,
    c'est l'heure de RECEPTION du POST — pas celle a laquelle la page a ete
    chargee, qui n'appartient qu'au navigateur.
    """
    import app.api.v1.auth as auth_module
    from app.db.session import get_db
    from app.main import create_app

    _env_pilote(monkeypatch, ECHEANCE.isoformat())
    application = create_app()

    # 1. La page est chargee AVANT l'echeance : le backend annonce ouvert.
    _figer(monkeypatch, ECHEANCE - timedelta(minutes=5))
    transport = ASGITransport(app=application)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        statut = await client.get("/api/v1/auth/registration-status")
    assert statut.json()["open"] is True

    # 2. L'utilisateur soumet APRES. Rien ne doit plus se produire.
    appels: list[str] = []

    async def _rate_limit(*_: Any, **__: Any) -> None:
        appels.append("enforce_rate_limit")

    async def _reserve(*_: Any, **__: Any) -> bool:
        appels.append("reserve_slot")
        return True

    async def _release(*_: Any, **__: Any) -> None:
        appels.append("release_slot")

    monkeypatch.setattr(auth_module, "enforce_rate_limit", _rate_limit)
    monkeypatch.setattr(auth_module, "reserve_slot", _reserve)
    monkeypatch.setattr(auth_module, "release_slot", _release)
    monkeypatch.setattr(auth_module, "AuthService", _ServiceInterdit)

    async def _session_interdite() -> Any:
        yield _SessionInterdite()

    application.dependency_overrides[get_db] = _session_interdite
    _figer(monkeypatch, ECHEANCE + timedelta(seconds=1))

    transport = ASGITransport(app=application)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        reponse = await client.post("/api/v1/auth/register", json=_CHARGE_VALIDE)

    assert reponse.status_code == 403
    assert reponse.json()["code"] == "REGISTRATION_CLOSED"
    assert appels == [], f"la barriere a laisse passer : {appels}"


# ------------------------------------------- PHASE 5 : semantique de /ready


@pytest.mark.asyncio
async def test_a_200_on_ready_is_never_a_proof_that_registration_can_open(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Garde-fou pour un futur outil d'ouverture.

    `/ready` repond 200 meme quand l'inscription ne peut pas ouvrir, et c'est
    VOULU : le code HTTP protege la connexion des comptes existants, qui n'ont
    rien a voir avec l'inscription. La consequence est qu'un outil qui se
    contenterait du 200 pour declarer un pilote pret se tromperait. La preuve
    d'ouvrabilite est `checks.registration_config == []`, et rien d'autre.

    Ce test existe pour qu'une telle regression se voie ici, et pas le jour du
    pilote.
    """
    from app.main import create_app

    _env_pilote(monkeypatch, "")  # pilote sans echeance : ne peut pas ouvrir
    application = create_app()
    transport = ASGITransport(app=application)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        ready = await client.get("/api/v1/ready")
        statut = await client.get("/api/v1/auth/registration-status")

    assert ready.status_code == 200, "l'API reste joignable : les comptes existants s'y connectent"
    corps = ready.json()
    assert corps["status"] == "degraded"
    assert corps["checks"]["registration_config"] == ["REGISTRATION_CLOSES_AT"]

    # Le 200 et l'impossibilite d'ouvrir coexistent : c'est tout le piege.
    assert statut.json()["open"] is False
    assert statut.json()["temporarily_unavailable"] is True


@pytest.mark.asyncio
async def test_an_expired_pilot_is_not_reported_as_a_failure(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Fenetre terminee : `/ready` reste vert. Ce n'est pas une panne a reparer."""
    from app.main import create_app

    _env_pilote(monkeypatch, ECHEANCE.isoformat())
    application = create_app()
    _figer(monkeypatch, ECHEANCE + timedelta(days=7))

    transport = ASGITransport(app=application)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        ready = await client.get("/api/v1/ready")

    assert ready.status_code == 200
    assert ready.json()["checks"]["registration_config"] == []
