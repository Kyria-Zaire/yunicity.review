"""Modes d'inscription de la pile QA — AUTH-04B.

Docker CI s'arrêtait avant `pytest` : `docker-compose.qa.yml` ne déclarait aucun
mode, le repli historique sur `REGISTRATION_ENABLED` sélectionnait PILOT, et un
pilote sans échéance ni pepper fait légitimement passer `/ready` en `degraded`.
Le gate readiness exige `"status":"ready"` — il tombait.

La première correction posa `REGISTRATION_MODE: closed`. Elle rendait bien `/ready`
vert, mais elle a fermé la seule porte par laquelle la recette navigateur entre :
Playwright parle HTTP au conteneur et ne peut pas, contrairement à `auth_env`, se
déclarer un pilote par variable d'environnement. Chaque `POST /auth/register` de
la suite recevait un 403 légitime — et rien ne l'a signalé, parce que Playwright
n'est pas exécuté par la CI.

Ce que `closed` protégeait réellement, c'est la COHÉRENCE, pas la fermeture. Ce
fichier épingle donc trois décisions, qui ne tiennent qu'ensemble :

- la pile QA déclare un pilote COMPLET — mode, échéance et pepper — jamais hérité
  d'un repli, de sorte que `/ready` reste `ready` ET que la recette puisse
  s'inscrire ;
- l'échéance est un littéral lointain, pour que la recette ne périme jamais ;
- les tests pytest restent indépendants de la pile : `auth_env` pose son propre
  pilote, et continuerait de fonctionner même si la pile était fermée.

Retirer la première referme la recette navigateur. Retirer la deuxième la fait
tomber un matin donné sans raison lisible. Retirer la troisième rend les tests
pytest dépendants d'une valeur de compose. D'où les trois, côte à côte.
"""

from __future__ import annotations

from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import pytest

# `types-PyYAML` n'est pas une dependance du projet, et l'ajouter pour un test
# toucherait le lockfile. Meme convention que les trois autres tests QA qui
# lisent un compose (`test_qa_media_volume_non_root`, entre autres).
import yaml  # type: ignore[import-untyped]
from app.core.config import Settings
from app.core.registration_mode import (
    RegistrationMode,
    parse_registration_cutoff,
    registration_config_problems,
    resolve_registration_policy,
)

from tests.conftest_auth import _TEST_RATE_LIMIT_PEPPER, _TEST_REGISTRATION_CLOSES_AT

_COMPOSE_QA = Path(__file__).resolve().parents[2] / "docker-compose.qa.yml"


def _env_backend_qa() -> dict[str, str]:
    """L'environnement REEL du conteneur qui sert `/ready` a la CI."""
    compose = yaml.safe_load(_COMPOSE_QA.read_text(encoding="utf-8"))
    brut = compose["services"]["backend-qa"]["environment"]
    return {str(cle): str(valeur) for cle, valeur in brut.items()}


# ------------------------------------ A : la pile QA declare un pilote complet


def test_the_qa_stack_declares_its_registration_mode_explicitly() -> None:
    """Declare, jamais deduit : un defaut qui change ne doit pas changer la pile."""
    assert _env_backend_qa().get("REGISTRATION_MODE") == "pilot"


def test_the_qa_stack_reports_ready_so_the_ci_gate_passes() -> None:
    """Reproduit exactement ce que le gate Docker verifie sur `/ready`.

    Le gate fait `grep -q '"status":"ready"'`. Un pilote INCOMPLET rendrait
    `degraded` et arreterait le job AVANT pytest. C'est la completude qui est
    exigee ici, pas la fermeture : les deux rendent `/ready` vert, une seule
    laisse la recette navigateur s'inscrire.
    """
    # `model_validate` plutot que `Settings(**env)` : on valide EXACTEMENT ce que
    # le compose declare, sans fusionner l'environnement de la machine qui lance
    # les tests — sinon un `REGISTRATION_MODE` local fausserait la mesure.
    settings = Settings.model_validate(_env_backend_qa())
    policy = resolve_registration_policy(settings)

    assert policy.mode is RegistrationMode.PILOT
    assert registration_config_problems(settings, policy) == [], (
        "un pilote incomplet ferait passer /ready en degraded et arreterait le gate"
    )


