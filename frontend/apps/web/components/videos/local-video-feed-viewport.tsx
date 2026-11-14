"use client";

import type { LocalVideoFeedItem } from "@yunicity/types";

import { LocalVideoSlide } from "@/components/videos/local-video-slide";
import { useVideoFeedAutoplay } from "@/hooks/use-video-feed-autoplay";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type LocalVideoFeedViewportProps = {
  items: LocalVideoFeedItem[];
  focusVideoId?: string | null;
  pointerOverFeed?: boolean;
  /** Son coupé, réglé depuis la barre haute du fil et commun à toutes les vidéos. */
  isMuted: boolean;
  processingErrors?: Record<string, string | null | undefined>;
  onDismissProcessing?: (videoId: string) => void;
  onActiveVideoChange: (videoId: string | null) => void;
  onOpenComments: (videoId: string) => void;
  onToggleLike: (item: LocalVideoFeedItem) => void;
  onShare: (item: LocalVideoFeedItem) => void;
  onOpenMore: (videoId: string, trigger: HTMLElement) => void;
  onOpenDescription: (videoId: string, trigger: HTMLElement) => void;
  /** Vidéo dont un panneau est ouvert (commentaires, description, « … », signalement). */
  suspendedVideoId?: string | null;
  onEndReached?: () => void;
  onSlideChromeVisible?: (visible: boolean) => void;
};

function scrollContainerToSlide(container: HTMLElement, slide: HTMLElement): void {
  container.scrollTo({ top: slide.offsetTop, behavior: "auto" });
}

export function LocalVideoFeedViewport({
  items,
  focusVideoId = null,
  pointerOverFeed = false,
  isMuted,
  processingErrors = {},
  onDismissProcessing,
  onActiveVideoChange,
  onOpenComments,
  onToggleLike,
  onShare,
  onOpenMore,
  onOpenDescription,
  suspendedVideoId = null,
  onEndReached,
  onSlideChromeVisible,
}: LocalVideoFeedViewportProps) {
  const [scrollRoot, setScrollRoot] = useState<HTMLDivElement | null>(null);
  const suppressActiveChangeRef = useRef(false);
  const lastProgrammaticFocusRef = useRef<string | null>(null);
  const itemIds = useMemo(() => items.map((item) => item.id), [items]);
  const activeId = useVideoFeedAutoplay(itemIds, focusVideoId, scrollRoot);

  /** Scroll programmatique uniquement sur changement explicite de ?video= — pas à chaque refresh items. */
  useEffect(() => {
    if (!focusVideoId) {
      lastProgrammaticFocusRef.current = null;
      return;
    }
    if (lastProgrammaticFocusRef.current === focusVideoId) return;
    if (!itemIds.includes(focusVideoId)) return;

    const container = scrollRoot;
    if (!container) return;

    const slide = container.querySelector<HTMLElement>(
      `[data-video-slide-id="${CSS.escape(focusVideoId)}"]`,
    );
    if (!slide) return;

    lastProgrammaticFocusRef.current = focusVideoId;
    suppressActiveChangeRef.current = true;
    scrollContainerToSlide(container, slide);

    const releaseTimer = window.setTimeout(() => {
      suppressActiveChangeRef.current = false;
    }, 120);

    return () => window.clearTimeout(releaseTimer);
  }, [focusVideoId, itemIds, scrollRoot]);

  useEffect(() => {
    if (suppressActiveChangeRef.current) return;
    onActiveVideoChange(activeId);
  }, [activeId, onActiveVideoChange]);

  const handleScroll = useCallback(() => {
    const node = scrollRoot;
    if (!node || !onEndReached) return;
    const remaining = node.scrollHeight - node.scrollTop - node.clientHeight;
    if (remaining < 240) onEndReached();
  }, [onEndReached, scrollRoot]);

  return (
    <div
      ref={setScrollRoot}
      onScroll={handleScroll}
      className="videos-feed-viewport absolute inset-0 snap-y snap-mandatory overflow-y-auto overscroll-y-contain"
    >
      {items.map((item) => (
        <LocalVideoSlide
          key={item.id}
          item={item}
          isActive={activeId === item.id}
          pointerOverFeed={pointerOverFeed}
          isMuted={isMuted}
          processingError={processingErrors[item.id]}
          onDismissProcessing={
            onDismissProcessing ? () => onDismissProcessing(item.id) : undefined
          }
          onOpenComments={() => onOpenComments(item.id)}
          onToggleLike={() => onToggleLike(item)}
          onShare={() => onShare(item)}
          onOpenMore={(trigger) => onOpenMore(item.id, trigger)}
          onOpenDescription={(trigger) => onOpenDescription(item.id, trigger)}
          suspended={suspendedVideoId === item.id}
          onChromeVisibleChange={
            activeId === item.id ? onSlideChromeVisible : undefined
          }
        />
      ))}
    </div>
  );
}
