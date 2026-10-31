"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Mécanique commune d'un menu de débordement : ouverture, fermeture au clic
 * extérieur, fermeture clavier (Échap) avec retour du focus au déclencheur.
 *
 * Extrait pour le menu « Options » des publications du profil
 * (PROFILE-POST-MENU-01). `FeedPostOptionsMenu` porte la même mécanique en
 * propre : son extraction vers ce hook est un refactor à part entière, parce
 * que son déclencheur est sous contrat E2E (`data-feed-publication-overflow`)
 * et qu'un refactor ne se mélange pas à une correction (règle 11).
 * TODO(debt): aligner `FeedPostOptionsMenu` sur ce hook dans une PR dédiée.
 */
export function useOverflowMenu<T extends HTMLElement = HTMLElement>() {
  const containerRef = useRef<T | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);

  const close = useCallback((restoreFocus = false) => {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  }, []);

  const toggle = useCallback(() => setOpen((value) => !value), []);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      // Le menu ne laisse pas l'Échap traverser vers une surface parente
      // (visionneuse, panneau) qui se fermerait au passage.
      event.stopPropagation();
      setOpen(false);
      triggerRef.current?.focus();
    }
    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [open]);

  return { open, toggle, close, containerRef, triggerRef };
}