def test_the_qa_stack_lets_the_browser_recette_register() -> None:
    """Le contrat qui manquait, et dont l'absence a ferme la recette Playwright.

    `auth_env` protege les tests pytest, qui tournent DANS le processus et posent
    leurs propres variables. La suite navigateur, elle, ne dispose que de HTTP :
    si la pile refuse d'inscrire, ses quarante `POST /auth/register` echouent en
    403 — un 403 correct, sur une pile mal configuree pour son usage.
    """
    settings = Settings.model_validate(_env_backend_qa())
    assert resolve_registration_policy(settings).open is True


def test_the_qa_stack_cutoff_is_a_far_literal_so_the_recette_never_expires() -> None:
    """Meme regle que la fixture : litterale et lointaine.

    Une echeance calculee masquerait une inversion du sens de la comparaison ; une
    echeance proche ferait tomber la recette un matin donne, sans que le message
    d'erreur — un 403 parfaitement legitime — n'oriente vers la vraie cause.
    """
    brut = _env_backend_qa().get("REGISTRATION_CLOSES_AT", "")
    echeance = parse_registration_cutoff(brut)

    assert echeance is not None, "le pilote de la pile doit poser une echeance LISIBLE"
    assert echeance.tzinfo is not None
    assert "now" not in brut, "valeur litterale, jamais calculee"
    assert echeance > datetime.now(UTC).replace(year=datetime.now(UTC).year + 50), (
        "l'echeance doit rester lointaine : la recette ne doit pas perimer"
    )


def test_the_qa_stack_carries_no_real_provider_key() -> None:
    """La pile neutralise les effets externes : aucune cle reelle ne doit y etre."""
    env = _env_backend_qa()
    assert env.get("EMAIL_PROVIDER") == "console"
    assert "RESEND_API_KEY" not in env


# ------------------------------------- B : les tests ouvrent leur propre pilote


def test_the_auth_fixture_declares_a_complete_pilot() -> None:
    """La fixture pose un pilote de bout en bout, sans rien devoir a la pile.

    Les valeurs sont relues depuis `conftest_auth` plutot que recopiees : une
    fixture qui changerait sans que ce contrat suive serait detectee ici.
    """
    from tests import conftest_auth

    source = Path(conftest_auth.__file__).read_text(encoding="utf-8")
    assert 'monkeypatch.setenv("REGISTRATION_MODE", "pilot")' in source
    assert 'monkeypatch.setenv("REGISTRATION_CLOSES_AT", _TEST_REGISTRATION_CLOSES_AT)' in source
    assert 'monkeypatch.setenv("RATE_LIMIT_KEY_PEPPER", _TEST_RATE_LIMIT_PEPPER)' in source


def test_the_fixture_cutoff_is_valid_far_away_and_fixed() -> None:
    """Une echeance glissante masquerait une inversion du sens de la comparaison.

    Et une echeance proche ferait perimer la CI un jour donne, sans que personne
    ne comprenne pourquoi la suite est soudain rouge.
    """
    echeance = parse_registration_cutoff(_TEST_REGISTRATION_CLOSES_AT)

    assert echeance is not None, "la fixture doit poser une echeance LISIBLE"
    assert echeance.tzinfo is not None
    assert echeance > datetime.now(UTC).replace(year=datetime.now(UTC).year + 50), (
        "l'echeance doit rester lointaine : la CI ne doit pas perimer"
    )
    assert "now" not in _TEST_REGISTRATION_CLOSES_AT, "valeur litterale, jamais calculee"
    assert _TEST_RATE_LIMIT_PEPPER.strip(), "le pilote exige un pepper de limitation"


