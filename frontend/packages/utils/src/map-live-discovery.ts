import type {
  CulturalPlaceListItem,
  LocalEvent,
  Neighborhood,
  PartnerOfferPublic,
} from "@yunicity/types";

import { buildMapEventUrl, buildMapPlaceUrl } from "./explorer-links";
import {
  resolveMapNeighborhoodImageUrl,
  resolveMapPlaceImageUrl,
} from "./map-media-url";

export type MapLiveDiscoveryKind = "event" | "culture" | "passport" | "neighborhood";

export type MapLiveDiscoveryItem = {
  id: string;
  kind: MapLiveDiscoveryKind;
  title: string;
  subtitle: string;
  badge: string;
  ctaLabel: string;
  href: string;
  secondaryHref?: string;
  secondaryCtaLabel?: string;
  imageUrl: string | null;
  expiresLabel?: string | null;
  isLiveNow?: boolean;
};

type MapLiveDiscoveryInput = {
  city: string;
  events: LocalEvent[];
  culturalPlaces: CulturalPlaceListItem[];
  passportOffers: PartnerOfferPublic[];
  neighborhoods: Neighborhood[];
  maxItems?: number;
  now?: Date;
};

export function buildMapLiveDiscoveryItems({
  city,
  events,
  culturalPlaces,
  passportOffers,
  neighborhoods,
  maxItems = 5,
  now = new Date(),
}: MapLiveDiscoveryInput): MapLiveDiscoveryItem[] {
  const items: MapLiveDiscoveryItem[] = [];
  const usedIds = new Set<string>();
  const usedPlaceSlugs = new Set<string>();

  const upcomingEvent = [...events]
    .filter((event) => !event.is_cancelled)
    .filter((event) => {
      const startsAt = Date.parse(event.starts_at);
      return Number.isFinite(startsAt) && startsAt >= now.getTime();
    })
    .sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at))[0];

  if (upcomingEvent) {
    items.push({
      id: `event:${upcomingEvent.id}`,
      kind: "event",
      title: upcomingEvent.title,
      subtitle: formatEventLine(upcomingEvent.starts_at, city),
      badge: "Culture",
      ctaLabel: "Voir sur la carte",
      href: buildMapEventUrl(upcomingEvent.id),
      secondaryHref: `/events/${encodeURIComponent(upcomingEvent.id)}`,
      secondaryCtaLabel: "Voir l'événement",
      imageUrl: upcomingEvent.cover_image_url,
    });
    usedIds.add(`event:${upcomingEvent.id}`);
  }

  const activeOffer = [...passportOffers]
    .filter((offer) => {
      if (!offer.valid_until) return true;
      const validUntil = Date.parse(offer.valid_until);
      return Number.isFinite(validUntil) && validUntil >= now.getTime();
    })
    .sort((a, b) => {
      if (!a.valid_until) return -1;
      if (!b.valid_until) return 1;
      return Date.parse(a.valid_until) - Date.parse(b.valid_until);
    })[0];

  if (activeOffer) {
    items.push({
      id: `offer:${activeOffer.id}`,
      kind: "passport",
      title: activeOffer.title,
      subtitle: activeOffer.partner.name,
      badge: "Passport",
      ctaLabel: "Voir l'offre",
      href: `/passport/offre/${encodeURIComponent(activeOffer.id)}`,
      imageUrl: activeOffer.partner.logo_url,
      expiresLabel: formatOfferExpiry(activeOffer.valid_until, now),
    });
    usedIds.add(`offer:${activeOffer.id}`);
  }

  const featuredNeighborhood =
    neighborhoods.find((hood) => hood.is_featured) ??
    neighborhoods.find((hood) => Boolean(hood.short_description)) ??
    neighborhoods[0];

  if (featuredNeighborhood) {
    items.push({
      id: `neighborhood:${featuredNeighborhood.slug}`,
      kind: "neighborhood",
      title: featuredNeighborhood.display_name,
      subtitle: "Animé maintenant",
      badge: "Quartier",
      ctaLabel: "Explorer",
      href: `/neighborhoods/${encodeURIComponent(featuredNeighborhood.slug)}?city=${encodeURIComponent(city)}`,
      imageUrl: resolveMapNeighborhoodImageUrl(featuredNeighborhood),
      isLiveNow: true,
    });
    usedIds.add(`neighborhood:${featuredNeighborhood.slug}`);
  }

  const firstPlace = culturalPlaces.find((place) => Boolean(resolvePlaceImage(place)));
  if (firstPlace) {
    items.push({
      id: `culture:${firstPlace.slug}`,
      kind: "culture",
      title: firstPlace.name,
      subtitle: "À découvrir aujourd'hui",
      badge: "Culture",
      ctaLabel: "Voir sur la carte",
      href: buildMapPlaceUrl(firstPlace.slug),
      imageUrl: resolvePlaceImage(firstPlace),
    });
    usedIds.add(`culture:${firstPlace.slug}`);
    usedPlaceSlugs.add(firstPlace.slug);
  }

  const calmPlace = culturalPlaces.find(
    (place) =>
      !usedPlaceSlugs.has(place.slug) &&
      Boolean(resolvePlaceImage(place)),
  );
  if (calmPlace) {
    items.push({
      id: `culture:${calmPlace.slug}`,
      kind: "culture",
      title: calmPlace.name,
      subtitle: "Lieu calme à explorer",
      badge: "Lieu",
      ctaLabel: "Voir le lieu",
      href: buildMapPlaceUrl(calmPlace.slug),
      imageUrl: resolvePlaceImage(calmPlace),
    });
    usedIds.add(`culture:${calmPlace.slug}`);
  }

  return items.filter((item) => usedIds.has(item.id)).slice(0, maxItems);
}

function resolvePlaceImage(place: CulturalPlaceListItem): string | null {
  return resolveMapPlaceImageUrl(place);
}

function formatOfferExpiry(validUntil: string | null | undefined, now: Date): string | null {
  if (!validUntil) return null;
  const expiresAt = Date.parse(validUntil);
  if (!Number.isFinite(expiresAt)) return null;
  const diffMs = expiresAt - now.getTime();
  if (diffMs <= 0) return "Expire bientôt";
  const hours = Math.ceil(diffMs / (60 * 60 * 1000));
  if (hours <= 1) return "Expire dans 1 h";
  if (hours < 24) return `Expire dans ${hours} h`;
  const days = Math.ceil(hours / 24);
  return `Expire dans ${days} j`;
}

function formatEventLine(startsAtIso: string, city: string): string {
  const date = new Date(startsAtIso);
  if (Number.isNaN(date.getTime())) {
    return `À venir à ${city}`;
  }
  const now = new Date();
  const isSameDay = date.toDateString() === now.toDateString();
  if (isSameDay) {
    return `Ce soir · ${new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(date)}`;
  }
  return `${new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date)} · ${new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)}`;
}
