"use client";

import type { LocalVideoFeedItem } from "@yunicity/types";

import { LocalVideoSlide } from "@/components/videos/local-video-slide";
import { useVideoFeedAutoplay } from "@/hooks/use-video-feed-autoplay";
import { useCallback, useEffect, useRef } from "react";

type LocalVideoFeedViewportProps = {
  items: LocalVideoFeedItem[];
  focusVideoId?: string | null;
  onActiveVideoChange: (videoId: string | null) => void;
  onOpenComments: (videoId: string) => void;
  onToggleLike: (item: LocalVideoFeedItem) => void;
  onShare: (item: LocalVideoFeedItem) => void;
  onOpenReport: (videoId: string) => void;
  onEndReached?: () => void;
};

export function LocalVideoFeedViewport({
  items,
  focusVideoId = null,
  onActiveVideoChange,
  onOpenComments,
  onToggleLike,
  onShare,
  onOpenReport,
  onEndReached,
}: LocalVideoFeedViewportProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemIds = items.map((item) => item.id);
  const activeId = useVideoFeedAutoplay(itemIds, focusVideoId);

  useEffect(() => {
    if (!focusVideoId) return;
    const frame = window.requestAnimationFrame(() => {
      document
        .querySelector<HTMLElement>(`[data-video-slide-id="${focusVideoId}"]`)
        ?.scrollIntoView({ behavior: "auto", block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [focusVideoId, items]);

  useEffect(() => {
    onActiveVideoChange(activeId);
  }, [activeId, onActiveVideoChange]);

  const handleScroll = useCallback(() => {
    const node = containerRef.current;
    if (!node || !onEndReached) return;
    const remaining = node.scrollHeight - node.scrollTop - node.clientHeight;
    if (remaining < 240) onEndReached();
  }, [onEndReached]);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="videos-feed-viewport fixed inset-0 z-40 snap-y snap-mandatory overflow-y-auto overscroll-y-contain scroll-smooth md:static md:z-auto md:h-[calc(100dvh-6rem)] md:rounded-2xl xl:h-[calc(100dvh-4.25rem-2rem)]"
    >
      {items.map((item) => (
        <LocalVideoSlide
          key={item.id}
          item={item}
          isActive={activeId === item.id}
          onOpenComments={() => onOpenComments(item.id)}
          onToggleLike={() => onToggleLike(item)}
          onShare={() => onShare(item)}
          onOpenReport={() => onOpenReport(item.id)}
        />
      ))}
    </div>
  );
}
