"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";

import { FeedMobileMediaViewer } from "@/components/feed/mobile/feed-mobile-media-viewer";
import {
  closeFeedMediaViewer,
  getFeedMediaViewerSession,
  subscribeFeedMediaViewer,
} from "@/lib/feed/feed-media-viewer-session";

/**
 * Host racine — survit au démontage des cartes feed (MEDIA-01B ownership).
 * Ferme la visionneuse sur changement de route (pas de fuite permanente).
 */
export function FeedMediaViewerHost() {
  const pathname = usePathname();
  const previousPathRef = useRef<string | null>(null);

  const session = useSyncExternalStore(
    subscribeFeedMediaViewer,
    getFeedMediaViewerSession,
    getFeedMediaViewerSession,
  );

  useEffect(() => {
    if (previousPathRef.current === null) {
      previousPathRef.current = pathname;
      return;
    }
    if (previousPathRef.current !== pathname) {
      previousPathRef.current = pathname;
      closeFeedMediaViewer();
    }
  }, [pathname]);

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
