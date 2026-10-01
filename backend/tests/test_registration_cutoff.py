"""Cutoff serveur des inscriptions PILOT — AUTH-04B.

Avant ce ticket, `REGISTRATION_CLOSES_AT` était recopié dans la policy et affiché
au frontend, sans jamais être comparé à l'heure : un pilote ouvert « pour 24 h »
restait ouvert indéfiniment, et seule une intervention humaine le refermait. La
date annoncée était donc une promesse que rien ne tenait.

Ici la barrière est évaluée **à chaque requête**, sans planificateur : la règle
tient en une ligne, et ce fichier l'épingle à la microseconde.

    open  ⇔  mode == PILOT  et  cutoff valide  et  now < cutoff

Le corollaire compte autant que la règle : sans échéance exploitable, un pilote
ne s'ouvre pas. Une fenêtre sans fin n'est pas une fenêtre.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any

import pytest
from app.core.config import Settings
from app.core.registration_mode import (
    RegistrationMode,
    parse_registration_cutoff,
    registration_config_problems,
    resolve_registration_policy,
)

_JWT = "dev-only-insecure-jwt-secret-change-in-env-32chars"

#: Échéance de référence. Toutes les bornes du fichier s'y rapportent, de sorte
#: qu'aucun test ne dépend de l'heure réelle ni d'un `sleep`.
ECHEANCE = datetime(2026, 9, 20, 12, 0, 0, tzinfo=UTC)


def _settings(**kwargs: Any) -> Settings:
    """Settings de test, cutoff TOUJOURS explicite.

    La suite pose un `REGISTRATION_CLOSES_AT` par défaut au niveau session pour
    que les tests d'intégration puissent encore s'inscrire. Un test de bord qui
    ne le redéclarerait pas lirait cette valeur d'environnement et prouverait
    l'inverse de ce qu'il annonce — d'où ce défaut vide, écrasable.
    """
    base: dict[str, Any] = {
        "JWT_SECRET_KEY": _JWT,
        "REGISTRATION_CLOSES_AT": "",
        # Le mode aussi : le conteneur QA declare `closed`, et un test du repli
        # historique qui le lirait n'observerait plus aucun repli.
        "REGISTRATION_MODE": "",
    }
    base.update(kwargs)
    return Settings(**base)


def _pilote(cutoff: str, **kwargs: Any) -> Settings:
    return _settings(REGISTRATION_MODE="pilot", REGISTRATION_CLOSES_AT=cutoff, **kwargs)


def _public_complet(**kwargs: Any) -> Settings:
    """Un PUBLIC dont rien ne manque — pour prouver qu'AUTH-04B ne le touche pas."""
    base: dict[str, Any] = {
        "REGISTRATION_MODE": "public",
        "TURNSTILE_SITE_KEY": "site",
        "TURNSTILE_SECRET_KEY": "secret",
        "TURNSTILE_EXPECTED_HOSTNAME": "preview.yunicity.city",
        "RATE_LIMIT_KEY_PEPPER": "pepper-auth04b",
        "REDIS_URL": "redis://127.0.0.1:6379/1",
    }
    base.update(kwargs)
    return _settings(**base)


def _pilote_complet(cutoff: str, **kwargs: Any) -> Settings:
    """Un PILOT dont rien ne manque : seules les dépendances réelles du parcours."""
    base: dict[str, Any] = {
        "RATE_LIMIT_KEY_PEPPER": "pepper-auth04b",
        "REDIS_URL": "redis://127.0.0.1:6379/1",
    }
    base.update(kwargs)
    return _pilote(cutoff, **base)


# ------------------------------------------------------- lecture du cutoff


def test_an_offset_cutoff_is_normalised_to_utc() -> None:
    """Une échéance annoncée à Paris et la même en UTC sont le même instant."""
    parisien = parse_registration_cutoff("2026-09-20T14:00:00+02:00")

    assert parisien is not None
    assert parisien.tzinfo is not None
    assert parisien == ECHEANCE
    assert parisien.utcoffset() == timedelta(0), "stocké en UTC, pas en offset local"


