import type { CulturalPlaceListItem, LocalEvent } from "@yunicity/types";

import { resolveCulturalPlaceHeroUrl } from "./cultural-place-media";
import {
  EDITORIAL_IMAGE_ATELIER_PHOTO_URBAIN,
  EDITORIAL_IMAGE_CAFE_RENCONTRE_ENTREPRENEURS,
  resolveEventEditorialImage,
} from "./editorial-fallback-images";

/** Fallbacks éditoriaux par type d’événement (alignés Search hero). */
export const EVENT_TYPE_FALLBACK_IMAGES: Record<string, string> = {
  market:
    "https://remeng.rosselcdn.net/sites/default/files/dpistyles_v2/ena_16_9_extra_big/2021/10/19/node_304486/12436748/public/2021/10/19/B9728712921Z.1_20211019170949_000%2BG8MJ5QK54.1-0.jpg?itok=nKPxV80n1634656196",
  meetup: EDITORIAL_IMAGE_CAFE_RENCONTRE_ENTREPRENEURS,
  workshop: EDITORIAL_IMAGE_ATELIER_PHOTO_URBAIN,
};

const CULTURAL_PLACE_IMAGE_OVERRIDES: Record<string, string> = {
  "porte-de-mars":
    "https://th.bing.com/th/id/OIP.gQdEGwtjmHxBpBuiRqxHTAHaEI?w=310&h=180&c=7&r=0&o=7&pid=1.7&rm=3",
  "basilique-saint-remi":
    "https://www.actualitix.com/wp-content/uploads/2016/11/basilique-saint-remi-a-reims.jpg",
  "palais-du-tau":
    "https://img-4.linternaute.com/uQ_yW33guQHqdZTQdtIaFMhcK2Y=/1240x/smart/f4cad198146d41eb91fb8a9859ce5adc/ccmcms-linternaute/18659868.jpg",
  "cathedrale-notre-dame":
    "https://cdn.elebase.io/173fe953-8a63-4a8a-8ca3-1bacb56d78a5/a016fa00-8eec-4399-bcb8-10f91b9acfd5-shutterstock_200545976.jpg?q=90",
};

export function resolveCulturalPlaceImageOverride(
  place: Pick<CulturalPlaceListItem, "slug">,
): string | null {
  return CULTURAL_PLACE_IMAGE_OVERRIDES[place.slug] ?? null;
}

function squaredDistance(latA: number, lonA: number, latB: number, lonB: number): number {
  const dLat = latA - latB;
  const dLon = lonA - lonB;
  return dLat * dLat + dLon * dLon;
}

/** Image carrousel / vignette : cover, éditorial, ou fallback par type — pas de lieu culturel tiers. */
export function resolveFeaturedCarouselEventImage(event: LocalEvent): string | null {
  if (event.cover_image_url?.trim()) {
    return event.cover_image_url;
  }
  const editorial = resolveEventEditorialImage(event);
  if (editorial) {
    return editorial;
  }
  const type = event.event_type?.trim().toLowerCase();
  if (type && EVENT_TYPE_FALLBACK_IMAGES[type]) {
    return EVENT_TYPE_FALLBACK_IMAGES[type]!;
  }
  return null;
}

/** Résolution d’image événement — même logique que le hero Search « À découvrir aujourd’hui ». */
export function resolveEventHeroImage(
  event: LocalEvent,
  culturalPlaces: CulturalPlaceListItem[],
): string | null {
  if (event.cover_image_url?.trim()) {
    return event.cover_image_url;
  }

  const editorial = resolveEventEditorialImage(event);
  if (editorial) {
    return editorial;
  }

  const fallbackByType = event.event_type ? EVENT_TYPE_FALLBACK_IMAGES[event.event_type] : null;
  if (fallbackByType) {
    return fallbackByType;
  }

  const eventTitle = event.title.trim().toLowerCase();
  const eventLocation = event.location_name.trim().toLowerCase();
  const orgId = event.organization_id;
  const orgSlug = event.organization?.slug?.trim().toLowerCase() ?? null;

  const matchedPlace =
    culturalPlaces.find((place) => orgId && place.id === orgId) ??
    culturalPlaces.find((place) => orgSlug && place.slug.trim().toLowerCase() === orgSlug) ??
    culturalPlaces.find((place) => {
      const placeName = place.name.trim().toLowerCase();
      return (
        placeName.length > 0 &&
        (eventLocation.includes(placeName) ||
          eventTitle.includes(placeName) ||
          placeName.includes(eventLocation))
      );
    });

  if (matchedPlace) {
    return resolveCulturalPlaceImageOverride(matchedPlace) ?? resolveCulturalPlaceHeroUrl(matchedPlace);
  }

  const placesWithImage = culturalPlaces.filter((place) =>
    Boolean(resolveCulturalPlaceImageOverride(place) ?? resolveCulturalPlaceHeroUrl(place)),
  );

  if (placesWithImage.length > 0 && event.latitude != null && event.longitude != null) {
    let nearestPlace: CulturalPlaceListItem | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;

    for (const place of placesWithImage) {
      const distance = squaredDistance(
        event.latitude,
        event.longitude,
        place.latitude,
        place.longitude,
      );
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestPlace = place;
      }
    }

    if (nearestPlace) {
      return resolveCulturalPlaceImageOverride(nearestPlace) ?? resolveCulturalPlaceHeroUrl(nearestPlace);
    }
  }

  if (placesWithImage.length > 0) {
    const first = placesWithImage[0]!;
    return resolveCulturalPlaceImageOverride(first) ?? resolveCulturalPlaceHeroUrl(first);
  }

  return event.organization?.logo_url ?? null;
}
