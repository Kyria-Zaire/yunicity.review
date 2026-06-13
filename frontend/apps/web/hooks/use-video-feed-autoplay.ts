"use client";

import { selectAutoplayVideoId } from "@yunicity/utils";
import { useEffect, useState } from "react";

export function useVideoFeedAutoplay(itemIds: string[]) {
  const [activeId, setActiveId] = useState<string | null>(itemIds[0] ?? null);

  useEffect(() => {
    if (itemIds.length === 0) {
      setActiveId(null);
      return;
    }
    setActiveId((current) => {
      if (current && itemIds.includes(current)) return current;
      return itemIds[0] ?? null;
    });
  }, [itemIds]);

  useEffect(() => {
    if (itemIds.length === 0) return;

    const visibility = new Map<string, number>();
    const observers: IntersectionObserver[] = [];

    for (const id of itemIds) {
      const element = document.querySelector<HTMLElement>(`[data-video-slide-id="${id}"]`);
      if (!element) continue;

      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            const slideId = entry.target.getAttribute("data-video-slide-id");
            if (!slideId) continue;
            visibility.set(slideId, entry.intersectionRatio);
          }
          const nextId = selectAutoplayVideoId(visibility);
          if (nextId) setActiveId(nextId);
        },
        { threshold: [0, 0.25, 0.5, 0.75, 1] },
      );
      observer.observe(element);
      observers.push(observer);
    }

    return () => {
      for (const observer of observers) observer.disconnect();
    };
  }, [itemIds]);

  return activeId;
}
