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

export type FeedMediaViewerSession = {
  open: boolean;
  mediaUrl: string;
  objectUrl: string | null;
  label: string;
  epoch: number;
};

const EMPTY: FeedMediaViewerSession = {
  open: false,
  mediaUrl: "",
  objectUrl: null,
  label: "",
  epoch: 0,
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
  session = {
    open: true,
    mediaUrl: input.mediaUrl.trim(),
    objectUrl: nextUrl,
    label: input.label.trim() || "Image de la publication",
    epoch: currentEpoch,
  };
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
