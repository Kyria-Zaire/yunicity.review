"""Obtention d'une variante d'affichage : cache de derivation et garde-fous.

## Le principe qui gouverne ce module

**La variante est une OPTIMISATION, jamais une dependance.** Sur n'importe quel
echec — derivation impossible, stockage muet, verrou trop long, image animee —
la route sert l'ORIGINAL. Le pire scenario est donc le comportement d'avant ce
ticket : lourd, mais correct. Aucune photo ne devient inaccessible parce qu'on
a voulu l'alleger.

## Disponibilite de l'API

Decoder puis re-encoder une image est un travail CPU SYNCHRONE. Le laisser
courir dans la boucle d'evenements bloquerait toutes les autres requetes du
processus. Trois garde-fous :

1. **hors boucle** — la derivation part dans un thread ;
2. **concurrence bornee** — un semaphore limite les derivations simultanees,
   sans quoi dix lecteurs sur dix photos satureraient le pool de threads ;
3. **delai borne** — au-dela, on sert l'original plutot que de faire attendre.

## Une seule transformation par fichier — DANS CE PROCESSUS

Une tache par CLE DERIVEE : cinq lecteurs arrivant ensemble sur la meme photo
partagent UNE transformation, pas cinq.

⚠️ **La portee est le PROCESSUS, pas le deploiement.** `asyncio.Semaphore`,
le registre des taches et le plafond de deux vivent en memoire locale. Avec
plusieurs workers Uvicorn, ou plusieurs instances, CHACUN a les siens : N
workers peuvent deriver la meme image une fois chacun.

**La consequence est bornee, et c'est pourquoi on s'en contente** : ils
ecrivent tous les MEMES octets a la MEME cle, et l'ecriture est atomique
(remplacement par `os.replace` en filesystem, `put_object` en R2). Le cout est
donc du CPU gaspille, jamais une variante corrompue — et il ne se paie qu'une
fois par media, a la premiere consultation. Un dedoublonnage INTER-processus
demanderait un verrou partage (Redis est dans la pile) : a ouvrir seulement si
la mesure montre que ce gaspillage compte.
"""

from __future__ import annotations

import asyncio
import logging
import uuid
from typing import Final

from app.core.config import Settings
from app.core.errors import AppError
from app.services.story_media.filesystem_storage import StoryMediaFilesystemStorage
from app.services.story_media.image_variants import DerivedImage, derive_variant
from app.services.story_media.r2_storage import StoryMediaR2Storage
from app.services.story_media.storage_keys import (
    story_media_key_for,
    story_media_variant_key,
)

logger = logging.getLogger(__name__)

#: Les deux stockages savent lire et ecrire l'espace derive. L'union explicite
#: vaut mieux qu'un `object` sonde par `getattr` : mypy verifie alors vraiment
#: que chaque branche appelle une methode qui existe.
VariantStorage = StoryMediaR2Storage | StoryMediaFilesystemStorage

#: Derivations simultanees autorisees dans CE processus. Deux suffisent a
#: absorber un carrousel ouvert par plusieurs lecteurs, et laissent le pool de
#: threads disponible pour le reste de l'API.
_MAX_CONCURRENT_DERIVATIONS: Final = 2

#: Au-dela, on sert l'original. Mieux vaut un transfert lourd qu'une requete
#: qui pend : une photo de 12 Mpx se redimensionne en quelques centaines de
#: millisecondes, donc ce plafond n'est atteint que sous forte contention.
_DERIVATION_TIMEOUT_SECONDS: Final = 8.0

_semaphore: asyncio.Semaphore | None = None

#: Derivations EN COURS, une par cle derivee. C'est le dedoublonnage : cinq
#: lecteurs arrivant ensemble sur la meme photo partagent UNE tache.
_inflight: dict[str, asyncio.Task[DerivedImage | None]] = {}


def _get_semaphore() -> asyncio.Semaphore:
    """Semaphore cree PARESSEUSEMENT, dans la boucle qui l'utilisera.

    Le construire a l'import le lierait a la boucle de l'import — celle des
    tests, par exemple — et il serait inutilisable ailleurs.
    """
    global _semaphore
    if _semaphore is None:
        _semaphore = asyncio.Semaphore(_MAX_CONCURRENT_DERIVATIONS)
    return _semaphore


def _retire_inflight(variant_key: str, task: asyncio.Task[DerivedImage | None]) -> None:
    """Retire la tache du registre, et CONSOMME son echec eventuel.

    Si tous les appelants ont renonce (delai depasse), personne n'attend plus la
    tache : une exception non recuperee ferait japper la boucle
    (« Task exception was never retrieved »). On la lit donc ici, ou elle est
    deja journalisee par la derivation elle-meme.
    """
    _inflight.pop(variant_key, None)
    if task.cancelled():
        return
    exception = task.exception()
    if exception is not None:
        logger.info("story_media_variant_task_failed error=%s", type(exception).__name__)


