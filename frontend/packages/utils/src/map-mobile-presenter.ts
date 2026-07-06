import type { PartnershipType } from "@yunicity/types";
import type { MapPortalCategoryId } from "./map-portal";

/** Catégories pills mobile carte (MOBILE-MAP-01). */
export type MapMobileCategoryId = "all" | "dining" | "outings" | "culture" | "retail";

export function mapMobileCategoryToPortal(category: MapMobileCategoryId): MapPortalCategoryId {
  switch (category) {
    case "dining":
    case "retail":
      return "partners";
    case "outings":
      return "events";
    case "culture":
      return "culture";
    default:
      return "all";
  }
}

export function resolveMapMobilePartnerTypes(
  category: MapMobileCategoryId,
): readonly PartnershipType[] | null {
  if (category === "dining") return ["restaurant", "nightlife"] as const;
  if (category === "retail") return ["local_business"] as const;
  return null;
}

/** Estimation marche à pied (~5 km/h). */
export function estimateMapWalkMinutes(distanceMeters: number): number {
  return Math.max(1, Math.round(distanceMeters / 80));
}

export function formatMapDistanceShort(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}
