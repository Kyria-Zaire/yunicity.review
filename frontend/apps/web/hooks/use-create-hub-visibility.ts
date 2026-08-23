"use client";

import {
  type CreateHubSurface,
  isCreateHubAvailableOnRoute,
  resolveCreateHubVisibility,
} from "@/lib/create-hub/create-hub-routes";
import { usePathname } from "next/navigation";

/**
 * Le chrome Create Hub doit-il etre affiche sur la route courante, pour cette
 * surface ? Centralise toute la logique pathname — ne pas la disperser dans
 * les composants.
 *
 * `surface` par defaut = `"default"` : comportement historique inchange.
 */
export function useCreateHubVisibility(surface: CreateHubSurface = "default"): boolean {
  const pathname = usePathname();
  return resolveCreateHubVisibility({ pathname, surface });
}

/**
 * Le hub est-il atteignable depuis au moins une surface ? Le provider ne monte
 * qu'un dialogue partage : sans cette distinction, le declencheur du rail
 * ouvrirait le vide sur `/videos`.
 */
export function useCreateHubAvailability(): boolean {
  const pathname = usePathname();
  return isCreateHubAvailableOnRoute(pathname);
}