@pytest.mark.parametrize(
    "brut",
    [
        pytest.param("", id="absent"),
        pytest.param("   ", id="blancs"),
        pytest.param("demain", id="texte-libre"),
        pytest.param("2026-13-45T99:00:00Z", id="date-impossible"),
        pytest.param("1789324800", id="epoch-nu"),
        pytest.param("2026-09-20T12:00:00", id="naif-sans-fuseau"),
    ],
)
def test_an_unusable_cutoff_reads_as_absent(brut: str) -> None:
    """Illisible ou ambigu : traité comme absent, donc fermé. Jamais deviné.

    Le cas naïf est le plus sournois : l'ancienne implémentation lui prêtait UTC
    d'office. Supposer le fuseau d'une échéance, c'est se tromper d'une heure ou
    de deux sans que personne ne le voie — ici on refuse.
    """
    assert parse_registration_cutoff(brut) is None


def test_the_z_suffix_is_accepted() -> None:
    """La forme rendue par le backend lui-même doit se relire."""
    assert parse_registration_cutoff("2026-09-20T12:00:00Z") == ECHEANCE


# --------------------------------------------------------- bornes exactes


def test_pilot_is_open_strictly_before_the_deadline() -> None:
    policy = resolve_registration_policy(
        _pilote_complet(ECHEANCE.isoformat()), now=ECHEANCE - timedelta(hours=1)
    )
    assert policy.open is True
    assert policy.mode is RegistrationMode.PILOT
    assert policy.closes_at == ECHEANCE


def test_pilot_is_still_open_one_microsecond_before() -> None:
    policy = resolve_registration_policy(
        _pilote_complet(ECHEANCE.isoformat()), now=ECHEANCE - timedelta(microseconds=1)
    )
    assert policy.open is True


def test_pilot_is_closed_exactly_at_the_deadline() -> None:
    """La borne est fermée : `closes_at` est l'instant où la fenêtre a fini."""
    policy = resolve_registration_policy(_pilote_complet(ECHEANCE.isoformat()), now=ECHEANCE)
    assert policy.open is False


def test_pilot_is_closed_one_microsecond_after() -> None:
    policy = resolve_registration_policy(
        _pilote_complet(ECHEANCE.isoformat()), now=ECHEANCE + timedelta(microseconds=1)
    )
    assert policy.open is False


def test_a_past_cutoff_closes_without_claiming_a_misconfiguration() -> None:
    """Fenêtre terminée ≠ configuration fautive.

    L'échéance reste visible pour que le frontend puisse dire « c'est fini »
    plutôt que « indisponible », qui enverrait réessayer pour rien.
    """
    settings = _pilote_complet(ECHEANCE.isoformat())
    policy = resolve_registration_policy(settings, now=ECHEANCE + timedelta(days=3))

    assert policy.open is False
    assert policy.mode is RegistrationMode.PILOT
    assert policy.closes_at == ECHEANCE
    assert registration_config_problems(settings, policy) == []


def test_the_window_stays_closed_however_often_it_is_asked() -> None:
    """Évaluée à chaque requête : aucun état, donc rien à « réveiller »."""
    settings = _pilote_complet(ECHEANCE.isoformat())
    apres = ECHEANCE + timedelta(seconds=1)

    for _ in range(5):
        assert resolve_registration_policy(settings, now=apres).open is False


# ------------------------------------------------------------- fail-closed


def test_a_pilot_without_a_cutoff_never_opens() -> None:
    """Le défaut que ce ticket corrige : plus d'ouverture sans fin annoncée."""
    settings = _pilote_complet("")
    policy = resolve_registration_policy(settings, now=ECHEANCE)

    assert policy.open is False
    assert policy.closes_at is None
    assert registration_config_problems(settings, policy) == ["REGISTRATION_CLOSES_AT"]


def test_an_invalid_cutoff_closes_without_preventing_startup() -> None:
    """Une valeur illisible ferme les inscriptions ; elle ne fait pas tomber l'API.

    Refuser de démarrer transformerait une faute de frappe en panne totale, y
    compris pour les comptes existants qui n'ont rien à voir avec l'inscription.
    """
    settings = _pilote_complet("pas-une-date")  # ne lève pas
    policy = resolve_registration_policy(settings, now=ECHEANCE)

    assert policy.open is False
    assert registration_config_problems(settings, policy) == ["REGISTRATION_CLOSES_AT"]