def _settings_fixture(**surcharges: Any) -> Settings:
    """Les Settings que voit un test sous `auth_env`, dans le conteneur QA."""
    base: dict[str, Any] = {
        # Ce que la pile fournit...
        "JWT_SECRET_KEY": "test-secret-key-at-least-32-characters-long!!",
        "REDIS_URL": "redis://redis-qa:6379/0",
        # ... et ce que la fixture declare par-dessus.
        "REGISTRATION_MODE": "pilot",
        "REGISTRATION_CLOSES_AT": _TEST_REGISTRATION_CLOSES_AT,
        "RATE_LIMIT_KEY_PEPPER": _TEST_RATE_LIMIT_PEPPER,
    }
    base.update(surcharges)
    return Settings(**base)


def test_a_test_pilot_is_open_and_complete() -> None:
    """Sans quoi les quarante `POST /auth/register` recevraient un 403 legitime."""
    settings = _settings_fixture()
    policy = resolve_registration_policy(settings)

    assert policy.mode is RegistrationMode.PILOT
    assert policy.open is True
    assert policy.turnstile_required is False, "aucune cle Cloudflare en pilote"
    assert registration_config_problems(settings, policy) == []


def test_the_fixture_pilot_survives_a_closed_stack() -> None:
    """La fixture pytest ne doit RIEN devoir au mode de la pile.

    La pile declare aujourd'hui un pilote, mais cette propriete ne doit pas en
    dependre : c'est elle qui garantit que les tests pytest resteraient verts si
    la pile etait refermee demain. On part donc de l'environnement REEL du
    conteneur, on le referme de force, et le pilote de test doit rester ouvert
    par-dessus.
    """
    ferme = {**_env_backend_qa(), "REGISTRATION_MODE": "closed"}
    assert resolve_registration_policy(Settings.model_validate(ferme)).open is False

    settings = _settings_fixture(**{k: v for k, v in ferme.items() if k != "REGISTRATION_MODE"})
    policy = resolve_registration_policy(settings)

    assert policy.mode is RegistrationMode.PILOT
    assert policy.open is True


def test_the_test_pilot_still_closes_at_its_own_deadline() -> None:
    """Le pilote de test n'echappe pas a la regle : il est borne, comme les autres."""
    settings = _settings_fixture()
    echeance = parse_registration_cutoff(_TEST_REGISTRATION_CLOSES_AT)
    assert echeance is not None

    assert resolve_registration_policy(settings, now=echeance).open is False
    from datetime import timedelta

    assert resolve_registration_policy(settings, now=echeance - timedelta(seconds=1)).open is True


@pytest.mark.parametrize(
    ("variable", "attendu"),
    [
        ("REGISTRATION_CLOSES_AT", "REGISTRATION_CLOSES_AT"),
        ("RATE_LIMIT_KEY_PEPPER", "RATE_LIMIT_KEY_PEPPER"),
        ("REDIS_URL", "REDIS_URL"),
    ],
)
def test_each_fixture_dependency_is_really_required(variable: str, attendu: str) -> None:
    """Chacune retiree, isolement, doit suffire a refermer le pilote de test.

    Sans cela, la fixture pourrait poser des variables inutiles et donner une
    fausse impression de completude.
    """
    settings = _settings_fixture(**{variable: ""})
    assert registration_config_problems(settings) == [attendu]


# ------------------------------ garde : immunite a l'environnement ambiant


