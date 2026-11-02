/**
 * Session visionneuse média feed (MEDIA-01B).
 *
 * Ownership hors carte via retain/release. Fermée automatiquement lors d'une
 * purge `clearAuthorizedMediaSession` (logout / switch / 401).
 */

import {
  clearAuthorizedMediaSession,
  getAuthorizedMediaEpoch,
  onAuthorizedMediaSessionClear,
  releaseAuthorizedObjectUrl,
  retainAuthorizedObjectUrl,
} from "@yunicity/utils";

/** Un média de la liste parcourue par la visionneuse. */
export type FeedMediaViewerItem = {
  mediaUrl: string;
  label: string;
};

export type FeedMediaViewerSession = {
  open: boolean;
  /** Média COURANT — dérivé de `items[index]`, conservé pour les appelants mono. */
  mediaUrl: string;
  /**
   * Blob partagé par l'ouvreur, et UNIQUEMENT pour le média d'ouverture.
   * Il tombe à `null` dès la première navigation : la visionneuse résout
   * alors elle-même, à mesure de la consultation (MEDIA-MULTI-PHOTO-01).
   */
  objectUrl: string | null;
  label: string;
  epoch: number;
  /** Liste ORDONNÉE — l'ordre de publication, jamais réordonné ici. */
  items: FeedMediaViewerItem[];
  index: number;
};

const EMPTY: FeedMediaViewerSession = {
  open: false,
  mediaUrl: "",
  objectUrl: null,
  label: "",
  epoch: 0,
  items: [],
  index: 0,
};

let session: FeedMediaViewerSession = EMPTY;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

function resetViewerState(): void {
  const held = session.objectUrl;
  session = { ...EMPTY, epoch: getAuthorizedMediaEpoch() };
  if (held) releaseAuthorizedObjectUrl(held);
  emit();
}

// Branchement unique sur la purge centrale — pas de logique logout locale.
onAuthorizedMediaSessionClear(() => {
  resetViewerState();
});

export function getFeedMediaViewerSession(): FeedMediaViewerSession {
  return session;
}

export function subscribeFeedMediaViewer(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function openFeedMediaViewer(input: {
  mediaUrl: string;
  objectUrl: string | null;
  label: string;
  /** Liste complète de la publication. Absente : la visionneuse reste mono. */
  items?: FeedMediaViewerItem[];
  /** Index TOUCHÉ dans cette liste — le parcours démarre là. */
  index?: number;
}): void {
  const currentEpoch = getAuthorizedMediaEpoch();
  const previous = session.objectUrl;
  const nextUrl = input.objectUrl?.trim() || null;
  if (nextUrl) {
    if (!retainAuthorizedObjectUrl(nextUrl, currentEpoch)) {
      return;
    }
  }
  if (previous && previous !== nextUrl) releaseAuthorizedObjectUrl(previous);

  const mediaUrl = input.mediaUrl.trim();
  const label = input.label.trim() || "Image de la publication";
  const items = (input.items ?? [])
    .map((item) => ({ mediaUrl: item.mediaUrl.trim(), label: item.label.trim() }))
    .filter((item) => item.mediaUrl.length > 0);
  const list = items.length > 0 ? items : [{ mediaUrl, label }];
  const index = Math.min(Math.max(input.index ?? 0, 0), list.length - 1);

  session = {
    open: true,
    mediaUrl: list[index]?.mediaUrl ?? mediaUrl,
    objectUrl: nextUrl,
    label: list[index]?.label || label,
    epoch: currentEpoch,
    items: list,
    index,
  };
  emit();
}

/**
 * Déplace la visionneuse dans la liste, sans boucler.
 *
 * Le blob d'ouverture est RELÂCHÉ au premier déplacement : il n'appartient
 * qu'au média touché. Tous les autres — y compris si l'on revient sur le
 * premier — sont résolus par la visionneuse À MESURE de leur consultation.
 * C'est la contrainte « ne pas charger inutilement les dix fichiers ».
 */
export function goToFeedMediaViewerIndex(index: number): void {
  if (!session.open || session.items.length === 0) return;
  const target = Math.min(Math.max(index, 0), session.items.length - 1);
  if (target === session.index) return;

  const held = session.objectUrl;
  const item = session.items[target];
  if (!item) return;
  session = {
    ...session,
    mediaUrl: item.mediaUrl,
    label: item.label || "Image de la publication",
    objectUrl: null,
    index: target,
  };
  if (held) releaseAuthorizedObjectUrl(held);
  emit();
}

export function closeFeedMediaViewer(): void {
  if (!session.open && !session.objectUrl) return;
  resetViewerState();
}

/** Alias explicite — même primitive que la purge globale (idempotente). */
export function clearFeedMediaViewerOnSessionChange(): void {
  clearAuthorizedMediaSession();
}

/** Test-only. */
export function __resetFeedMediaViewerSessionForTests(): void {
  resetViewerState();
}
