"use client";

import { createContext, useContext } from "react";

/**
 * Vidéo dont la feuille de signalement est ouverte (fournie par `videos-screen`).
 * Le fil immersif la garde en pause tant que la feuille est ouverte (règle des panneaux, v2.3)
 * sans faire descendre l'état à travers l'écran, le shell et la région.
 */
export const ActiveReportVideoContext = createContext<string | null>(null);

export function useActiveReportVideoId(): string | null {
  return useContext(ActiveReportVideoContext);
}