@pytest.mark.parametrize("ambiant", ["", "closed", "pilot", "public"])
def test_the_registration_helpers_ignore_the_ambient_mode(
    monkeypatch: pytest.MonkeyPatch, ambiant: str
) -> None:
    """Les helpers de test doivent donner le MEME resultat partout.

    Docker CI l'a prouve a nos depens : `REGISTRATION_MODE=closed` sur le
    conteneur suffisait a faire mentir quatre tests du repli historique, verts
    sur un runner nu et rouges dans la pile QA. Un test du repli ne s'observe
    que si AUCUN mode n'est declare — donc les helpers doivent le neutraliser,
    pas l'heriter.

    Le mode seul ne suffisait pas. Quand la pile a declare un pilote COMPLET,
    l'echeance et le pepper sont arrives eux aussi par l'environnement : un
    helper qui ne neutralisait que le mode rendait soudain un pilote complet la
    ou le test voulait un pilote incomplet. Ce garde pose donc les trois, pour
    que la meme panne ne puisse pas revenir par une autre variable.

    Les helpers prives sont importes volontairement : c'est leur contrat
    d'isolement qui est verifie ici, et il n'a de valeur que teste.
    """
    if ambiant:
        monkeypatch.setenv("REGISTRATION_MODE", ambiant)
    else:
        monkeypatch.delenv("REGISTRATION_MODE", raising=False)
    # Ce que la pile QA exporte reellement, en plus du mode.
    monkeypatch.setenv("REGISTRATION_CLOSES_AT", _TEST_REGISTRATION_CLOSES_AT)
    monkeypatch.setenv("RATE_LIMIT_KEY_PEPPER", _TEST_RATE_LIMIT_PEPPER)

    from tests.test_registration_cutoff import _settings as helper_cutoff
    from tests.test_registration_protection import _settings as helper_protection
    from tests.test_registration_protection_correction import _settings as helper_correction

    futur = "2099-01-01T00:00:00+00:00"
    for helper in (helper_cutoff, helper_protection, helper_correction):
        nom = helper.__module__

        # Repli historique, drapeau a vrai + echeance valide -> PILOT ouvert.
        ouvert = resolve_registration_policy(
            helper(
                REGISTRATION_ENABLED=True,
                REGISTRATION_CLOSES_AT=futur,
                RATE_LIMIT_KEY_PEPPER="pepper-garde",
                REDIS_URL="redis://127.0.0.1:6379/15",
            )
        )
        assert ouvert.mode is RegistrationMode.PILOT, f"{nom} herite du mode ambiant {ambiant!r}"
        assert ouvert.open is True, f"{nom} : le repli n'ouvre plus sous {ambiant!r}"

        # Repli historique, drapeau a faux -> CLOSED, sans rien exiger.
        ferme = resolve_registration_policy(helper(REGISTRATION_ENABLED=False))
        assert ferme.mode is RegistrationMode.CLOSED, f"{nom} herite du mode ambiant {ambiant!r}"
        assert ferme.open is False


@pytest.mark.parametrize("ambiant", ["", "closed", "pilot"])
def test_a_declared_mode_always_wins_over_the_legacy_flag(
    monkeypatch: pytest.MonkeyPatch, ambiant: str
) -> None:
    """La precedence est la raison pour laquelle fermer par le booleen seul echouait.

    `_fermer_les_inscriptions` posait uniquement `REGISTRATION_ENABLED=false`
    alors que `auth_env` declare un pilote : le mode declare gagnait, la route
    rendait 201. Cette precedence est un choix — elle doit rester verifiee.
    """
    if ambiant:
        monkeypatch.setenv("REGISTRATION_MODE", ambiant)
    else:
        monkeypatch.delenv("REGISTRATION_MODE", raising=False)

    ferme = Settings(
        JWT_SECRET_KEY="test-secret-key-at-least-32-characters-long!!",
        REGISTRATION_MODE="closed",
        REGISTRATION_ENABLED=True,
    )
    assert resolve_registration_policy(ferme).mode is RegistrationMode.CLOSED
    assert resolve_registration_policy(ferme).open is False

    pilote = Settings(
        JWT_SECRET_KEY="test-secret-key-at-least-32-characters-long!!",
        REGISTRATION_MODE="pilot",
        REGISTRATION_ENABLED=False,
        REGISTRATION_CLOSES_AT="2099-01-01T00:00:00+00:00",
        RATE_LIMIT_KEY_PEPPER="pepper-garde",
        REDIS_URL="redis://127.0.0.1:6379/15",
    )
    assert resolve_registration_policy(pilote).mode is RegistrationMode.PILOT
    assert resolve_registration_policy(pilote).open is True
