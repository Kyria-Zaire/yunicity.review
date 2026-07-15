import type { CulturalPlaceDetail } from "@yunicity/types";

import { culturalPlaceCategoryLabel } from "./cultural-place-labels";
import { usableCulturalGalleryImages } from "./cultural-place-media";
import { buildMapPlaceUrl } from "./explorer-links";
import { formatPlaceOpenedLabel, formatPlaceTrustLine } from "./places-portal";
import {
  PLACE_DETAIL_MOBILE_BADGE_FEATURED,
  PLACE_DETAIL_MOBILE_QUICK_ADDRESS,
  PLACE_DETAIL_MOBILE_QUICK_NEIGHBORHOOD,
  PLACE_DETAIL_MOBILE_QUICK_ROUTE,
  PLACE_DETAIL_MOBILE_QUICK_WEBSITE,
} from "./place-detail-mobile-labels";
import { buildPublicPlaceHref } from "./place-routing";
import { neighborhoodHref } from "./neighborhood-labels";

/** Onglets détail lieu mobile (MOBILE-LIEUX-02). */
export type PlaceMobileDetailTabId = "about" | "reviews" | "offers" | "photos" | "publications";

export type PlaceMobileDetailQuickInfoItem = {
  key: "address" | "website" | "neighborhood" | "route";
  label: string;
  value: string;
  href?: string;
};

export function buildPlaceMobileDetailHeroStatusLine(place: CulturalPlaceDetail): string | null {
  const opened = formatPlaceOpenedLabel(place.created_at);
  if (opened) return opened;
  if (place.is_featured) return PLACE_DETAIL_MOBILE_BADGE_FEATURED;
  return null;
}

export function buildPlaceMobileDetailHeroStatsLine(place: CulturalPlaceDetail): string | null {
  const parts: string[] = [];
  const trust = formatPlaceTrustLine(place);
  if (trust) parts.push(trust);
  if (place.neighborhood?.display_name) {
    parts.push(place.neighborhood.display_name);
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}

export function buildPlaceMobileDetailAboutText(place: CulturalPlaceDetail): string | null {
  const description = place.description?.trim();
  if (description) return description;
  const excerpt = place.editorial_excerpt?.trim();
  if (excerpt) return excerpt;
  const short = place.short_description?.trim();
  if (short) return short;
  return null;
}

export function buildPlaceMobileDetailQuickInfo(
  place: CulturalPlaceDetail,
): PlaceMobileDetailQuickInfoItem[] {
  const items: PlaceMobileDetailQuickInfoItem[] = [];

  if (place.address?.trim()) {
    items.push({
      key: "address",
      label: PLACE_DETAIL_MOBILE_QUICK_ADDRESS,
      value: place.address.trim(),
    });
  }

  if (place.neighborhood) {
    items.push({
      key: "neighborhood",
      label: PLACE_DETAIL_MOBILE_QUICK_NEIGHBORHOOD,
      value: place.neighborhood.display_name,
      href: neighborhoodHref(place.neighborhood.slug, place.city),
    });
  }

  if (place.source_url?.trim()) {
    const url = place.source_url.trim();
    let display = place.source_name?.trim() || url;
    try {
      display = new URL(url).hostname.replace(/^www\./, "");
    } catch {
      /* garder display tel quel */
    }
    items.push({
      key: "website",
      label: PLACE_DETAIL_MOBILE_QUICK_WEBSITE,
      value: display,
      href: url,
    });
  }

  items.push({
    key: "route",
    label: PLACE_DETAIL_MOBILE_QUICK_ROUTE,
    value: "Carte",
    href: buildMapPlaceUrl(place.slug, { city: place.city, route: true }),
  });

  return items;
}

export function buildPlaceMobileDetailMapHref(place: CulturalPlaceDetail): string {
  return buildMapPlaceUrl(place.slug, { city: place.city });
}

export function buildPlaceMobileDetailShareUrl(place: CulturalPlaceDetail): string {
  return buildPublicPlaceHref(place.slug, place.city);
}

export function buildPlaceMobileDetailCategoryLabel(place: CulturalPlaceDetail): string {
  return culturalPlaceCategoryLabel(place.category);
}

export function countPlaceMobileDetailPhotos(place: CulturalPlaceDetail): number {
  return usableCulturalGalleryImages(place.gallery_images).length;
}
