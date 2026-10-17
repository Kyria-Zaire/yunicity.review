"use client";

import { selectAutoplayVideoId } from "@yunicity/utils";
import { useEffect, useRef, useState } from "react";

export function useVideoFeedAutoplay(
  itemIds: string[],
  preferredVideoId?: string | null,
  scrollRoot?: Element | null,
) {
  const [activeId, setActiveId] = useState<string | null>(() => {
    if (preferredVideoId && itemIds.includes(preferredVideoId)) return preferredVideoId;
    return itemIds[0] ?? null;
  });

  const lastPreferredRef = useRef(preferredVideoId ?? null);
  /** Bloque l'IO jusqu'à ce que la slide deep-linkée soit réellement visible. */
  const preferredLockRef = useRef<string | null>(
    preferredVideoId && itemIds.includes(preferredVideoId) ? preferredVideoId : null,
  );

  /** Ne re-pin que sur changement d'URL / deep-link — pas à chaque refresh du feed. */
  useEffect(() => {
    const nextPreferred = preferredVideoId ?? null;
    if (nextPreferred === lastPreferredRef.current) return;
    lastPreferredRef.current = nextPreferred;
    if (nextPreferred && itemIds.includes(nextPreferred)) {
      preferredLockRef.current = nextPreferred;
      setActiveId(nextPreferred);
    }
  }, [preferredVideoId, itemIds]);

  /** Conserve la slide visible quand le feed se met à jour (likes, pagination). */
  useEffect(() => {
    if (itemIds.length === 0) {
      setActiveId(null);
      return;
    }
    setActiveId((current) => {
      const pinned = lastPreferredRef.current;
      if (pinned && itemIds.includes(pinned)) {
        preferredLockRef.current = pinned;
        return pinned;
      }
      if (current && itemIds.includes(current)) return current;
      return itemIds[0] ?? null;
    });
  }, [itemIds]);

  useEffect(() => {
    if (!scrollRoot || itemIds.length === 0) return;

    const visibility = new Map<string, number>();
    const observers: IntersectionObserver[] = [];

    for (const id of itemIds) {
      const element = scrollRoot.querySelector<HTMLElement>(`[data-video-slide-id="${CSS.escape(id)}"]`);
      if (!element) continue;

      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            const slideId = entry.target.getAttribute("data-video-slide-id");
            if (!slideId) continue;
            visibility.set(slideId, entry.intersectionRatio);
          }
          const nextId = selectAutoplayVideoId(visibility);
          if (!nextId) return;

          const locked = preferredLockRef.current;
          if (locked && itemIds.includes(locked)) {
            const lockedRatio = visibility.get(locked) ?? 0;
            if (lockedRatio >= 0.55) {
              preferredLockRef.current = null;
              setActiveId(locked);
              return;
            }
            setActiveId(locked);
            return;
          }

          setActiveId(nextId);
        },
        { root: scrollRoot, threshold: [0, 0.25, 0.5, 0.75, 1] },
      );
      observer.observe(element);
      observers.push(observer);
    }

    return () => {
      for (const observer of observers) observer.disconnect();
    };
  }, [itemIds, scrollRoot]);

  return activeId;
}
