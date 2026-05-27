/** Cultural place image resolution (WEB-SEARCH-02B.1). */

import type { CulturalPlaceListItem } from "@yunicity/types";

export type CulturalPlaceImageSource = Pick<
  CulturalPlaceListItem,
  "image_url" | "hero_image_url" | "thumbnail_image_url" | "photo_credit" | "image_credit" | "source_name"
>;

/** Preferred display URL: thumbnail → hero → legacy image_url. */
export function resolveCulturalPlaceImageUrl(
  place: CulturalPlaceImageSource,
): string | null {
  return (
    place.thumbnail_image_url?.trim() ||
    place.hero_image_url?.trim() ||
    place.image_url?.trim() ||
    null
  );
}

export function resolveCulturalPlaceHeroUrl(
  place: CulturalPlaceImageSource,
): string | null {
  return place.hero_image_url?.trim() || place.image_url?.trim() || null;
}

export function resolveCulturalPlaceThumbnailUrl(
  place: CulturalPlaceImageSource,
): string | null {
  return place.thumbnail_image_url?.trim() || place.hero_image_url?.trim() || place.image_url?.trim() || null;
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