def test_a_naive_cutoff_is_refused_rather_than_assumed_utc() -> None:
    settings = _pilote_complet("2026-09-20T12:00:00")
    policy = resolve_registration_policy(settings, now=ECHEANCE - timedelta(days=1))

    assert policy.open is False, "un instant ambigu ne doit jamais ouvrir"
    assert registration_config_problems(settings, policy) == ["REGISTRATION_CLOSES_AT"]


def test_no_raw_cutoff_value_ever_reaches_the_diagnosis() -> None:
    """`/ready` nomme la configuration fautive, il n'en expose pas le contenu."""
    fautif = "valeur-brute-qui-ne-doit-pas-fuiter"
    manquants = registration_config_problems(_pilote_complet(fautif))

    assert manquants == ["REGISTRATION_CLOSES_AT"]
    assert all(fautif not in nom for nom in manquants)


# ------------------------------------------------------- fallback historique


def test_the_legacy_flag_alone_can_no_longer_open_indefinitely() -> None:
    """`REGISTRATION_ENABLED=true` retombe sur PILOT — donc exige une échéance.

    Sans cette règle, il resterait un chemin pour rouvrir sans fin : le booléen
    historique, celui-là même qui a servi au premier pilote.
    """
    settings = _settings(
        REGISTRATION_ENABLED=True, RATE_LIMIT_KEY_PEPPER="p", REDIS_URL="redis://x"
    )
    policy = resolve_registration_policy(settings, now=ECHEANCE)

    assert policy.mode is RegistrationMode.PILOT
    assert policy.open is False
    assert registration_config_problems(settings, policy) == ["REGISTRATION_CLOSES_AT"]


def test_the_legacy_flag_still_works_once_an_end_is_declared() -> None:
    settings = _settings(
        REGISTRATION_ENABLED=True,
        REGISTRATION_CLOSES_AT=ECHEANCE.isoformat(),
        RATE_LIMIT_KEY_PEPPER="p",
        REDIS_URL="redis://x",
    )
    policy = resolve_registration_policy(settings, now=ECHEANCE - timedelta(hours=2))

    assert policy.mode is RegistrationMode.PILOT
    assert policy.open is True


def test_the_legacy_flag_set_to_false_stays_closed_and_needs_no_cutoff() -> None:
    settings = _settings(REGISTRATION_ENABLED=False)
    policy = resolve_registration_policy(settings, now=ECHEANCE)

    assert policy.mode is RegistrationMode.CLOSED
    assert policy.open is False
    assert registration_config_problems(settings, policy) == []


# ------------------------------------------------------ modes non concernés


def test_closed_mode_is_untouched_by_the_cutoff() -> None:
    settings = _settings(REGISTRATION_MODE="closed")
    policy = resolve_registration_policy(settings, now=ECHEANCE)

    assert policy.open is False
    assert policy.closes_at is None
    assert registration_config_problems(settings, policy) == []


def test_public_mode_is_untouched_by_the_cutoff() -> None:
    """Un pilote se borne dans le temps ; une ouverture publique ne s'arrête pas seule."""
    settings = _public_complet(REGISTRATION_CLOSES_AT="")
    policy = resolve_registration_policy(settings, now=ECHEANCE)

    assert policy.open is True
    assert policy.turnstile_required is True
    assert policy.closes_at is None
    assert registration_config_problems(settings, policy) == []


def test_pilot_never_requires_turnstile() -> None:
    """AUTH-04A tenait cette ligne ; AUTH-04B ne doit pas la faire bouger."""
    policy = resolve_registration_policy(
        _pilote_complet(ECHEANCE.isoformat()), now=ECHEANCE - timedelta(hours=1)
    )
    assert policy.turnstile_required is False


# --------------------------------------------------------- horloge injectée


def test_the_default_clock_is_aware_utc() -> None:
    """Sans `now`, la résolution prend l'heure UTC — jamais une heure naïve."""
    loin = datetime.now(UTC) + timedelta(days=365)
    ouvert = resolve_registration_policy(_pilote_complet(loin.isoformat()))
    ferme = resolve_registration_policy(_pilote_complet("2020-01-01T00:00:00Z"))

    assert ouvert.open is True
    assert ferme.open is False


