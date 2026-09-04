"use client";

import type { LocalVideoFeedItem } from "@yunicity/types";

import { LocalVideoSlide } from "@/components/videos/local-video-slide";
import { useVideoFeedAutoplay } from "@/hooks/use-video-feed-autoplay";
import { useCallback, useEffect, useRef, useState } from "react";

type LocalVideoFeedViewportProps = {
  items: LocalVideoFeedItem[];
  focusVideoId?: string | null;
  pointerOverFeed?: boolean;
  processingErrors?: Record<string, string | null | undefined>;
  onDismissProcessing?: (videoId: string) => void;
  onActiveVideoChange: (videoId: string | null) => void;
  onOpenComments: (videoId: string) => void;
  onToggleLike: (item: LocalVideoFeedItem) => void;
  onShare: (item: LocalVideoFeedItem) => void;
  onOpenReport: (videoId: string) => void;
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
  processingErrors = {},
  onDismissProcessing,
  onActiveVideoChange,
  onOpenComments,
  onToggleLike,
  onShare,
  onOpenReport,
  onEndReached,
  onSlideChromeVisible,
}: LocalVideoFeedViewportProps) {
  const [scrollRoot, setScrollRoot] = useState<HTMLDivElement | null>(null);
  const suppressActiveChangeRef = useRef(false);
  const lastProgrammaticFocusRef = useRef<string | null>(null);
  const itemIds = items.map((item) => item.id);
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
          processingError={processingErrors[item.id]}
          onDismissProcessing={
            onDismissProcessing ? () => onDismissProcessing(item.id) : undefined
          }
          onOpenComments={() => onOpenComments(item.id)}
          onToggleLike={() => onToggleLike(item)}
          onShare={() => onShare(item)}
          onChromeVisibleChange={
            activeId === item.id ? onSlideChromeVisible : undefined
          }
        />
      ))}
    </div>
  );
}
