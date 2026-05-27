import type {
  CulturalPlaceListItem,
  LocalEvent,
  PartnerOffer,
  Tribe,
} from "@yunicity/types";

import { culturalPlaceCategoryLabel, culturalPlaceLocationLine } from "./cultural-place-labels";
import { eventTypeLabel } from "./event-labels";
import { resolveFeaturedCarouselEventImage } from "./event-hero-image";
import { resolveTribeEditorialImage } from "./editorial-fallback-images";
import { resolveCulturalPlaceHeroUrl } from "./cultural-place-media";
import { resolveCulturalPlaceImageOverride } from "./event-hero-image";
import { buildMapPlaceUrl } from "./explorer-links";
import { eventAgendaVibeLine, formatEventClockTime } from "./events-agenda";
import { tribeCategoryLabel, tribeHref } from "./tribe-labels";

export type FeaturedCarouselKind = "event" | "culture" | "passport" | "tribe";

export type FeaturedCarouselItem = {
  id: string;
  kind: FeaturedCarouselKind;
  title: string;
  subtitle: string;
  badge: string;
  ctaLabel: string;
  href: string;
  imageUrl: string | null;
};

export const FEATURED_CAROUSEL_MAX_ITEMS = 8;

export const FEATURED_CAROUSEL_CTA: Record<FeaturedCarouselKind, string> = {
  event: "Voir le moment",
  culture: "Voir le lieu",
  passport: "Voir l'offre",
  tribe: "Voir la tribu",
};

type BuildFeaturedCarouselInput = {
  city: string;
  events: LocalEvent[];
  culturalPlaces: CulturalPlaceListItem[];
  passportOffers: PartnerOffer[];
  tribes: Tribe[];
  maxItems?: number;
  now?: Date;
};

function resolvePlaceImage(place: CulturalPlaceListItem): string | null {
  return resolveCulturalPlaceImageOverride(place) ?? resolveCulturalPlaceHeroUrl(place);
}

function isOfferActive(offer: PartnerOffer, now: Date): boolean {
  if (offer.valid_until) {
    const until = Date.parse(offer.valid_until);
    if (Number.isFinite(until) && until < now.getTime()) return false;
  }
  if (offer.valid_from) {
    const from = Date.parse(offer.valid_from);
    if (Number.isFinite(from) && from > now.getTime()) return false;
  }
  return true;
}

export function featuredEventBadge(event: LocalEvent): string {
  return eventTypeLabel(event.event_type) ?? "Sortie locale";
}

export function featuredEventSubtitle(event: LocalEvent, city: string): string {
  const time = formatEventClockTime(event.starts_at);
  const place =
    event.neighborhood_summary?.display_name ?? event.district?.trim() ?? event.location_name;
  const vibe = eventAgendaVibeLine(event);
  if (time && place) {
    return `${time} · ${place} — ${vibe}`;
  }
  if (time) {
    return `${time} · ${city} — ${vibe}`;
  }
  return `${place} — ${vibe}`;
}

export function featuredCultureBadge(place: CulturalPlaceListItem): string {
  return culturalPlaceCategoryLabel(place.category);
}

export function featuredCultureSubtitle(place: CulturalPlaceListItem): string {
  const line = culturalPlaceLocationLine(place);
  const excerpt = place.editorial_excerpt?.trim() || place.short_description?.trim();
  if (excerpt && !line.includes(excerpt)) {
    return `${line} — ${excerpt}`;
  }
  return line;
}

export function featuredTribeBadge(tribe: Tribe): string {
  return tribeCategoryLabel(tribe.category);
}

/** Carrousel « À la une » — badge et visuels alignés sur le contenu réel. */
export function buildFeaturedCarouselItems({
  city,
  events,
  culturalPlaces,
  passportOffers,
  tribes,
  maxItems = FEATURED_CAROUSEL_MAX_ITEMS,
  now = new Date(),
}: BuildFeaturedCarouselInput): FeaturedCarouselItem[] {
  const items: FeaturedCarouselItem[] = [];
  const used = new Set<string>();
  const nowMs = now.getTime();

  const upcomingEvents = events
    .filter((e) => !e.is_cancelled)
    .filter((e) => {
      const t = Date.parse(e.starts_at);
      return Number.isFinite(t) && t >= nowMs;
    })
    .sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at));

  for (const event of upcomingEvents) {
    if (items.length >= maxItems) break;
    const imageUrl = resolveFeaturedCarouselEventImage(event);
    const id = `event:${event.id}`;
    if (used.has(id)) continue;
    used.add(id);
    items.push({
      id,
      kind: "event",
      title: event.title,
      subtitle: featuredEventSubtitle(event, city),
      badge: featuredEventBadge(event),
      ctaLabel: FEATURED_CAROUSEL_CTA.event,
      href: `/events/${encodeURIComponent(event.id)}`,
      imageUrl,
    });
    if (items.filter((i) => i.kind === "event").length >= 3) break;
  }

  for (const place of culturalPlaces) {
    if (items.length >= maxItems) break;
    const imageUrl = resolvePlaceImage(place);
    if (!imageUrl) continue;
    const id = `culture:${place.slug}`;
    if (used.has(id)) continue;
    used.add(id);
    items.push({
      id,
      kind: "culture",
      title: place.name,
      subtitle: featuredCultureSubtitle(place),
      badge: featuredCultureBadge(place),
      ctaLabel: FEATURED_CAROUSEL_CTA.culture,
      href: buildMapPlaceUrl(place.slug),
      imageUrl,
    });
    if (items.filter((i) => i.kind === "culture").length >= 2) break;
  }

  const activeOffer = passportOffers.filter((o) => isOfferActive(o, now))[0];
  if (activeOffer && items.length < maxItems) {
    const id = `passport:${activeOffer.id}`;
    if (!used.has(id)) {
      used.add(id);
      items.push({
        id,
        kind: "passport",
        title: activeOffer.title,
        subtitle: activeOffer.organization.name,
        badge: "Privilège local",
        ctaLabel: FEATURED_CAROUSEL_CTA.passport,
        href: "/passport",
        imageUrl: activeOffer.organization.logo_url,
      });
    }
  }

  for (const tribe of tribes) {
    if (items.length >= maxItems) break;
    if (tribe.is_archived || tribe.visibility !== "public") continue;
    const id = `tribe:${tribe.slug}`;
    if (used.has(id)) continue;
    used.add(id);
    items.push({
      id,
      kind: "tribe",
      title: tribe.name,
      subtitle: tribe.description?.trim() || `Communauté à ${city}`,
      badge: featuredTribeBadge(tribe),
      ctaLabel: FEATURED_CAROUSEL_CTA.tribe,
      href: tribeHref(tribe.slug, city),
      imageUrl: tribe.cover_image_url ?? resolveTribeEditorialImage(tribe),
    });
    if (items.filter((i) => i.kind === "tribe").length >= 2) break;
  }

  return items.slice(0, maxItems);
}

/** Vérifie qu'aucun libellé de métrique engagement n'est injecté. */
export function featuredCarouselHasNoEngagementMetrics(items: FeaturedCarouselItem[]): boolean {
  const banned = /trending|populaire|viral|hot|#\d+\s*(personnes|participants)|en direct/i;
  return items.every(
    (item) =>
      !banned.test(item.title) &&
      !banned.test(item.subtitle) &&
      !banned.test(item.badge),
  );
}
