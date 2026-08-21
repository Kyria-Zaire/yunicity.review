"""Tolérance bornée au rejeu d'une rotation de refresh token (C3.1-R1K).

## Le problème fermé ici

La rotation à usage unique est conservée : chaque `POST /auth/refresh` consomme
le token présenté et en émet un nouveau. Mais le résultat de cette rotation
voyage vers le client dans la RÉPONSE. Si la réponse n'atteint jamais le
navigateur — navigation qui annule la requête en vol, onglet fermé, réseau
mobile qui coupe — le serveur a tourné, le client non. Le chargement suivant
rejoue alors le token consommé : la détection de réutilisation révoque la
famille et déconnecte un utilisateur parfaitement légitime.

Mesuré en C3.1-R1J sur 701 événements instrumentés : `401 POST /auth/refresh`
puis, 58 à 115 ms plus tard, `redirect_login /login?next=<route>`.

## Le contrat retenu

Pendant une fenêtre courte après une rotation réussie, un rejeu du MÊME token
renvoie EXACTEMENT le même successeur. Jamais un second successeur, jamais une
famille branchée. Passé la fenêtre, la détection de réutilisation et la
révocation de famille sont strictement inchangées.

## Pourquoi Redis, et pourquoi une donnée brute temporaire

Le successeur ne peut pas être re-dérivé du prédécesseur : rendre le successeur
calculable à partir du token consommé signifierait qu'un token volé, même déjà
consommé, livre le suivant. Ce serait une régression de sécurité. La base ne
stocke qu'un SHA-256 du token, jamais le token — invariant à préserver. Il faut
donc conserver le successeur en clair, mais seulement de manière TRANSITOIRE.

Garde-fous appliqués à cette donnée :

- **TTL strict** : l'entrée est écrite avec un TTL Redis, elle disparaît
  physiquement même si un processus meurt en cours de route ;
- **jamais dans une clé** : la clé est un HMAC-SHA256 du hash stocké en base,
  distinct de la valeur en base — un accès en lecture à Redis ne donne donc ni
  le token, ni un index direct sur la table `refresh_tokens` ;
- **jamais journalisée** : aucun chemin de log de ce module ne reçoit de token,
  de hash ni de clé ;
- **inutilisable après révocation** : le successeur rendu par un rejeu est
  relu en base et refusé s'il est révoqué ou expiré, donc un logout, un
  changement de mot de passe ou une révocation globale le neutralisent
  immédiatement, sans attendre l'expiration du TTL.

## Atomicité multi-instances

Deux workers peuvent recevoir le même token simultanément. Le premier prend un
verrou `SET NX` sur la clé dérivée ; le second attend son résultat de manière
bornée puis renvoie le même successeur. Aucun des deux ne peut créer un second
successeur. Si Redis est indisponible, ce module s'efface : la vérité reste la
base, donc le comportement strict d'origine — fail-closed.
"""

from __future__ import annotations

import asyncio
import hashlib
import hmac
import logging
from datetime import UTC, datetime
from typing import Any, Final

from app.core.config import Settings
from app.integrations.redis import get_redis_client

logger = logging.getLogger(__name__)

KEY_NAMESPACE: Final = "auth:rotation:"
_PENDING_PREFIX: Final = "p:"
_RESULT_PREFIX: Final = "r:"

# Sondage borné pendant qu'un autre worker termine SA rotation. Ce n'est pas une
# pause de confort : la boucle s'arrête dès que le résultat est publié, et son
# budget total est plafonné pour qu'aucune requête ne puisse rester suspendue.
_POLL_INTERVAL_SECONDS: Final = 0.02
_MAX_WAIT_SECONDS: Final = 3.0
_MAX_CLAIM_ATTEMPTS: Final = 3

# Le TTL survit légèrement à l'échéance logique : c'est l'échéance qui arbitre,
# le TTL n'est que la garantie d'effacement physique.
_TTL_MARGIN_SECONDS: Final = 2


def utcnow() -> datetime:
    """Horloge du module — point d'injection unique pour les tests."""
    return datetime.now(UTC)


