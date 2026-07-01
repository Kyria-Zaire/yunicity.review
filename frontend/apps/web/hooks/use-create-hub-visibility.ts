"use client";

import { isCreateHubVisiblePath } from "@/lib/create-hub/create-hub-routes";
import { usePathname } from "next/navigation";

/**
 * Indique si le chrome Create Hub (FAB, triggers) doit être affiché sur la route courante.
 * Centralise toute la logique pathname — ne pas la disperser dans les composants.
 */
export function useCreateHubVisibility(): boolean {
  const pathname = usePathname();
  return isCreateHubVisiblePath(pathname);
}
