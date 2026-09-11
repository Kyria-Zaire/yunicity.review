"""Budget d'e-mails transactionnels — AUTH-04A.

Le plan d'envoi a un quota journalier. Rien ne le surveillait : une vague
d'inscriptions pouvait l'épuiser, et la personne qui essayait ensuite de
récupérer son mot de passe ne recevait plus rien — sans que quiconque le sache.

Le budget se tient dans un compteur Redis par jour UTC, et sépare deux
catégories :

- **critique** — réinitialisation de mot de passe, sécurité du compte. Peut
  consommer tout le budget, y compris la réserve. C'est le dernier envoi à
  s'éteindre.
- **courant** — vérification d'adresse à l'inscription. S'arrête plus tôt, en
  laissant intacte la réserve.

Épuisement n'est jamais synonyme de perte : le compte est créé, son jeton est en
base, et le renvoi régénère un lien dès que le budget repart.
"""

from __future__ import annotations

import logging
from datetime import UTC, datetime
from enum import StrEnum

from app.core.config import Settings
from app.integrations.redis import get_redis_client

logger = logging.getLogger(__name__)

_KEY_PREFIX = "email:budget"


class EmailCategory(StrEnum):
    #: Récupération de compte et sécurité : prioritaire, puise dans la réserve.
    CRITICAL = "critical"
    #: Vérification d'adresse : s'arrête avant d'entamer la réserve.
    ROUTINE = "routine"


def budget_key(now: datetime | None = None) -> str:
    day = (now or datetime.now(UTC)).astimezone(UTC).strftime("%Y%m%d")
    return f"{_KEY_PREFIX}:{day}"


def _seconds_until_utc_midnight(now: datetime) -> int:
    """TTL du compteur : il doit mourir avec le jour qu'il compte."""
    tomorrow = now.astimezone(UTC).date().toordinal() + 1
    midnight = datetime.fromordinal(tomorrow).replace(tzinfo=UTC)
    return max(int((midnight - now.astimezone(UTC)).total_seconds()), 1)


class EmailBudget:
    """Réservation d'un envoi. Fail-OPEN délibéré — voir `try_consume`."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    async def try_consume(self, category: EmailCategory, *, now: datetime | None = None) -> bool:
        """Réserve un envoi. Rend False si le budget de la catégorie est épuisé.

        Fail-OPEN si Redis est injoignable, contrairement au limiteur d'abus : le
        budget protège un quota fournisseur, pas le service. Refuser tous les
        e-mails parce que le compteur est illisible transformerait une panne de
        Redis en impossibilité de récupérer son compte — un mal pire que le
        dépassement qu'on cherche à éviter.
        """
        budget = self._settings.email_daily_budget
        if budget <= 0:
            return True

        client = get_redis_client()
        if client is None:
            return True

        instant = now or datetime.now(UTC)
        plafond = (
            budget
            if category is EmailCategory.CRITICAL
            else max(budget - self._settings.email_daily_budget_reserve, 0)
        )

        try:
            key = budget_key(instant)
            used = int(await client.incr(key))
            if used == 1:
                await client.expire(key, _seconds_until_utc_midnight(instant))
        except Exception:
            logger.warning("email_budget_backend_unavailable", exc_info=True)
            return True

        if used > plafond:
            # L'incrément a déjà eu lieu : le compteur surestime légèrement la
            # consommation réelle une fois le plafond franchi. C'est volontaire —
            # sur-compter fait rester en deçà du quota, sous-compter le dépasse.
            logger.warning(
                "email_budget_exhausted category=%s used=%s cap=%s",
                category.value,
                used,
                plafond,
            )
            return False

        if plafond and used == plafond - self._settings.email_daily_budget_reserve:
            logger.info("email_budget_reserve_reached used=%s cap=%s", used, plafond)

        return True

    async def consumed_today(self, *, now: datetime | None = None) -> int:
        """Consommation du jour, pour les métriques. Jamais d'identité, un entier."""
        client = get_redis_client()
        if client is None:
            return 0
        try:
            raw = await client.get(budget_key(now))
        except Exception:
            return 0
        return int(raw) if raw else 0
