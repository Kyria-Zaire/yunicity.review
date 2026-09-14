/**
 * Session visionneuse média feed (MEDIA-01B).
 *
 * Ownership explicite hors carte : la carte peut se démonter pendant le plein
 * écran ; le host racine conserve l'object URL via retain/release.
 */

import {
  releaseAuthorizedObjectUrl,
  retainAuthorizedObjectUrl,
} from "@yunicity/utils";

export type FeedMediaViewerSession = {
  open: boolean;
  mediaUrl: string;
  objectUrl: string | null;
  label: string;
};

const EMPTY: FeedMediaViewerSession = {
  open: false,
  mediaUrl: "",
  objectUrl: null,
  label: "",
};

let session: FeedMediaViewerSession = EMPTY;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

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
  const previous = session.objectUrl;
  const nextUrl = input.objectUrl?.trim() || null;
  if (nextUrl) retainAuthorizedObjectUrl(nextUrl);
  if (previous && previous !== nextUrl) releaseAuthorizedObjectUrl(previous);
  session = {
    open: true,
    mediaUrl: input.mediaUrl.trim(),
    objectUrl: nextUrl,
    label: input.label.trim() || "Image de la publication",
  };
  emit();
}

export function closeFeedMediaViewer(): void {
  if (!session.open && !session.objectUrl) return;
  const held = session.objectUrl;
  session = EMPTY;
  if (held) releaseAuthorizedObjectUrl(held);
  emit();
}

/** Test-only. */
export function __resetFeedMediaViewerSessionForTests(): void {
  const held = session.objectUrl;
  session = EMPTY;
  if (held) releaseAuthorizedObjectUrl(held);
  emit();
}
