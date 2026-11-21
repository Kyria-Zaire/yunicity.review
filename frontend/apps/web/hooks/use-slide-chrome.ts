"use client";

import { useCallback, useEffect, useRef, useState, type FocusEvent, type RefObject } from "react";

/** Délai avant repli des commandes pendant la lecture (style Reels / Shorts). */
export const SLIDE_CHROME_AUTO_HIDE_MS = 5_000;

/**
 * Focus clavier (et non focus posé par un clic) : seul cas où les commandes doivent
 * rester visibles tant qu'elles contiennent le focus.
 */
function isKeyboardFocus(target: EventTarget): boolean {
  if (!(target instanceof Element)) return false;
  try {
    return target.matches(":focus-visible");
  } catch {
    // Moteur sans `:focus-visible` : on garde les commandes visibles — un focus
    // invisible est le défaut à éviter, des commandes affichées ne le sont pas.
    return true;
  }
}

type UseSlideChromeOptions = {
  itemId: string;
  isActive: boolean;
  isPaused: boolean;
  pointerOverFeed: boolean;
  /** Zones dont le focus clavier suspend le repli (bande et colonne d'actions). */
  containers: readonly RefObject<HTMLElement | null>[];
  onChromeVisibleChange?: (visible: boolean) => void;
};

export type SlideChrome = {
  chromeVisible: boolean;
  showChrome: () => void;
  revealChrome: (autoHide: boolean) => void;
  clearHideChromeTimer: () => void;
  handleChromeFocus: (event: FocusEvent<HTMLElement>) => void;
  handleChromeBlur: (event: FocusEvent<HTMLElement>) => void;
};

/**
 * Visibilité des commandes d'une diapositive (VIDEO-MOBILE-CHROME-RETURN-01, v2.3) :
 * affichées à l'ouverture, en pause et au focus clavier ; repliées après 5 s de lecture.
 * Logique extraite de `local-video-slide.tsx` à comportement constant (VIDEO-REFONTE-L3L4).
 */
export function useSlideChrome({
  itemId,
  isActive,
  isPaused,
  pointerOverFeed,
  containers,
  onChromeVisibleChange,
}: UseSlideChromeOptions): SlideChrome {
  const hideChromeTimerRef = useRef<number | null>(null);
  /** Vrai tant qu'un focus clavier est dans les commandes : suspend le repli automatique. */
  const keyboardFocusInChromeRef = useRef(false);
  const [chromeVisible, setChromeVisible] = useState(true);

  const clearHideChromeTimer = useCallback(() => {
    if (hideChromeTimerRef.current != null) {
      window.clearTimeout(hideChromeTimerRef.current);
      hideChromeTimerRef.current = null;
    }
  }, []);

  const scheduleChromeHide = useCallback(() => {
    clearHideChromeTimer();
    if (!isActive || isPaused || keyboardFocusInChromeRef.current) return;
    hideChromeTimerRef.current = window.setTimeout(() => {
      hideChromeTimerRef.current = null;
      if (keyboardFocusInChromeRef.current) return;
      setChromeVisible(false);
    }, SLIDE_CHROME_AUTO_HIDE_MS);
  }, [clearHideChromeTimer, isActive, isPaused]);

  const isInsideChrome = useCallback(
    (node: Node): boolean => containers.some((ref) => ref.current?.contains(node) ?? false),
    [containers],
  );

  /** Focus clavier entrant : commandes réaffichées immédiatement, repli suspendu. */
  const handleChromeFocus = useCallback(
    (event: FocusEvent<HTMLElement>) => {
      if (!isKeyboardFocus(event.target)) return;
      keyboardFocusInChromeRef.current = true;
      clearHideChromeTimer();
      setChromeVisible(true);
    },
    [clearHideChromeTimer],
  );

  /** Focus sorti des commandes (pas un passage entre deux commandes) : repli réarmé. */
  const handleChromeBlur = useCallback(
    (event: FocusEvent<HTMLElement>) => {
      const next = event.relatedTarget;
      if (next instanceof Node && isInsideChrome(next)) return;
      if (!keyboardFocusInChromeRef.current) return;
      keyboardFocusInChromeRef.current = false;
      scheduleChromeHide();
    },
    [isInsideChrome, scheduleChromeHide],
  );

  const revealChrome = useCallback(
    (autoHide: boolean) => {
      setChromeVisible(true);
      clearHideChromeTimer();
      if (autoHide && isActive && !isPaused) {
        scheduleChromeHide();
      }
    },
    [clearHideChromeTimer, isActive, isPaused, scheduleChromeHide],
  );

  const showChrome = useCallback(() => {
    setChromeVisible(true);
    clearHideChromeTimer();
  }, [clearHideChromeTimer]);

  useEffect(() => {
    if (!isActive) return;
    onChromeVisibleChange?.(chromeVisible);
  }, [chromeVisible, isActive, onChromeVisibleChange]);

  useEffect(() => {
    setChromeVisible(true);
    keyboardFocusInChromeRef.current = false;
    clearHideChromeTimer();
  }, [itemId, clearHideChromeTimer]);

  useEffect(() => {
    if (!isActive) {
      // Diapositive rendue inerte : le focus en sort sans garantie d'événement blur.
      keyboardFocusInChromeRef.current = false;
      setChromeVisible(true);
      clearHideChromeTimer();
      return;
    }
    if (isPaused) {
      setChromeVisible(true);
      clearHideChromeTimer();
      return;
    }
    revealChrome(true);
  }, [isActive, isPaused, revealChrome, clearHideChromeTimer]);

  useEffect(() => {
    if (!isActive) return;
    if (pointerOverFeed) {
      revealChrome(true);
      return;
    }
    if (!isPaused) {
      scheduleChromeHide();
    }
  }, [isActive, isPaused, pointerOverFeed, revealChrome, scheduleChromeHide]);

  useEffect(() => clearHideChromeTimer, [clearHideChromeTimer]);

  return { chromeVisible, showChrome, revealChrome, clearHideChromeTimer, handleChromeFocus, handleChromeBlur };
}
