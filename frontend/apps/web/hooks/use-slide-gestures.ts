"use client";

import { isDoubleTap } from "@yunicity/utils";
import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";

import type { SlideChrome } from "@/hooks/use-slide-chrome";

const SINGLE_TAP_DELAY_MS = 260;

type UseSlideGesturesOptions = {
  likedByMe: boolean;
  isPlaying: boolean;
  chrome: Pick<SlideChrome, "chromeVisible" | "showChrome" | "revealChrome">;
  setIsPaused: Dispatch<SetStateAction<boolean>>;
  onToggleLike: () => void;
};

/**
 * Gestes d'une diapositive (extraits de `local-video-slide.tsx` à comportement constant,
 * VIDEO-REFONTE-L3L4) : appui = pause et retour de la barre ; second appui = reprise ;
 * double appui = J'aime (jamais de pause).
 */
export function useSlideGestures({ likedByMe, isPlaying, chrome, setIsPaused, onToggleLike }: UseSlideGesturesOptions) {
  const { chromeVisible, showChrome, revealChrome } = chrome;
  const lastTapAtRef = useRef<number | null>(null);
  const singleTapTimerRef = useRef<number | null>(null);
  const [showResumeHint, setShowResumeHint] = useState(false);
  const [likeBurst, setLikeBurst] = useState(false);
  const [likeAnimating, setLikeAnimating] = useState(false);

  useEffect(
    () => () => {
      if (singleTapTimerRef.current != null) window.clearTimeout(singleTapTimerRef.current);
    },
    [],
  );

  const triggerLikeFeedback = useCallback(() => {
    setLikeBurst(true);
    setLikeAnimating(true);
    window.setTimeout(() => setLikeBurst(false), 700);
    window.setTimeout(() => setLikeAnimating(false), 220);
  }, []);

  const handleLike = useCallback(() => {
    revealChrome(true);
    triggerLikeFeedback();
    onToggleLike();
  }, [onToggleLike, revealChrome, triggerLikeFeedback]);

  const togglePause = useCallback(() => {
    setIsPaused((wasPaused) => {
      const next = !wasPaused;
      if (next) showChrome();
      else revealChrome(true);
      return next;
    });
    setShowResumeHint(true);
    window.setTimeout(() => setShowResumeHint(false), 500);
  }, [revealChrome, setIsPaused, showChrome]);

  const handleVideoTap = useCallback(() => {
    const now = Date.now();
    if (isDoubleTap(lastTapAtRef.current, now)) {
      if (singleTapTimerRef.current != null) {
        window.clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = null;
      }
      lastTapAtRef.current = null;
      if (!likedByMe) {
        handleLike();
      } else {
        revealChrome(true);
        triggerLikeFeedback();
      }
      return;
    }

    lastTapAtRef.current = now;
    singleTapTimerRef.current = window.setTimeout(() => {
      if (!chromeVisible && isPlaying) {
        setIsPaused(true);
        showChrome();
      } else {
        togglePause();
      }
      singleTapTimerRef.current = null;
    }, SINGLE_TAP_DELAY_MS);
  }, [chromeVisible, handleLike, isPlaying, likedByMe, revealChrome, setIsPaused, showChrome, togglePause, triggerLikeFeedback]);

  return { showResumeHint, likeBurst, likeAnimating, handleLike, togglePause, handleVideoTap };
}
