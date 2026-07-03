import type { CulturalPlaceListItem, Neighborhood } from "@yunicity/types";

import { resolveNeighborhoodEditorialImage } from "./editorial-fallback-images";

const PENDING_YUNICITY_HOSTED_COVER =
  /^\/(?:places|neighborhoods)\/reims\/[^/]+\/(?:cover|hero)\.jpg$/i;

/**
 * Seed prod URLs pointing at static files not yet deployed on the web app (CONTENT-ASSETS).
 * Skipping these avoids noisy 404s in the map UI until R2/static hosting is wired.
 */
export function isPendingYunicityHostedCoverUrl(url: string | null | undefined): boolean {
  if (!url?.trim()) return false;
  try {
    const pathname = new URL(url, "https://yunicity.city").pathname;
    return PENDING_YUNICITY_HOSTED_COVER.test(pathname);
  } catch {
    return PENDING_YUNICITY_HOSTED_COVER.test(url.trim());
  }
}

export function resolveMapPlaceImageUrl(
  place: Pick<
    CulturalPlaceListItem,
    "hero_image_url" | "image_url" | "thumbnail_image_url"
  >,
): string | null {
  const candidates = [
    place.hero_image_url,
    place.image_url,
    place.thumbnail_image_url,
  ];
  for (const candidate of candidates) {
    const trimmed = candidate?.trim();
    if (trimmed && !isPendingYunicityHostedCoverUrl(trimmed)) {
      return trimmed;
    }
  }
  return null;
}

export function resolveMapNeighborhoodImageUrl(
  neighborhood: Pick<Neighborhood, "slug" | "cover_image_url">,
): string | null {
  const cover = neighborhood.cover_image_url?.trim();
  if (cover && !isPendingYunicityHostedCoverUrl(cover)) {
    return cover;
  }
  return resolveNeighborhoodEditorialImage({
    slug: neighborhood.slug,
    cover_image_url: null,
  });
}