def test_a_naive_clock_is_refused_rather_than_compared() -> None:
    """Comparer un instant naïf à un instant aware lève TypeError en Python.

    Le refuser explicitement vaut mieux que de laisser une erreur d'exécution
    surgir sur la route d'inscription.
    """
    with pytest.raises(ValueError, match="aware"):
        resolve_registration_policy(
            _pilote_complet(ECHEANCE.isoformat()), now=datetime(2026, 9, 20, 11, 0, 0)
        )


# ------------------------------------------------------------- readiness


def test_a_well_configured_pilot_reports_no_problem() -> None:
    assert registration_config_problems(_pilote_complet(ECHEANCE.isoformat())) == []


def test_a_pilot_without_redis_cannot_rate_limit_and_says_so() -> None:
    """Sans Redis, aucun plafond ne tient : ouvrir serait ouvrir sans protection."""
    settings = _pilote_complet(ECHEANCE.isoformat(), REDIS_URL="")
    assert registration_config_problems(settings) == ["REDIS_URL"]


def test_a_pilot_without_a_pepper_would_index_addresses_in_redis() -> None:
    settings = _pilote_complet(ECHEANCE.isoformat(), RATE_LIMIT_KEY_PEPPER="")
    assert registration_config_problems(settings) == ["RATE_LIMIT_KEY_PEPPER"]


def test_pilot_readiness_never_demands_cloudflare() -> None:
    """Turnstile reste hors du pilote : aucune clé Cloudflare n'est nécessaire."""
    manquants = registration_config_problems(_pilote_complet(ECHEANCE.isoformat()))
    assert not any("TURNSTILE" in nom for nom in manquants)


def test_every_missing_pilot_dependency_is_named_at_once() -> None:
    """Un diagnostic partiel ferait corriger en trois allers-retours."""
    settings = _pilote("", RATE_LIMIT_KEY_PEPPER="", REDIS_URL="")
    assert registration_config_problems(settings) == [
        "REGISTRATION_CLOSES_AT",
        "RATE_LIMIT_KEY_PEPPER",
        "REDIS_URL",
    ]


# ------------------------------------------- garde de route (AUTH-04B / phase 6)


class _SessionInterdite:
    """Session de base dont toute utilisation est une erreur de test.

    La garde doit refuser AVANT le moindre acces base. Un espion qui se
    contenterait de compter les appels laisserait passer une lecture faite « au
    cas ou » ; ici n'importe quel usage casse le test, nommement.
    """

    def __getattr__(self, nom: str) -> Any:
        raise AssertionError(f"acces base interdit apres l'echeance : session.{nom}")


class _ServiceInterdit:
    def __init__(self, *_: Any, **__: Any) -> None:
        raise AssertionError("AuthService instancie apres l'echeance : creation/e-mail/jeton")


def _app_pilote(monkeypatch: pytest.MonkeyPatch, *, cutoff: str) -> Any:
    """Monte l'application avec un pilote dont l'echeance est celle demandee."""
    from app.core.config import get_settings

    monkeypatch.setenv("JWT_SECRET_KEY", _JWT)
    monkeypatch.setenv("REGISTRATION_MODE", "pilot")
    monkeypatch.setenv("REGISTRATION_CLOSES_AT", cutoff)
    # Dependances reelles du pilote : sans elles, `temporarily_unavailable`
    # fermerait, et le test mesurerait une configuration incomplete au lieu de
    # l'echeance. Aucune connexion n'est ouverte : la limitation est bouchonnee.
    monkeypatch.setenv("RATE_LIMIT_KEY_PEPPER", "pepper-auth04b")
    monkeypatch.setenv("REDIS_URL", "redis://127.0.0.1:6379/15")
    get_settings.cache_clear()

    from app.main import create_app

    return create_app()


_CHARGE_VALIDE = {
    # Syntaxiquement ET fonctionnellement valide : une charge rejetee par la
    # validation HTTP recevrait 422 sans jamais atteindre la barriere, et le
    # test ne prouverait rien.
    "email": "pilote-sonde@example.com",
    "password": "Un-Mot-De-Passe-Solide-42",
    "full_name": "Sonde Pilote",
    "city": "reims",
}


