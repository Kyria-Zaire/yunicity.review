import type {
  CulturalPlaceListItem,
  LocalEvent,
  Neighborhood,
  PartnerOffer,
  PassportMe,
  Tribe,
} from "@yunicity/types";

import { formatEventDateRange } from "./event-labels";
import { resolveEventHeroImage } from "./event-hero-image";
import { buildMapEventUrl } from "./explorer-links";
import { resolveTribeEditorialImage } from "./editorial-fallback-images";
import { neighborhoodHref } from "./neighborhood-labels";
import { tribeCategoryLabel, tribeHref } from "./tribe-labels";

export const TRIBE_PORTAL_THEMES = [
  "photo",
  "cafe",
  "lecture",
  "sport-doux",
  "balade",
  "culture",
  "benevolat",
] as const;

export type TribePortalTheme = (typeof TRIBE_PORTAL_THEMES)[number];

export type TribePortalCard = {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  neighborhoodLabel: string;
  themeTags: TribePortalTheme[];
  href: string;
  cta: "Rejoindre le cercle" | "Voir la tribu";
};

export type TribeMomentItem = {
  id: string;
  dateLabel: string;
  hourLabel: string;
  title: string;
  place: string;
  tribeName: string;
  href: string;
};

export type TribeEditorialStory = {
  title: string;
  body: string;
  anchorLabel: string;
  imageUrl: string | null;
};

const BANNED_METRIC_PATTERN =
  /online|trending|viral|score|heatmap|\d+\s*(membres|users?|personnes|participants)/i;

function normalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function inferThemesForTribe(tribe: Tribe): TribePortalTheme[] {
  const category = normalize(tribe.category);
  const text = normalize(`${tribe.name} ${tribe.description}`);
  const themes = new Set<TribePortalTheme>();

  if (category.includes("photo") || text.includes("photo")) themes.add("photo");
  if (category.includes("cafe") || text.includes("cafe")) themes.add("cafe");
  if (text.includes("lecture") || text.includes("livre")) themes.add("lecture");
  if (category.includes("sport") || text.includes("marche")) themes.add("sport-doux");
  if (text.includes("balade") || text.includes("quartier")) themes.add("balade");
  if (category.includes("music") || category.includes("culture") || text.includes("culture")) {
    themes.add("culture");
  }
  if (category.includes("volunteer") || category.includes("association") || text.includes("benevolat")) {
    themes.add("benevolat");
  }
  if (themes.size === 0) themes.add("culture");
  return [...themes].slice(0, 3);
}

export function buildFeaturedTribe(tribes: Tribe[]): Tribe | null {
  const active = tribes.filter((tribe) => !tribe.is_archived);
  if (active.length === 0) return null;
  return active.find((tribe) => tribe.is_featured) ?? active[0]!;
}

