/**
 * Session mémoire des object URLs média authentifiées (MEDIA-01B).
 *
 * Epoch monotone + AbortController de session : une purge (logout / switch /
 * 401) invalide toute réponse tardive et révoque chaque Blob exactement une fois.
 */

type RetainEntry = {
  count: number;
  epoch: number;
};

let epoch = 0;
const retains = new Map<string, RetainEntry>();
const activeFetches = new Set<AbortController>();
const clearListeners = new Set<() => void>();

export function getAuthorizedMediaEpoch(): number {
  return epoch;
}

/** S'abonner aux purges (ex. fermeture visionneuse). Retourne un unsubscribe. */
export function onAuthorizedMediaSessionClear(listener: () => void): () => void {
  clearListeners.add(listener);
  return () => {
    clearListeners.delete(listener);
  };
}

/**
 * Démarre un fetch média lié à l'epoch courante.
 * Le signal est aborté lors d'une purge ; `finish()` retire le contrôleur.
 */
export function beginAuthorizedMediaFetch(): {
  epoch: number;
  signal: AbortSignal;
  finish: () => void;
} {
  const capturedEpoch = epoch;
  const controller = new AbortController();
  activeFetches.add(controller);
  return {
    epoch: capturedEpoch,
    signal: controller.signal,
    finish: () => {
      activeFetches.delete(controller);
    },
  };
}

/**
 * Retain d'une object URL pour l'epoch courante.
 * @returns false si l'epoch ne correspond plus — l'appelant doit révoquer immédiatement.
 */
export function retainAuthorizedObjectUrl(url: string, forEpoch?: number): boolean {
  const trimmed = url.trim();
  if (!trimmed.startsWith("blob:")) return false;
  const expected = forEpoch ?? epoch;
  if (expected !== epoch) return false;
  const existing = retains.get(trimmed);
  if (existing) {
    if (existing.epoch !== epoch) {
      // Entrée d'une ancienne session — ne pas réutiliser.
      return false;
    }
    existing.count += 1;
    return true;
  }
  retains.set(trimmed, { count: 1, epoch });
  return true;
}

/**
 * Release d'une object URL. Sans effet si absente (déjà purgée) — jamais de
 * compteur négatif, jamais de double révocation.
 */
export function releaseAuthorizedObjectUrl(url: string | null | undefined): void {
  const trimmed = url?.trim();
  if (!trimmed || !trimmed.startsWith("blob:")) return;
  const entry = retains.get(trimmed);
  if (!entry) return;
  if (entry.count <= 1) {
    retains.delete(trimmed);
    try {
      URL.revokeObjectURL(trimmed);
    } catch {
      /* best-effort */
    }
    return;
  }
  entry.count -= 1;
}

/**
 * Purge idempotente de toute la session média autorisée.
 * Ordre : epoch++ → abort fetches → listeners (viewer) → révoquer chaque Blob une fois.
 * Ne remonte jamais d'exception à l'appelant.
 */
export function clearAuthorizedMediaSession(): void {
  try {
    epoch += 1;

    for (const controller of [...activeFetches]) {
      try {
        if (!controller.signal.aborted) controller.abort();
      } catch {
        /* ignore */
      }
    }
    activeFetches.clear();

    for (const listener of [...clearListeners]) {
      try {
        listener();
      } catch {
        /* ignore — ne doit pas bloquer logout */
      }
    }

    for (const url of [...retains.keys()]) {
      retains.delete(url);
      try {
        URL.revokeObjectURL(url);
      } catch {
        /* ignore */
      }
    }
  } catch {
    /* purge best-effort : ne jamais bloquer la déconnexion */
  }
}

/** Test-only. */
export function __authorizedObjectUrlRetainCountForTests(url: string): number {
  return retains.get(url)?.count ?? 0;
}

/** Test-only. */
export function __authorizedMediaRegistrySizeForTests(): number {
  return retains.size;
}

/** Test-only. */
export function __authorizedMediaActiveFetchCountForTests(): number {
  return activeFetches.size;
}

/** Test-only — remet epoch/registre (aprèsEach). */
export function __resetAuthorizedMediaSessionForTests(): void {
  epoch = 0;
  for (const controller of [...activeFetches]) {
    try {
      if (!controller.signal.aborted) controller.abort();
    } catch {
      /* ignore */
    }
  }
  activeFetches.clear();
  for (const url of [...retains.keys()]) {
    retains.delete(url);
    try {
      URL.revokeObjectURL(url);
    } catch {
      /* ignore */
    }
  }
}
