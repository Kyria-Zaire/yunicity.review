"use client";

import { useContext } from "react";

import {
  NavigationOverlayCoordinatorContext,
  type NavigationOverlayCoordinatorValue,
} from "@/components/navigation/navigation-overlay-coordinator";

/** Consommateur context-only — aucun listener responsive supplémentaire. */
export function useNavigationSurfaces(): NavigationOverlayCoordinatorValue {
  const context = useContext(NavigationOverlayCoordinatorContext);
  if (!context) {
    throw new Error("useNavigationSurfaces doit être utilisé dans NavigationOverlayCoordinatorProvider");
  }
  return context;
}

export function useNavigationSurfacesOptional(): NavigationOverlayCoordinatorValue | null {
  return useContext(NavigationOverlayCoordinatorContext);
}