export function buildTribePortalCards(input: {
  city: string;
  tribes: Tribe[];
  neighborhoods: Neighborhood[];
}): TribePortalCard[] {
  const city = input.city.trim() || "Reims";
  const neighborhoodBySlug = new Map(input.neighborhoods.map((hood) => [normalize(hood.slug), hood]));

  return input.tribes
    .filter((tribe) => !tribe.is_archived)
    .map((tribe) => {
      const key = normalize(tribe.slug);
      const matchingHood = [...neighborhoodBySlug.values()].find(
        (hood) => key.includes(normalize(hood.slug)) || normalize(tribe.description).includes(normalize(hood.display_name)),
      );
      return {
        id: tribe.id,
        name: tribe.name,
        description: tribe.description,
        imageUrl: tribe.cover_image_url || resolveTribeEditorialImage(tribe),
        neighborhoodLabel: matchingHood?.display_name ?? city,
        themeTags: inferThemesForTribe(tribe),
        href: tribeHref(tribe.slug, city),
        cta: (tribe.viewer_is_member ? "Voir la tribu" : "Rejoindre le cercle") as
          | "Voir la tribu"
          | "Rejoindre le cercle",
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "fr"));
}

export function filterTribePortalCardsByTheme(
  cards: TribePortalCard[],
  theme: TribePortalTheme | "",
): TribePortalCard[] {
  if (!theme) return cards;
  return cards.filter((card) => card.themeTags.includes(theme));
}

export function buildTribeMomentsTimeline(input: {
  city: string;
  tribes: Tribe[];
  events: LocalEvent[];
  maxItems?: number;
}): TribeMomentItem[] {
  const city = input.city.trim() || "Reims";
  const maxItems = input.maxItems ?? 4;
  const activeTribes = input.tribes.filter((tribe) => !tribe.is_archived);

  const linked = input.events
    .filter((event) => !event.is_cancelled)
    .map((event) => {
      const blob = normalize(`${event.title} ${event.description ?? ""}`);
      const tribe = activeTribes.find((item) => {
        const nameKey = normalize(item.name);
        return nameKey.length > 3 && blob.includes(nameKey);
      });
      if (!tribe) return null;
      const start = new Date(event.starts_at);
      return {
        id: event.id,
        dateLabel: start.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
        hourLabel: start.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        title: event.title,
        place: event.location_name,
        tribeName: tribe.name,
        href: buildMapEventUrl(event.id, { city }),
      } satisfies TribeMomentItem;
    })
    .filter((item): item is TribeMomentItem => Boolean(item))
    .slice(0, maxItems);

  return linked;
}

export function buildNearbyActiveTribes(input: {
  city: string;
  tribes: Tribe[];
  neighborhoods: Neighborhood[];
  maxItems?: number;
}): Array<{ id: string; name: string; subtitle: string; href: string; imageUrl: string | null }> {
  const city = input.city.trim() || "Reims";
  const maxItems = input.maxItems ?? 3;
  const featuredNeighborhood = input.neighborhoods.find((hood) => hood.is_featured) ?? input.neighborhoods[0];

  return input.tribes
    .filter((tribe) => !tribe.is_archived)
    .slice(0, maxItems)
    .map((tribe) => ({
      id: tribe.id,
      name: tribe.name,
      subtitle: featuredNeighborhood ? `dans ${featuredNeighborhood.display_name}` : "à proximité",
      href: tribeHref(tribe.slug, city),
      imageUrl: tribe.cover_image_url || resolveTribeEditorialImage(tribe),
    }));
}

export function buildPassportProgressionCopy(passport: PassportMe | null): string {
  if (!passport) return "Participez à une tribu locale pour débloquer votre progression citoyenne.";
  const tierName = passport.tier.name;
  const nextHint = passport.progression?.hint?.trim();
  if (nextHint) {
    return `${nextHint}`;
  }
  const pointsLeft = passport.progression?.points_to_next;
  if (pointsLeft != null && pointsLeft > 0) {
    return `Encore ${pointsLeft} participations pour atteindre le niveau suivant.`;
  }
  return `Vous êtes niveau ${tierName}. Continuez à faire vivre la ville autrement.`;
}

export function buildTribeEditorialStory(input: {
  city: string;
  featuredTribe: Tribe | null;
  events: LocalEvent[];
  neighborhoods: Neighborhood[];
  culturalPlaces: CulturalPlaceListItem[];
}): TribeEditorialStory {
  const city = input.city.trim() || "Reims";
  const featured = input.featuredTribe;
  if (!featured) {
    return {
      title: "Une matinée avec les cercles locaux",
      body: `À ${city}, les premières communautés prennent doucement vie autour de passions partagées.`,
      anchorLabel: city,
      imageUrl: null,
    };
  }

  const linkedEvent = input.events.find((event) => {
    const blob = normalize(`${event.title} ${event.description ?? ""}`);
    return blob.includes(normalize(featured.name));
  });
  const firstNeighborhood = input.neighborhoods[0];
  const firstPlace = input.culturalPlaces[0];

  return {
    title: `Une matinée avec ${featured.name}`,
    body: linkedEvent
      ? `${featured.name} se retrouve près de ${linkedEvent.location_name} pour partager ${tribeCategoryLabel(featured.category).toLowerCase()} sans pression.`
      : `${featured.name} anime une micro-vie locale à ${city}, entre rencontres calmes et habitudes de quartier.`,
    anchorLabel: firstNeighborhood?.display_name ?? firstPlace?.name ?? city,
    imageUrl: featured.cover_image_url || resolveTribeEditorialImage(featured),
  };
}

export function buildTribeLifeSlices(input: {
  city: string;
  tribes: Tribe[];
  events: LocalEvent[];
  neighborhoods: Neighborhood[];
  offers: PartnerOffer[];
  culturalPlaces: CulturalPlaceListItem[];
  maxItems?: number;
}): Array<{ id: string; title: string; subtitle: string; href: string }> {
  const city = input.city.trim() || "Reims";
  const maxItems = input.maxItems ?? 4;
  const slices: Array<{ id: string; title: string; subtitle: string; href: string }> = [];
  const firstTribe = input.tribes.find((tribe) => !tribe.is_archived);
  const firstEvent = input.events.find((event) => !event.is_cancelled);
  const firstNeighborhood = input.neighborhoods[0];
  const firstOffer = input.offers[0];
  const firstPlace = input.culturalPlaces[0];

  if (firstEvent) {
    slices.push({
      id: `event-${firstEvent.id}`,
      title: firstEvent.title,
      subtitle: formatEventDateRange(firstEvent.starts_at, firstEvent.ends_at),
      href: `/events/${firstEvent.id}`,
    });
  }
  if (firstNeighborhood) {
    slices.push({
      id: `hood-${firstNeighborhood.id}`,
      title: `Balade autour de ${firstNeighborhood.display_name}`,
      subtitle: "Une ambiance locale pour marcher et rencontrer.",
      href: neighborhoodHref(firstNeighborhood.slug, city),
    });
  }
  if (firstPlace) {
    slices.push({
      id: `place-${firstPlace.id}`,
      title: firstPlace.name,
      subtitle: firstPlace.short_description,
      href: `/map?place=${encodeURIComponent(firstPlace.slug)}&city=${encodeURIComponent(city)}`,
    });
  }
  if (firstTribe) {
    slices.push({
      id: `tribe-${firstTribe.id}`,
      title: firstTribe.name,
      subtitle: "Cercle local à découvrir",
      href: tribeHref(firstTribe.slug, city),
    });
  }
  if (firstOffer) {
    slices.push({
      id: `offer-${firstOffer.id}`,
      title: firstOffer.title,
      subtitle: firstOffer.organization.name,
      href: "/passport",
    });
  }

  return slices.slice(0, maxItems);
}

export function tribePortalHasNoFakeMetrics(lines: string[]): boolean {
  return lines.every((line) => !BANNED_METRIC_PATTERN.test(line));
}

