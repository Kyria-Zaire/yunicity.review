import type { CulturalPlaceListItem, Neighborhood } from "@yunicity/types";

import { resolveNeighborhoodEditorialImage } from "./editorial-fallback-images";

const PENDING_YUNICITY_HOSTED_COVER =
  /^\/(?:places|neighborhoods)\/reims\/[^/]+\/(?:cover|hero)\.jpg$/i;

/**
 * The legitimate self-hosted media CDN (`media.yunicity.city`, `media.<env>.yunicity.city`)
 * serves REAL covers (SEED-PROD-01B). It shares the `/places/reims/.../cover.jpg` path with
 * the old web-app static host, so the pending filter MUST distinguish by host — never drop it.
 */
const MEDIA_CDN_HOST = /^media\.(?:[a-z0-9-]+\.)?yunicity\.city$/i;

/**
 * Legacy seed prod URLs pointing at static files never deployed on the web app (CONTENT-ASSETS):
 * `https://yunicity.city/places/reims/.../cover.jpg` (and the dev-relative equivalent). Skipping
 * these avoids noisy 404s. The `media.*.yunicity.city` CDN is explicitly excluded — it is valid.
 */
export function isPendingYunicityHostedCoverUrl(url: string | null | undefined): boolean {
  const trimmed = url?.trim();
  if (!trimmed) return false;
  let parsed: URL;
  try {
    parsed = new URL(trimmed, "https://yunicity.city");
  } catch {
    // Unparseable → best-effort path-only match (no host to inspect).
    return PENDING_YUNICITY_HOSTED_COVER.test(trimmed);
  }
  if (!PENDING_YUNICITY_HOSTED_COVER.test(parsed.pathname)) return false;
  // media.*.yunicity.city = real self-hosted cover, not a broken pending URL.
  return !MEDIA_CDN_HOST.test(parsed.hostname);
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
