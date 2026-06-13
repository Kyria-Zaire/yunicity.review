"use client";

import type { LocalVideoFeedItem } from "@yunicity/types";

import { LocalVideoSlide } from "@/components/videos/local-video-slide";
import { useVideoFeedAutoplay } from "@/hooks/use-video-feed-autoplay";
import { useCallback, useRef } from "react";

type LocalVideoFeedViewportProps = {
  items: LocalVideoFeedItem[];
  onOpenComments: () => void;
  onEndReached?: () => void;
};

export function LocalVideoFeedViewport({
  items,
  onOpenComments,
  onEndReached,
}: LocalVideoFeedViewportProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemIds = items.map((item) => item.id);
  const activeId = useVideoFeedAutoplay(itemIds);

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
      className="videos-feed-viewport fixed inset-0 z-40 snap-y snap-mandatory overflow-y-auto overscroll-y-contain scroll-smooth md:static md:z-auto md:h-[calc(100dvh-6rem)] md:rounded-2xl"
    >
      {items.map((item) => (
        <LocalVideoSlide
          key={item.id}
          item={item}
          isActive={activeId === item.id}
          onOpenComments={onOpenComments}
        />
      ))}
    </div>
  );
}