class RefreshRotationGrace:
    """Coordonne la rotation d'un refresh token et son rejeu autorisé."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    # -- état ------------------------------------------------------------- #
    @property
    def window_seconds(self) -> int:
        return self._settings.refresh_rotation_replay_window_seconds

    @property
    def enabled(self) -> bool:
        return self.window_seconds > 0

    def _key(self, token_hash: str) -> str:
        """Identifiant dérivé : ni le token, ni la valeur stockée en base."""
        digest = hmac.new(
            self._settings.refresh_token_pepper.encode(),
            token_hash.encode(),
            hashlib.sha256,
        ).hexdigest()
        return f"{KEY_NAMESPACE}{digest}"

    def _ttl_ms(self) -> int:
        return int((self.window_seconds + _TTL_MARGIN_SECONDS) * 1000)

    def _deadline_ms(self) -> int:
        return int((utcnow().timestamp() + self.window_seconds) * 1000)

    def _expired(self, deadline_ms: int) -> bool:
        return utcnow().timestamp() * 1000 >= deadline_ms

    # -- API -------------------------------------------------------------- #
    async def claim_rotation(self, token_hash: str) -> str | None:
        """Prend la rotation, ou rend le successeur déjà émis pour ce token.

        Retourne ``None`` quand l'appelant doit poursuivre le chemin normal :
        c'est alors la base qui arbitre, y compris pour refuser une vraie
        réutilisation. Retourne le token successeur quand un rejeu autorisé est
        établi.
        """
        if not self.enabled:
            return None
        client = get_redis_client()
        if client is None:
            return None

        key = self._key(token_hash)
        try:
            for _ in range(_MAX_CLAIM_ATTEMPTS):
                acquired = await client.set(
                    key,
                    f"{_PENDING_PREFIX}{self._deadline_ms()}",
                    nx=True,
                    px=self._ttl_ms(),
                )
                if acquired:
                    return None
                outcome = await self._await_result(client, key)
                if outcome is _VANISHED:
                    continue  # le détenteur a abandonné : on retente la prise
                return outcome if isinstance(outcome, str) else None
            return None
        except Exception as exc:  # pragma: no cover - dépend d'une panne Redis
            self._degrade("prise de rotation", exc)
            return None

    async def publish_successor(self, token_hash: str, successor_raw: str) -> None:
        """Publie le successeur émis, pour la durée de la fenêtre seulement."""
        if not self.enabled:
            return
        client = get_redis_client()
        if client is None:
            return
        try:
            await client.set(
                self._key(token_hash),
                f"{_RESULT_PREFIX}{self._deadline_ms()}:{successor_raw}",
                px=self._ttl_ms(),
            )
        except Exception as exc:  # pragma: no cover - dépend d'une panne Redis
            # Sans publication, un rejeu retombe sur la détection de
            # réutilisation : dégradé, mais jamais moins sûr.
            self._degrade("publication du successeur", exc)

    async def discard(self, token_hash: str) -> None:
        """Supprime l'entrée : rotation abandonnée, logout ou révocation."""
        if not self.enabled:
            return
        client = get_redis_client()
        if client is None:
            return
        try:
            await client.delete(self._key(token_hash))
        except Exception as exc:  # pragma: no cover - dépend d'une panne Redis
            self._degrade("purge de rotation", exc)

    # -- interne ---------------------------------------------------------- #
    async def _await_result(self, client: Any, key: str) -> object:
        """Attend, de manière bornée, le successeur publié par un autre worker."""
        loop = asyncio.get_running_loop()
        budget = min(float(self.window_seconds), _MAX_WAIT_SECONDS)
        stop_at = loop.time() + budget

        while True:
            value = await client.get(key)
            if value is None:
                return _VANISHED
            if value.startswith(_RESULT_PREFIX):
                return self._read_result(value)
            if loop.time() >= stop_at:
                return None
            await asyncio.sleep(_POLL_INTERVAL_SECONDS)

    def _read_result(self, value: str) -> str | None:
        _, _, payload = value.partition(_RESULT_PREFIX)
        raw_deadline, _, successor = payload.partition(":")
        if not successor:
            return None
        try:
            deadline_ms = int(raw_deadline)
        except ValueError:
            return None
        if self._expired(deadline_ms):
            return None
        return successor

    def _degrade(self, step: str, exc: Exception) -> None:
        """Journalise une dégradation sans jamais exposer de matière sensible."""
        logger.warning(
            "Rotation grace indisponible (%s) : %s — repli sur le comportement strict",
            step,
            type(exc).__name__,
        )


class _Vanished:
    """Marqueur : la clé a disparu, la prise de rotation est à retenter."""

    __slots__ = ()


_VANISHED: Final = _Vanished()
