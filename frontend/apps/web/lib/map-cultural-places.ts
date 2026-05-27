"use client";

import type { CulturalPlaceListItem, MapCulturalPlaceItem } from "@yunicity/types";

/** Fusionne les lieux issus de la liste éditoriale et du bbox carte. */
export function mergeMapRailCulturalPlaces(
  featuredPlaces: CulturalPlaceListItem[],
  mapPlaces: MapCulturalPlaceItem[],
  limit = 4,
): CulturalPlaceListItem[] {
  const seen = new Set<string>();
  const merged: CulturalPlaceListItem[] = [];

  for (const place of featuredPlaces) {
    if (merged.length >= limit) break;
    seen.add(place.slug);
    merged.push(place);
  }

  for (const place of mapPlaces) {
    if (merged.length >= limit) break;
    if (seen.has(place.slug)) continue;
    seen.add(place.slug);
    merged.push(mapCulturalPlaceItemToListItem(place));
  }

  return merged;
}

export function mapCulturalPlaceItemToListItem(place: MapCulturalPlaceItem): CulturalPlaceListItem {
  return {
    id: place.id,
    slug: place.slug,
    name: place.name,
    short_description: place.editorial_excerpt ?? "",
    city: place.city,
    address: place.address,
    category: place.category,
    latitude: place.latitude,
    longitude: place.longitude,
    image_url: place.image_url,
    hero_image_url: place.hero_image_url,
    thumbnail_image_url: place.thumbnail_image_url,
    gallery_images: place.gallery_images,
    editorial_excerpt: place.editorial_excerpt,
    photo_credit: place.photo_credit,
    image_source: place.image_source,
    image_alt: place.image_alt,
    source_name: place.source_name,
    image_credit: place.image_credit,
    neighborhood: place.neighborhood,
  };
}
