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
  /**
   * `immersive` (défaut) : mobile plein cadre.
   * `medium` : portrait v1.2 — colonne d'actions hors vidéo (≠ R-PAN Lot 6).
   */
  presentation?: "immersive" | "medium";
  mediumNav?: {
    onPrevious: () => void;
    onNext: () => void;
    canPrevious: boolean;
    canNext: boolean;
  } | null;
  onToggleMute?: () => void;
  /** Medium : badge partagé uniquement sur la slide focus (dans le cadre). */
  sharedBadgeVideoId?: string | null;
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
  presentation = "immersive",
  mediumNav = null,
  onToggleMute,
  sharedBadgeVideoId = null,
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

  /**
   * VIDEO-SAFARI-SCROLL-01 — ré-alignement snap :
   * 1) hauteur du scrollport change (barres Safari / republish immersif) ;
   * 2) fin de geste si arrêt entre deux cartes.
   * Pas de resnap pendant un swipe ; garde anti-réentrance (pas de boucle
   * ResizeObserver ↔ scrollend ↔ debounce).
   */
  useEffect(() => {
    const node = scrollRoot;
    if (!node) return;

    let previousHeight = node.clientHeight;
    let gestureActive = false;
    let snapping = false;
    let pendingIndexBasis: number | null = null;
    let scrollSettleTimer = 0;

    const snapToNearest = (heightForIndex?: number) => {
      if (snapping || gestureActive) return;
      const nextHeight = node.clientHeight;
      if (nextHeight <= 0) return;
      const basis =
        heightForIndex && heightForIndex > 0
          ? heightForIndex
          : pendingIndexBasis && pendingIndexBasis > 0
            ? pendingIndexBasis
            : nextHeight;
      pendingIndexBasis = null;
      const index = Math.round(node.scrollTop / basis);
      const maxIndex = Math.max(0, node.querySelectorAll("[data-video-slide-id]").length - 1);
      const clamped = Math.min(Math.max(0, index), maxIndex);
      const target = clamped * nextHeight;
      if (Math.abs(node.scrollTop - target) <= 1) return;
      snapping = true;
      node.scrollTo({ top: target, behavior: "auto" });
      window.requestAnimationFrame(() => {
        snapping = false;
      });
    };

    const beginGesture = () => {
      gestureActive = true;
      window.clearTimeout(scrollSettleTimer);
    };
    const endGesture = () => {
      gestureActive = false;
      // Appliquer un resnap différé (ex. resize pendant le geste) à la fin.
      window.clearTimeout(scrollSettleTimer);
      scrollSettleTimer = window.setTimeout(() => snapToNearest(), 140);
    };

    const Observer = globalThis.ResizeObserver;
    let observer: ResizeObserver | null = null;
    if (typeof Observer === "function") {
      observer = new Observer(() => {
        const nextHeight = node.clientHeight;
        if (nextHeight <= 0) return;
        if (previousHeight <= 0) {
          previousHeight = nextHeight;
          return;
        }
        if (nextHeight === previousHeight) return;
        const prior = previousHeight;
        previousHeight = nextHeight;
        if (gestureActive) {
          pendingIndexBasis = prior;
          return;
        }
        snapToNearest(prior);
      });
      observer.observe(node);
    }

    const onScrollEnd = () => {
      window.clearTimeout(scrollSettleTimer);
      snapToNearest();
    };
    // Repli si `scrollend` absent : un seul debounce, pas en parallèle de scrollend.
    const supportsScrollEnd = typeof window !== "undefined" && "onscrollend" in window;
    const onScrollSettle = () => {
      if (gestureActive || snapping) return;
      window.clearTimeout(scrollSettleTimer);
      scrollSettleTimer = window.setTimeout(() => snapToNearest(), 140);
    };

    node.addEventListener("pointerdown", beginGesture, { passive: true });
    node.addEventListener("pointerup", endGesture, { passive: true });
    node.addEventListener("pointercancel", endGesture, { passive: true });
    node.addEventListener("touchstart", beginGesture, { passive: true });
    node.addEventListener("touchend", endGesture, { passive: true });
    node.addEventListener("touchcancel", endGesture, { passive: true });
    if (supportsScrollEnd) {
      node.addEventListener("scrollend", onScrollEnd);
    } else {
      node.addEventListener("scroll", onScrollSettle, { passive: true });
    }

    return () => {
      observer?.disconnect();
      node.removeEventListener("pointerdown", beginGesture);
      node.removeEventListener("pointerup", endGesture);
      node.removeEventListener("pointercancel", endGesture);
      node.removeEventListener("touchstart", beginGesture);
      node.removeEventListener("touchend", endGesture);
      node.removeEventListener("touchcancel", endGesture);
      node.removeEventListener("scrollend", onScrollEnd);
      node.removeEventListener("scroll", onScrollSettle);
      window.clearTimeout(scrollSettleTimer);
    };
  }, [scrollRoot]);

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
          presentation={presentation}
          mediumNav={activeId === item.id ? mediumNav : null}
          onToggleMute={onToggleMute}
          showSharedBadge={sharedBadgeVideoId === item.id}
        />
      ))}
    </div>
  );
}