@pytest.mark.asyncio
async def test_a_late_registration_is_refused_before_anything_happens(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """403 apres l'echeance, sans base, sans quota, sans e-mail, sans jeton."""
    import app.api.v1.auth as auth_module
    from app.db.session import get_db
    from httpx import ASGITransport, AsyncClient

    appels: list[str] = []

    async def _rate_limit_interdit(*_: Any, **__: Any) -> None:
        appels.append("enforce_rate_limit")

    async def _reserve_interdite(*_: Any, **__: Any) -> bool:
        appels.append("reserve_slot")
        return True

    async def _release_interdite(*_: Any, **__: Any) -> None:
        appels.append("release_slot")

    monkeypatch.setattr(auth_module, "enforce_rate_limit", _rate_limit_interdit)
    monkeypatch.setattr(auth_module, "reserve_slot", _reserve_interdite)
    monkeypatch.setattr(auth_module, "release_slot", _release_interdite)
    monkeypatch.setattr(auth_module, "AuthService", _ServiceInterdit)

    passe = (datetime.now(UTC) - timedelta(minutes=1)).isoformat()
    application = _app_pilote(monkeypatch, cutoff=passe)

    async def _session_interdite() -> Any:
        yield _SessionInterdite()

    application.dependency_overrides[get_db] = _session_interdite
    transport = ASGITransport(app=application)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        reponse = await client.post("/api/v1/auth/register", json=_CHARGE_VALIDE)

    assert reponse.status_code == 403
    assert reponse.json()["code"] == "REGISTRATION_CLOSED"
    assert appels == [], f"la barriere a laisse passer : {appels}"


@pytest.mark.asyncio
async def test_the_same_payload_passes_the_barrier_before_the_deadline(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Contre-epreuve : sans elle, un 403 permanent passerait pour un succes.

    On ne va pas jusqu'a la creation — la base est volontairement absente. Il
    suffit de constater que la requete a DEPASSE la barriere des 403.
    """
    import app.api.v1.auth as auth_module
    from app.db.session import get_db
    from httpx import ASGITransport, AsyncClient

    async def _rate_limit_neutre(*_: Any, **__: Any) -> None:
        return None

    async def _reserve_neutre(*_: Any, **__: Any) -> bool:
        return True

    monkeypatch.setattr(auth_module, "enforce_rate_limit", _rate_limit_neutre)
    monkeypatch.setattr(auth_module, "reserve_slot", _reserve_neutre)
    monkeypatch.setattr(auth_module, "AuthService", _ServiceInterdit)

    futur = (datetime.now(UTC) + timedelta(hours=24)).isoformat()
    application = _app_pilote(monkeypatch, cutoff=futur)

    async def _session_neutre() -> Any:
        yield object()

    application.dependency_overrides[get_db] = _session_neutre
    transport = ASGITransport(app=application)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        with pytest.raises(AssertionError, match="AuthService instancie"):
            await client.post("/api/v1/auth/register", json=_CHARGE_VALIDE)


@pytest.mark.asyncio
async def test_registration_status_follows_the_deadline(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Le frontend lit cette route : elle doit basculer seule, sans redeploiement."""
    from httpx import ASGITransport, AsyncClient

    async def _statut(cutoff: str) -> dict[str, Any]:
        application = _app_pilote(monkeypatch, cutoff=cutoff)
        transport = ASGITransport(app=application)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            reponse = await client.get("/api/v1/auth/registration-status")
        assert reponse.status_code == 200
        return dict(reponse.json())

    avant = await _statut((datetime.now(UTC) + timedelta(hours=24)).isoformat())
    assert avant["open"] is True
    assert avant["mode"] == "pilot"
    assert avant["turnstile_required"] is False
    assert avant["temporarily_unavailable"] is False
    assert avant["closes_at"] is not None

    apres = await _statut((datetime.now(UTC) - timedelta(minutes=1)).isoformat())
    assert apres["open"] is False
    assert apres["mode"] == "pilot"
    # Fenetre terminee, pas panne : le frontend doit pouvoir le dire.
    assert apres["temporarily_unavailable"] is False
    assert apres["closes_at"] is not None

    absent = await _statut("")
    assert absent["open"] is False
    assert absent["temporarily_unavailable"] is True, "configuration incomplete, pas fin de fenetre"
    assert absent["closes_at"] is None
