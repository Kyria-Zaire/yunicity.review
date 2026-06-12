import type { CulturalPlaceDetail, LocalEvent, Neighborhood } from "@yunicity/types";

import { getAbsoluteUrl, resolveMediaUrl } from "./site";

export function buildPlaceLocalBusinessJsonLd(
  place: CulturalPlaceDetail,
  path: string,
): Record<string, unknown> {
  const image =
    resolveMediaUrl(place.hero_image_url) ||
    resolveMediaUrl(place.image_url) ||
    resolveMediaUrl(place.thumbnail_image_url);

  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: place.name,
    description: place.short_description || place.description || undefined,
    image,
    address: {
      "@type": "PostalAddress",
      streetAddress: place.address,
      addressLocality: place.city,
      addressCountry: "FR",
    },
    geo:
      place.latitude != null && place.longitude != null
        ? {
            "@type": "GeoCoordinates",
            latitude: place.latitude,
            longitude: place.longitude,
          }
        : undefined,
    url: getAbsoluteUrl(path),
  };
}

export function buildPlaceBreadcrumbJsonLd(
  place: CulturalPlaceDetail,
  path: string,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Lieux",
        item: getAbsoluteUrl("/places"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: place.name,
        item: getAbsoluteUrl(path),
      },
    ],
  };
}

export function buildEventJsonLd(event: LocalEvent, path: string): Record<string, unknown> {
  const image = resolveMediaUrl(event.cover_image_url);

  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.description || undefined,
    startDate: event.starts_at,
    endDate: event.ends_at || undefined,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: event.is_cancelled
      ? "https://schema.org/EventCancelled"
      : "https://schema.org/EventScheduled",
    image,
    location: {
      "@type": "Place",
      name: event.location_name,
      address: event.address
        ? {
            "@type": "PostalAddress",
            streetAddress: event.address,
            addressLocality: event.city,
            addressCountry: "FR",
          }
        : {
            "@type": "PostalAddress",
            addressLocality: event.city,
            addressCountry: "FR",
          },
      geo:
        event.latitude != null && event.longitude != null
          ? {
              "@type": "GeoCoordinates",
              latitude: event.latitude,
              longitude: event.longitude,
            }
          : undefined,
    },
    url: getAbsoluteUrl(path),
    organizer: event.organization
      ? {
          "@type": "Organization",
          name: event.organization.name,
          url: getAbsoluteUrl(`/creators/${event.organization.id}`),
        }
      : undefined,
  };
}

export function buildNeighborhoodBreadcrumbJsonLd(
  neighborhood: Neighborhood,
  path: string,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Quartiers",
        item: getAbsoluteUrl("/neighborhoods"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: neighborhood.display_name,
        item: getAbsoluteUrl(path),
      },
    ],
  };
}
