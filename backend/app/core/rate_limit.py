"""Redis-backed rate limiting.

Fail-CLOSED by default: if Redis is configured but unreachable or errors at runtime,
the request is REFUSED (503) instead of being silently allowed. A Redis outage must
not disable anti-abuse protection (login brute-force, spam, upload flooding).

Endpoints that are genuinely low-risk may opt into fail-open explicitly with
`fail_open=True`, documented at the call site. Default is fail-closed everywhere.

Distinct case: when Redis is not configured at all (`get_redis_client()` returns None,
e.g. dev/test without Redis), rate limiting is simply OFF by configuration — a
deliberate no-op, not a runtime failure — so we do not raise there.

Deux propriétés, ajoutées par AUTH-04A, tiennent le reste de ce module :

- **Aucune donnée personnelle dans une clé.** Une adresse e-mail sert d'axe de
  comptage, pas d'étiquette : `rate_limit_identity()` la remplace par un HMAC
  tronqué. Redis cessait autrement d'être un simple compteur pour devenir un
  index énumérable des adresses ayant tenté de se connecter.
- **Une fenêtre toujours bornée.** L'incrément et la pose du TTL sont une seule
  opération atomique. Séparés, un échec entre les deux laissait une clé sans
  expiration, donc un blocage définitif de l'adresse ou de l'IP concernée.
"""

from __future__ import annotations

import hashlib
import hmac
import logging
from typing import Any

from app.core.config import get_settings
from app.core.errors import AppError
from app.integrations.redis import get_redis_client

logger = logging.getLogger(__name__)

RATE_LIMIT_BACKEND_UNAVAILABLE = "RATE_LIMIT_BACKEND_UNAVAILABLE"

#: Longueur de l'empreinte conservée dans la clé. 128 bits suffisent largement à
#: écarter toute collision à l'échelle d'un compteur, et raccourcissent les clés.
_IDENTITY_DIGEST_CHARS = 32

#: INCR puis EXPIRE en une seule exécution côté serveur Redis. La pose du TTL est
#: conditionnelle : elle n'a lieu qu'au premier incrément, ce qui préserve la
#: sémantique de fenêtre fixe sans jamais laisser la clé sans expiration.
#: Le `PEXPIRE` de rattrapage couvre le cas d'une clé héritée sans TTL.
_INCR_WITH_TTL = """
local current = redis.call('INCR', KEYS[1])
if current == 1 then
  redis.call('EXPIRE', KEYS[1], ARGV[1])
else
  if redis.call('TTL', KEYS[1]) < 0 then
    redis.call('EXPIRE', KEYS[1], ARGV[1])
  end
end
return current
"""


#: Reserve une place SI le plafond n'est pas atteint. Verification, increment et
#: pose du TTL sont une seule execution : deux requetes simultanees ne peuvent
#: pas lire la meme valeur avant d'incrementer toutes les deux. Rend -1 quand le
#: plafond est plein, sinon le rang obtenu.
_RESERVE_SLOT = """
local limit = tonumber(ARGV[1])
local current = tonumber(redis.call('GET', KEYS[1]) or '0')
if current >= limit then
  return -1
end
local rank = redis.call('INCR', KEYS[1])
if rank == 1 or redis.call('TTL', KEYS[1]) < 0 then
  redis.call('EXPIRE', KEYS[1], ARGV[2])
end
return rank
"""

#: Rend une place reservee quand la creation echoue ensuite. Ne descend JAMAIS
#: sous zero : une compensation repetee sur un compteur deja vide n'a aucun
#: effet, ce qui rend l'operation sure meme appelee deux fois.
_RELEASE_SLOT = """
local current = tonumber(redis.call('GET', KEYS[1]) or '0')
if current <= 0 then
  return 0
end
return redis.call('DECR', KEYS[1])
"""


