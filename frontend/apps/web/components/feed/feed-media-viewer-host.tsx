"use client";

import { useCallback, useSyncExternalStore } from "react";

import { FeedMobileMediaViewer } from "@/components/feed/mobile/feed-mobile-media-viewer";
import {
  closeFeedMediaViewer,
  getFeedMediaViewerSession,
  subscribeFeedMediaViewer,
} from "@/lib/feed/feed-media-viewer-session";

/**
 * Host racine — survit au démontage des cartes feed (MEDIA-01B ownership).
 */
export function FeedMediaViewerHost() {
  const session = useSyncExternalStore(
    subscribeFeedMediaViewer,
    getFeedMediaViewerSession,
    getFeedMediaViewerSession,
  );

  const onOpenChange = useCallback((open: boolean) => {
    if (!open) closeFeedMediaViewer();
  }, []);

  if (!session.open && !session.mediaUrl) return null;

  return (
    <FeedMobileMediaViewer
      open={session.open}
      onOpenChange={onOpenChange}
      objectUrl={session.objectUrl}
      mediaUrl={session.mediaUrl}
      label={session.label}
    />
  );
}
