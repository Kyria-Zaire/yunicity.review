/** Cultural place image resolution (WEB-SEARCH-02B.1). */

import type { CulturalPlaceListItem } from "@yunicity/types";

import { isPendingYunicityHostedCoverUrl } from "./map-media-url";

// Fields optional so lighter shapes (e.g. NeighborhoodDetailPlaceItem, which only
// carries image_url) can flow through the resolvers. Every accessor below already
// tolerates undefined via usableCulturalPlaceImageUrl / optional chaining.
export type CulturalPlaceImageSource = Partial<
  Pick<
    CulturalPlaceListItem,
    | "image_url"
    | "hero_image_url"
    | "thumbnail_image_url"
    | "photo_credit"
    | "image_credit"
    | "source_name"
  >
>;

function usableCulturalPlaceImageUrl(url: string | null | undefined): string | null {
  const trimmed = url?.trim();
  if (!trimmed || isPendingYunicityHostedCoverUrl(trimmed)) {
    return null;
  }
  return trimmed;
}

/** Preferred display URL: thumbnail → hero → legacy image_url. */
export function resolveCulturalPlaceImageUrl(
  place: CulturalPlaceImageSource,
): string | null {
  return (
    usableCulturalPlaceImageUrl(place.thumbnail_image_url) ||
    usableCulturalPlaceImageUrl(place.hero_image_url) ||
    usableCulturalPlaceImageUrl(place.image_url) ||
    null
  );
}

export function resolveCulturalPlaceHeroUrl(
  place: CulturalPlaceImageSource,
): string | null {
  return (
    usableCulturalPlaceImageUrl(place.hero_image_url) ||
    usableCulturalPlaceImageUrl(place.image_url) ||
    null
  );
}

export function resolveCulturalPlaceThumbnailUrl(
  place: CulturalPlaceImageSource,
): string | null {
  return (
    usableCulturalPlaceImageUrl(place.thumbnail_image_url) ||
    usableCulturalPlaceImageUrl(place.hero_image_url) ||
    usableCulturalPlaceImageUrl(place.image_url) ||
    null
  );
}

export function hasCulturalPlaceImage(place: CulturalPlaceImageSource): boolean {
  return Boolean(resolveCulturalPlaceImageUrl(place));
}

export function getCulturalPlaceImageCredit(place: CulturalPlaceImageSource): string | null {
  const photoCredit = place.photo_credit?.trim();
  if (photoCredit) return photoCredit;
  const imageCredit = place.image_credit?.trim();
  if (imageCredit) return imageCredit;
  const sourceName = place.source_name?.trim();
  return sourceName || null;
}

export function culturalPlaceHasGallery(place: CulturalPlaceListItem): boolean {
  return (place.gallery_images?.length ?? 0) > 0;
}
