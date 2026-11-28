/**
 * Conservation TEMPORAIRE des médias autorisés, en mémoire de session.
 *
 * ## Ce que ce module n'est PAS
 *
 * ⛔ Ce n'est **pas** un cache HTTP. La route média reste `private, no-store`,
 * et ce module ne change rien à cet en-tête : le navigateur a toujours
 * interdiction de conserver la réponse. Ce qui est conservé ici, c'est le
 * **Blob déjà déchiffré par l'application**, dans la mémoire de l'onglet, pour
 * la durée d'une session autorisée. Les deux mécanismes sont distincts, et
 * c'est délibéré.
 *
 * ## Isolation entre comptes
 *
 * Chaque entrée porte son **epoch**. Une lecture dont l'epoch ne correspond
 * plus à l'epoch courante **échoue**, même si l'URL est identique au caractère
 * près. Une déconnexion, un changement de compte ou un 401 incrémentent
 * l'epoch (`clearAuthorizedMediaSession`) : les entrées du compte précédent
 * deviennent donc **inatteignables avant même d'être révoquées**.
 *
 * ⚠️ Deux comptes ne partagent jamais une entrée. Ce n'est pas seulement la
 * purge qui le garantit — elle pourrait être oubliée sur un chemin de
 * changement de compte —, c'est la comparaison d'epoch à chaque lecture.
 *
 * ## Bornes
 *
 * Le registre est borné **en octets** autant qu'en nombre d'entrées. Borner
 * seulement le nombre laisserait dix photos de 8 Mo occuper 80 Mo : sur un
 * mobile, l'onglet serait tué par le système avant d'avoir atteint la limite.
 * L'éviction est **LRU**, et un média encore affiché n'est jamais révoqué sous
 * les yeux du lecteur : le registre de retain/release le maintient en vie tant
 * qu'un composant le tient.
 */

import {
  getAuthorizedMediaEpoch,
  onAuthorizedMediaSessionClear,
  releaseAuthorizedObjectUrl,
  retainAuthorizedObjectUrl,
} from "./authorized-media-object-url";

/** Plafond total, en octets. */
const MAX_BYTES = 48 * 1024 * 1024;

/** Plafond en nombre d'entrées — garde-fou contre une foule de petits médias. */
const MAX_ENTRIES = 24;

type CacheEntry = {
  objectUrl: string;
  bytes: number;
  epoch: number;
  /** Compteur d'usage monotone : sert l'éviction LRU. */
  usedAt: number;
};

const entries = new Map<string, CacheEntry>();
let totalBytes = 0;
let clock = 0;

/**
 * Clé de cache. La variante en fait partie : la même photo en `card` et en
 * `viewer` sont deux médias différents, de poids très différents.
 */
export function authorizedMediaCacheKey(mediaUrl: string, variant: string): string {
  return `${variant}\u0000${mediaUrl.trim()}`;
}

function dropEntry(key: string): void {
  const entry = entries.get(key);
  if (!entry) return;
  entries.delete(key);
  totalBytes -= entry.bytes;
  if (totalBytes < 0) totalBytes = 0;
  releaseAuthorizedObjectUrl(entry.objectUrl);
}

/** Évince les plus anciennement utilisées jusqu'à repasser sous les bornes. */
function evictUntilWithinBounds(): void {
  while (entries.size > MAX_ENTRIES || totalBytes > MAX_BYTES) {
    let oldestKey: string | null = null;
    let oldestUsedAt = Number.POSITIVE_INFINITY;
    for (const [key, entry] of entries) {
      if (entry.usedAt < oldestUsedAt) {
        oldestUsedAt = entry.usedAt;
        oldestKey = key;
      }
    }
    if (oldestKey === null) return;
    dropEntry(oldestKey);
  }
}

/**
 * Object URL conservée pour ce média, ou `null`.
 *
 * Rend `null` — et **ne réutilise donc rien** — dès que l'epoch a changé : le
 * média appartenait à une autre session autorisée.
 *
 * L'appelant devient copropriétaire : un `retain` est pris pour lui, et il doit
 * le relâcher quand il n'affiche plus le média.
 */
export function takeCachedAuthorizedMedia(
  mediaUrl: string,
  variant: string,
): string | null {
  const key = authorizedMediaCacheKey(mediaUrl, variant);
  const entry = entries.get(key);
  if (!entry) return null;

  const epoch = getAuthorizedMediaEpoch();
  if (entry.epoch !== epoch) {
    // Entrée d'une session antérieure : inatteignable, et retirée au passage.
    dropEntry(key);
    return null;
  }

  if (!retainAuthorizedObjectUrl(entry.objectUrl, epoch)) {
    // Le Blob a été révoqué entre-temps : l'entrée ne vaut plus rien.
    dropEntry(key);
    return null;
  }

  entry.usedAt = ++clock;
  return entry.objectUrl;
}

/**
 * Confie une object URL au cache, qui en prend sa propre copropriété.
 *
 * L'appelant garde la sienne : il doit toujours relâcher la part qu'il
 * détenait. Un échec de `retain` (epoch périmée) laisse le cache inchangé.
 */
export function putCachedAuthorizedMedia(
  mediaUrl: string,
  variant: string,
  objectUrl: string,
  bytes: number,
): void {
  const epoch = getAuthorizedMediaEpoch();
  const key = authorizedMediaCacheKey(mediaUrl, variant);

  const existing = entries.get(key);
  if (existing) {
    if (existing.objectUrl === objectUrl && existing.epoch === epoch) {
      existing.usedAt = ++clock;
      return;
    }
    dropEntry(key);
  }

  // Une seule photo ne doit pas pouvoir vider le cache à elle seule.
  if (bytes > MAX_BYTES) return;

  if (!retainAuthorizedObjectUrl(objectUrl, epoch)) return;

  entries.set(key, { objectUrl, bytes, epoch, usedAt: ++clock });
  totalBytes += bytes;
  evictUntilWithinBounds();
}

/**
 * Retire UNE entrée. Indispensable sur un échec de décodage ou un réessai :
 * sans cela, le réessai reprendrait le Blob défectueux conservé ici, et ne
 * pourrait jamais aboutir — le bouton « réessayer » deviendrait décoratif.
 */
export function dropCachedAuthorizedMedia(mediaUrl: string, variant: string): void {
  dropEntry(authorizedMediaCacheKey(mediaUrl, variant));
}

/**
 * Vide le cache. Appelée par la purge centrale — jamais à la place de celle-ci,
 * qui porte aussi l'epoch, l'abandon des requêtes en vol et la révocation.
 */
export function clearAuthorizedMediaCache(): void {
  for (const key of [...entries.keys()]) dropEntry(key);
  totalBytes = 0;
}

/**
 * Branchement sur la purge centrale, par ABONNEMENT et non par import inverse :
 * `authorized-media-object-url` ne doit rien savoir de ce cache, sans quoi les
 * deux modules s'importeraient l'un l'autre.
 *
 * L'ordre de la purge reste celui du module central — epoch, abandon des
 * requêtes, écouteurs, révocation. Vider ici pendant la phase « écouteurs »
 * est donc sûr : la révocation finale repasse derrière, et `release` comme
 * `revoke` sont idempotents.
 */
onAuthorizedMediaSessionClear(() => {
  clearAuthorizedMediaCache();
});

/** Test-only. */
export function __authorizedMediaCacheStateForTests(): {
  size: number;
  bytes: number;
} {
  return { size: entries.size, bytes: totalBytes };
}