async def reserve_slot(key: str, limit: int, window_seconds: int) -> bool:
    """Réserve une place sous plafond, atomiquement.

    Contrairement à `enforce_rate_limit`, la place est prise AVANT l'action et
    peut être rendue si celle-ci échoue. C'est ce qui permet à un plafond de
    compter des créations réelles sans jamais les laisser dépasser : lire puis
    incrémenter laissait passer autant de requêtes que la concurrence le
    permettait entre les deux opérations.

    Fail-CLOSED : sans compteur lisible, on ne peut pas garantir le plafond.
    Redis non configuré reste le no-op documenté du module.
    """
    client = get_redis_client()
    if client is None:
        return True

    try:
        rank = int(await _eval(client, _RESERVE_SLOT, key, str(limit), str(window_seconds)))
    except Exception:
        logger.error("reserve_slot_backend_unavailable key=%s", key, exc_info=True)
        raise AppError(
            status_code=503,
            code=RATE_LIMIT_BACKEND_UNAVAILABLE,
            detail="Service momentanément indisponible. Réessayez dans un instant.",
        ) from None

    return rank >= 0


async def release_slot(key: str) -> None:
    """Rend une place réservée. Ne fait jamais échouer l'appelant.

    Appelée sur le chemin d'erreur : si elle échoue à son tour, le plafond sera
    simplement atteint un peu plus tôt jusqu'à l'expiration de la fenêtre — une
    dégradation acceptable, là où propager transformerait un échec de création
    en seconde erreur pour l'utilisateur.
    """
    client = get_redis_client()
    if client is None:
        return
    try:
        await _eval(client, _RELEASE_SLOT, key)
    except Exception:
        logger.error("release_slot_failed key=%s", key, exc_info=True)


def rate_limit_identity(value: str) -> str:
    """Empreinte d'un identifiant personnel, pour usage en clé de comptage.

    HMAC-SHA256 avec `RATE_LIMIT_KEY_PEPPER`, tronqué. Le pepper est distinct de
    ceux des jetons de rafraîchissement et de vérification : il ne protège pas un
    secret, il empêche de retrouver une adresse à partir d'une clé Redis, y
    compris pour qui connaîtrait l'adresse et voudrait confirmer sa présence.

    Sans pepper configuré, l'empreinte reste calculée — un déploiement qui
    l'oublie perd la résistance au dictionnaire, mais ne réintroduit jamais
    l'adresse en clair.
    """
    pepper = get_settings().rate_limit_key_pepper
    digest = hmac.new(pepper.encode(), value.encode(), hashlib.sha256).hexdigest()
    return digest[:_IDENTITY_DIGEST_CHARS]


async def enforce_rate_limit(
    key: str,
    limit: int,
    window_seconds: int,
    *,
    fail_open: bool = False,
) -> None:
    client = get_redis_client()
    if client is None:
        # Redis not configured (dev/test): rate limiting off by configuration, not a
        # failure. Do NOT fail closed here or every endpoint would 503 without Redis.
        return

    try:
        count = await _incr_with_ttl(client, key, window_seconds)
    except Exception:
        # Redis is configured but unreachable/erroring. Stable, greppable event name so
        # a future monitoring/alerting layer (e.g. Sentry) can hook onto it.
        logger.error(
            "rate_limit_backend_unavailable key=%s fail_open=%s",
            key,
            fail_open,
            exc_info=True,
        )
        if fail_open:
            return
        raise AppError(
            status_code=503,
            code=RATE_LIMIT_BACKEND_UNAVAILABLE,
            detail="Service momentanément indisponible. Réessayez dans un instant.",
        ) from None

    if int(count) > limit:
        raise AppError(
            status_code=429,
            code="RATE_LIMITED",
            detail="Trop de tentatives. Réessayez plus tard.",
        )


async def _eval(client: Any, script: str, key: str, *args: str) -> Any:
    """Exécute un script Lua. Isolé pour garder un seul point de typage souple :
    les stubs du client Redis n'expriment pas correctement `eval`."""
    return await client.eval(script, 1, key, *args)


async def _incr_with_ttl(client: Any, key: str, window_seconds: int) -> int:
    """Incrémente en garantissant qu'un TTL existe, en une seule aller-retour.

    `eval` plutôt que `register_script` : le script est court, et le faire
    exécuter tel quel évite d'avoir à gérer un `NOSCRIPT` après un redémarrage du
    serveur Redis.
    """
    return int(await _eval(client, _INCR_WITH_TTL, key, str(window_seconds)))