async def get_or_derive_variant(
    settings: Settings,
    storage: VariantStorage,
    user_id: uuid.UUID,
    filename: str,
    variant: str,
) -> DerivedImage | None:
    """Variante d'affichage, calculee une seule fois puis conservee.

    Rend `None` quand il faut servir l'ORIGINAL : source non derivable, image
    animee, variante plus lourde que la source, ou derivation indisponible.

    ⚠️ Cette fonction ne verifie AUCUN droit. Elle est appelee par la route
    APRES son controle d'autorisation, jamais avant — y compris pour une
    variante deja calculee, qui reste donc protegee exactement comme l'original.
    """
    del settings  # la politique de stockage est deja portee par `storage`
    source_key = story_media_key_for(user_id, filename)
    try:
        variant_key = story_media_variant_key(source_key, variant)
    except AppError:
        # Source non derivable (video, extension inattendue) : pas de variante.
        return None

    already = _read_variant(storage, variant_key)
    if already is not None:
        return already

    task = _inflight.get(variant_key)
    if task is None:
        task = asyncio.create_task(
            _derive_and_store(storage, user_id, filename, variant, variant_key)
        )
        _inflight[variant_key] = task
        # Le registre ne grossit jamais : l'entree part avec la tache.
        task.add_done_callback(lambda finished: _retire_inflight(variant_key, finished))

    try:
        # `shield` : un appelant qui renonce N'ANNULE PAS le travail. La tache
        # va au bout, ecrit la variante, et la requete SUIVANTE la trouvera
        # faite. Renoncer n'est donc jamais du travail perdu.
        return await asyncio.wait_for(
            asyncio.shield(task), timeout=_DERIVATION_TIMEOUT_SECONDS
        )
    except TimeoutError:
        # Contention : on sert l'original plutot que de faire pendre la requete.
        logger.info("story_media_variant_timeout variant=%s", variant)
        return None
    except AppError as exc:
        # Source illisible ou hors garde-fou : on ne propage PAS l'erreur, on
        # retombe sur l'original. Une photo deja publiee doit rester visible.
        logger.info("story_media_variant_declined variant=%s code=%s", variant, exc.code)
        return None


async def _derive_and_store(
    storage: VariantStorage,
    user_id: uuid.UUID,
    filename: str,
    variant: str,
    variant_key: str,
) -> DerivedImage | None:
    """Lit la source, derive, ecrit — en occupant UNE place du semaphore.

    ⚠️ Le semaphore est pris ET rendu DANS cette tache, autour du travail reel.
    C'est le point important : `asyncio.to_thread` ne peut pas annuler un thread
    deja parti. Si la place etait liberee par l'appelant qui renonce — comme le
    faisait une premiere redaction de ce module —, le transformation
    continuerait dans son thread pendant qu'une autre prendrait sa place, et le
    plafond de deux ne bornerait plus le travail REELLEMENT actif. Apres
    plusieurs delais depasses, le pool de threads se remplirait sans qu'aucun
    compteur ne le montre.
    """
    source_ext = filename[filename.rfind(".") :].lower()
    async with _get_semaphore():
        source = await asyncio.to_thread(_read_original, storage, user_id, filename)
        derived = await asyncio.to_thread(derive_variant, source, variant, source_ext)

    if derived is None:
        return None

    _write_variant(storage, variant_key, derived)
    return derived


def _read_original(storage: VariantStorage, user_id: uuid.UUID, filename: str) -> bytes:
    if isinstance(storage, StoryMediaFilesystemStorage):
        return storage.read_original_bytes(user_id, filename)
    return storage.read_original_bytes(story_media_key_for(user_id, filename))


def _read_variant(storage: VariantStorage, variant_key: str) -> DerivedImage | None:
    try:
        data = storage.read_variant(variant_key)
    except (AppError, OSError):
        # Une variante illisible n'est pas une erreur servie au client : on la
        # recalcule, ou l'on sert l'original.
        return None
    if not data:
        return None
    content_type = "image/webp" if variant_key.endswith(".webp") else "image/jpeg"
    return DerivedImage(data=data, content_type=content_type)


def _write_variant(
    storage: VariantStorage, variant_key: str, derived: DerivedImage
) -> None:
    try:
        if isinstance(storage, StoryMediaFilesystemStorage):
            storage.write_variant(variant_key, derived.data)
        else:
            storage.write_variant(variant_key, derived.data, derived.content_type)
    except (AppError, OSError) as exc:
        # L'ecriture du cache n'est pas critique : la reponse part depuis les
        # octets en memoire, et la derivation sera rejouee au prochain acces.
        logger.warning("story_media_variant_store_failed error=%s", type(exc).__name__)
