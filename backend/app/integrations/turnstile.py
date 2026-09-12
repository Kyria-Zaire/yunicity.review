"""Cloudflare Turnstile — validation côté serveur (AUTH-04A).

Le widget frontend ne prouve rien : il produit un jeton que **seul le backend**
peut transformer en décision, en appelant Siteverify. Une intégration qui se
contenterait de vérifier la présence du jeton côté client n'ajouterait aucune
protection, juste un obstacle contournable avec une ligne de `curl`.

Trois contrôles s'ajoutent à la réponse « success » du fournisseur, et chacun
ferme une réutilisation réelle :

- **hostname** — un jeton obtenu sur un autre site, ou sur une copie du
  formulaire hébergée ailleurs, ne vaut rien ici ;
- **action** — un jeton obtenu sur un autre parcours du même site ne vaut pas
  pour une inscription ;
- **âge** — la réponse porte l'horodatage du défi ; au-delà de cinq minutes il
  est refusé, indépendamment de ce que le fournisseur voudrait bien accepter.

Le rejeu est refusé par Cloudflare lui-même : un jeton Siteverify est à usage
unique et une seconde validation renvoie `timeout-or-duplicate`.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Any

import httpx

from app.core.config import Settings

logger = logging.getLogger(__name__)

SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"

#: Durée de vie maximale d'un défi, imposée par nous et non par le fournisseur.
MAX_CHALLENGE_AGE = timedelta(minutes=5)

#: Clés de test officielles Cloudflare. Présentes ici pour que la CI éprouve la
#: chaîne complète sans compte ni appel réseau réel, et pour qu'on les reconnaisse
#: si elles se retrouvaient par erreur dans un environnement déployé.
TEST_SITE_KEY_ALWAYS_PASSES = "1x00000000000000000000AA"
TEST_SECRET_KEY_ALWAYS_PASSES = "1x0000000000000000000000000000000AA"
TEST_SECRET_KEY_ALWAYS_FAILS = "2x0000000000000000000000000000000AA"


class TurnstileUnavailable(RuntimeError):
    """Siteverify n'a pas pu être interrogé : réseau, délai dépassé, réponse illisible.

    Distinct d'un refus. L'appelant décide quoi en faire selon le mode : en PUBLIC
    la protection est indispensable, donc l'inscription est refusée.
    """


@dataclass(frozen=True)
class TurnstileVerdict:
    success: bool
    #: Codes renvoyés par le fournisseur, ou posés par nos propres contrôles.
    #: Jamais exposés à l'utilisateur : ils servent aux métriques et au diagnostic.
    codes: tuple[str, ...]


async def verify_turnstile_token(
    token: str,
    *,
    settings: Settings,
    remote_ip: str | None = None,
    expected_action: str = "register",
) -> TurnstileVerdict:
    """Valide un jeton auprès de Siteverify. Lève si le service est injoignable."""
    secret = settings.turnstile_secret_key
    if not secret:
        raise TurnstileUnavailable("Turnstile secret is not configured")

    if not token.strip():
        return TurnstileVerdict(success=False, codes=("missing-input-response",))

    payload: dict[str, str] = {"secret": secret, "response": token}
    if remote_ip and remote_ip != "unknown":
        payload["remoteip"] = remote_ip

    try:
        async with httpx.AsyncClient(timeout=settings.turnstile_timeout_seconds) as client:
            response = await client.post(SITEVERIFY_URL, data=payload)
    except httpx.HTTPError as exc:
        logger.warning("turnstile_transport_error", exc_info=True)
        raise TurnstileUnavailable("Siteverify unreachable") from exc

    if response.status_code >= 500:
        raise TurnstileUnavailable(f"Siteverify returned HTTP {response.status_code}")
    if response.status_code >= 400:
        # 4xx vient d'une requête mal formée de notre côté : c'est une panne de
        # configuration, pas un verdict sur l'utilisateur.
        raise TurnstileUnavailable(f"Siteverify rejected the request ({response.status_code})")

    try:
        body: dict[str, Any] = response.json()
    except ValueError as exc:
        raise TurnstileUnavailable("Siteverify returned a malformed body") from exc
    if not isinstance(body, dict):
        raise TurnstileUnavailable("Siteverify returned a malformed body")

    return _judge(body, settings=settings, expected_action=expected_action)


def _judge(body: dict[str, Any], *, settings: Settings, expected_action: str) -> TurnstileVerdict:
    codes = tuple(str(c) for c in body.get("error-codes") or ())

    if not body.get("success"):
        return TurnstileVerdict(success=False, codes=codes or ("verification-failed",))

    expected_host = settings.turnstile_expected_hostname.strip()
    hostname = str(body.get("hostname") or "")
    if expected_host and hostname != expected_host:
        logger.warning("turnstile_hostname_mismatch")
        return TurnstileVerdict(success=False, codes=("hostname-mismatch",))

    action = str(body.get("action") or "")
    # Une action vide est tolérée : le widget peut ne pas en déclarer. Une action
    # déclarée mais différente ne l'est pas.
    if action and action != expected_action:
        logger.warning("turnstile_action_mismatch")
        return TurnstileVerdict(success=False, codes=("action-mismatch",))

    if not _challenge_is_recent(body.get("challenge_ts")):
        return TurnstileVerdict(success=False, codes=("challenge-expired",))

    return TurnstileVerdict(success=True, codes=codes)


def _challenge_is_recent(raw: object) -> bool:
    """Un horodatage absent est accepté ; illisible ou trop ancien ne l'est pas."""
    if raw is None:
        return True
    try:
        stamp = datetime.fromisoformat(str(raw).replace("Z", "+00:00"))
    except ValueError:
        return False
    if stamp.tzinfo is None:
        stamp = stamp.replace(tzinfo=UTC)
    return datetime.now(UTC) - stamp <= MAX_CHALLENGE_AGE
