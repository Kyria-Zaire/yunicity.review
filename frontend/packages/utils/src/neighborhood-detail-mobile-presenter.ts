import type {
  NeighborhoodDetail,
  NeighborhoodDetailContributionItem,
  NeighborhoodDetailStats,
} from "@yunicity/types";

import { culturalPlaceCategoryLabel } from "./cultural-place-labels";
import { formatEventDateRange } from "./event-labels";
import { buildPublicPlaceHref } from "./place-routing";
import {
  resolveNeighborhoodV2HeroImage,
  resolveNeighborhoodV2HeroQuote,
} from "./neighborhood-v2-presenter";

/** Onglets détail quartier mobile (MOBILE-QUARTIERS-02). */
export type NeighborhoodMobileDetailTabId =
  | "featured"
  | "events"
  | "places"
  | "publications"
  | "info";

export type NeighborhoodMobileDetailStatItem = {
  key: "tribes" | "contributions" | "events" | "places";
  label: string;
  value: number;
};

export type NeighborhoodMobileFeaturedCard = {
  id: string;
  kind: "event" | "place" | "offer";
  title: string;
  subtitle: string;
  footer: string | null;
  badge: string | null;
  imageUrl: string | null;
  href: string;
  tone: "music" | "food" | "shop" | "nature" | "culture";
};

export type NeighborhoodMobileActivityItem = {
  id: string;
  authorLabel: string;
  body: string;
  dateLabel: string | null;
};

function resolvePlaceTone(category: string): NeighborhoodMobileFeaturedCard["tone"] {
  const value = category.toLowerCase();
  if (value.includes("mus") || value.includes("concert")) return "music";
  if (value.includes("rest") || value.includes("gastro") || value.includes("café") || value.includes("cafe")) {
    return "food";
  }
  if (value.includes("parc") || value.includes("jardin")) return "nature";
  if (value.includes("shop") || value.includes("commerce") || value.includes("marché")) return "shop";
  return "culture";
}

export function buildNeighborhoodMobileHeroDescription(detail: NeighborhoodDetail): string | null {
  const quote = resolveNeighborhoodV2HeroQuote(detail);
  if (quote) return quote;
  const short = detail.short_description?.trim();
  if (short) return short;
  const story = detail.history?.long_story?.trim() || detail.long_story?.trim();
  if (story) return story.length > 180 ? `${story.slice(0, 177).trimEnd()}…` : story;
  return null;
}

export function buildNeighborhoodMobileHeroStatsLine(
  stats: NeighborhoodDetailStats | null | undefined,
): string | null {
  if (!stats) return null;
  const parts: string[] = [];
  if (stats.tribes_count > 0) {
    parts.push(`${stats.tribes_count} tribu${stats.tribes_count > 1 ? "s" : ""}`);
  }
  if (stats.contributions_count > 0) {
    parts.push(`${stats.contributions_count} souvenir${stats.contributions_count > 1 ? "s" : ""}`);
  }
  if (stats.events_count > 0) {
    parts.push(`${stats.events_count} événement${stats.events_count > 1 ? "s" : ""}`);
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}

export function buildNeighborhoodMobileStatsGrid(
  stats: NeighborhoodDetailStats | null | undefined,
): NeighborhoodMobileDetailStatItem[] {
  const values = stats ?? {
    places_count: 0,
    events_count: 0,
    videos_count: 0,
    tribes_count: 0,
    creators_count: 0,
    contributions_count: 0,
  };

  return [
    { key: "tribes", label: "Tribus", value: values.tribes_count },
    { key: "contributions", label: "Souvenirs", value: values.contributions_count },
    { key: "events", label: "Événements", value: values.events_count },
    { key: "places", label: "Lieux", value: values.places_count },
  ];
}

export function buildNeighborhoodMobileFeaturedCards(
  detail: NeighborhoodDetail,
  maxItems = 6,
): NeighborhoodMobileFeaturedCard[] {
  const cards: NeighborhoodMobileFeaturedCard[] = [];
  const passportHref = `/passport?city=${encodeURIComponent(detail.city)}`;

  for (const event of detail.events) {
    cards.push({
      id: `event-${event.id}`,
      kind: "event",
      title: event.title,
      subtitle: event.location_name,
      footer: formatEventDateRange(event.starts_at, null),
      badge: null,
      imageUrl: event.cover_image_url,
      href: `/events/${encodeURIComponent(event.id)}`,
      tone: "music",
    });
  }

  for (const place of detail.places) {
    cards.push({
      id: `place-${place.id}`,
      kind: "place",
      title: place.name,
      subtitle: culturalPlaceCategoryLabel(place.category),
      footer: null,
      badge: place.is_partner ? "Partenaire" : null,
      imageUrl: place.image_url,
      href: buildPublicPlaceHref(place.slug, detail.city),
      tone: resolvePlaceTone(place.category),
    });
  }

  for (const offer of detail.passport_offers) {
    cards.push({
      id: `offer-${offer.id}`,
      kind: "offer",
      title: offer.title,
      subtitle: offer.organization_name,
      footer: null,
      badge: null,
      imageUrl: null,
      href: passportHref,
      tone: "shop",
    });
  }

  return cards.slice(0, maxItems);
}

export function buildNeighborhoodMobileActivityItems(
  contributions: NeighborhoodDetailContributionItem[],
  maxItems = 5,
): NeighborhoodMobileActivityItem[] {
  return contributions.slice(0, maxItems).map((contribution) => {
    const dateSource = contribution.approved_at ?? contribution.created_at;
    const dateLabel = dateSource
      ? new Date(dateSource).toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "short",
        })
      : null;

    return {
      id: contribution.id,
      authorLabel: contribution.author_label,
      body: contribution.body.trim(),
      dateLabel,
    };
  });
}

export function resolveNeighborhoodMobileHeroImage(detail: NeighborhoodDetail): string | null {
  return resolveNeighborhoodV2HeroImage(detail);
}
