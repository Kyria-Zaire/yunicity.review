"use client";

import { useEffect, useRef } from "react";

/**
 * Règle des panneaux (v2.3, décision de Kyria) : à l'ouverture d'un panneau (Description,
 * Commentaires, « … », signalement), la vidéo se met en pause ; à la fermeture, elle ne
 * reprend QUE si elle jouait au moment de l'ouverture.
 *
 * `isPlaying` est lu au moment de l'ouverture (référence à jour), pas à la fermeture.
 */
export function usePauseWhileOpen(open: boolean, isPlaying: boolean, setPaused: (paused: boolean) => void): void {
  const isPlayingRef = useRef(isPlaying);
  const resumeOnCloseRef = useRef(false);
  // Initialement « fermé » : un panneau déjà ouvert au montage compte comme une ouverture.
  const wasOpenRef = useRef(false);
  isPlayingRef.current = isPlaying;

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      resumeOnCloseRef.current = isPlayingRef.current;
      if (isPlayingRef.current) setPaused(true);
    } else if (!open && wasOpenRef.current) {
      if (resumeOnCloseRef.current) setPaused(false);
      resumeOnCloseRef.current = false;
    }
    wasOpenRef.current = open;
  }, [open, setPaused]);
}
