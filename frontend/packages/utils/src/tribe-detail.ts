import type {
  CulturalPlaceListItem,
  LocalEvent,
  Neighborhood,
  PartnerOfferPublic,
  Tribe,
  TribeMember,
} from "@yunicity/types";

import { formatEventDateRange } from "./event-labels";
import { resolveTribeEditorialImage } from "./editorial-fallback-images";
import { neighborhoodHref } from "./neighborhood-labels";
import { tribeCategoryLabel, tribeHref } from "./tribe-labels";

type TribeAgendaItem = {
  id: string;
  title: string;
  dateLabel: string;
  place: string;
  href: string;
};

type TribeHabitItem = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
};

type TribeLightSpot = {
  id: string;
  title: string;
  timeLabel: string;
  mood: string;
};

type TribePortrait = {
  id: string;
  name: string;
  story: string;
  cta: string;
};

type TribeLifestyleSlice = {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string | null;
  href: string;
};

const BANNED_METRICS =
  /trending|viral|leaderboard|online|score|heatmap|dopamine|\d+\s*(k|m)\b/i;

function normalize(value: string | null | undefined): string {
  return (value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim();
}

function matchTribeEvent(tribe: Tribe, event: LocalEvent): boolean {
  const blob = normalize(`${event.title} ${event.description ?? ""}`);
  const tribeName = normalize(tribe.name);
  if (tribeName.length >= 4 && blob.includes(tribeName)) return true;
  const category = normalize(tribeCategoryLabel(tribe.category));
  return category.length >= 4 && blob.includes(category);
}

export function buildTribeDetailTagline(
  tribe: Tribe,
  neighborhoods: Neighborhood[],
): string {
  const featuredNeighborhood = neighborhoods.find((hood) =>
    normalize(tribe.description).includes(normalize(hood.display_name)),
  );
  if (featuredNeighborhood) {
    return `${tribe.name} fait vivre ${featuredNeighborhood.display_name} avec une énergie locale et calme.`;
  }
  return `${tribe.name} rassemble des habitants de ${tribe.city} autour d'habitudes partagées.`;
}

export function buildTribeNarrative(input: {
  tribe: Tribe;
  events: LocalEvent[];
  places: CulturalPlaceListItem[];
  neighborhoods: Neighborhood[];
}): string {
  const { tribe, events, places, neighborhoods } = input;
  const tribeEvents = events.filter((event) => matchTribeEvent(tribe, event));
  const firstEvent = tribeEvents[0];
  const firstPlace = places[0];
  const firstNeighborhood = neighborhoods[0];
  if (firstEvent) {
    return `${tribe.name} se retrouve souvent autour de ${firstEvent.location_name}. Les membres partagent des moments simples, puis prolongent la rencontre dans la ville sans rythme forcé.`;
  }
  if (firstPlace && firstNeighborhood) {
    return `${tribe.name} cultive ses rituels entre ${firstPlace.name} et ${firstNeighborhood.display_name}. La communauté avance à taille humaine, au fil des saisons locales.`;
  }
  return "Les premiers instants de cette tribu prennent doucement forme, avec des rencontres locales qui privilégient le lien humain plutôt que le bruit social.";
}

export function buildTribeAgenda(input: {
  tribe: Tribe;
  events: LocalEvent[];
  city: string;
  maxItems?: number;
}): TribeAgendaItem[] {
  const maxItems = input.maxItems ?? 4;
  return input.events
    .filter((event) => !event.is_cancelled)
    .filter((event) => matchTribeEvent(input.tribe, event))
    .slice(0, maxItems)
    .map((event) => ({
      id: event.id,
      title: event.title,
      dateLabel: formatEventDateRange(event.starts_at, event.ends_at),
      place: event.location_name,
      href: `/events/${event.id}`,
    }));
}

export function buildTribeHabits(input: {
  city: string;
  tribe: Tribe;
  places: CulturalPlaceListItem[];
  neighborhoods: Neighborhood[];
  events: LocalEvent[];
  maxItems?: number;
}): TribeHabitItem[] {
  const maxItems = input.maxItems ?? 6;
  const habits: TribeHabitItem[] = [];
  const matchedEvents = input.events.filter((event) => matchTribeEvent(input.tribe, event));

  matchedEvents.slice(0, 2).forEach((event) => {
    habits.push({
      id: `event-${event.id}`,
      title: event.location_name,
      subtitle: `Rendez-vous pour ${event.title.toLowerCase()}`,
      href: `/events/${event.id}`,
    });
  });

  input.places.slice(0, 3).forEach((place) => {
    habits.push({
      id: `place-${place.id}`,
      title: place.name,
      subtitle: place.short_description,
      href: `/map?place=${encodeURIComponent(place.slug)}&city=${encodeURIComponent(input.city)}`,
    });
  });

  input.neighborhoods.slice(0, 2).forEach((hood) => {
    habits.push({
      id: `hood-${hood.id}`,
      title: hood.display_name,
      subtitle: "Quartier fréquenté par la tribu",
      href: neighborhoodHref(hood.slug, input.city),
    });
  });

  return habits.slice(0, maxItems);
}

export function buildTribeLightSpots(input: {
  places: CulturalPlaceListItem[];
  events: LocalEvent[];
  maxItems?: number;
}): TribeLightSpot[] {
  const maxItems = input.maxItems ?? 3;
  const spots: TribeLightSpot[] = [];

  input.places.slice(0, 2).forEach((place, index) => {
    const slot = index === 0 ? "07:15" : "18:42";
    spots.push({
      id: `spot-${place.id}`,
      title: place.name,
      timeLabel: slot,
      mood: "Lumière douce et respiration locale",
    });
  });

  input.events.slice(0, 1).forEach((event) => {
    const start = new Date(event.starts_at);
    const timeLabel = start.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    spots.push({
      id: `event-spot-${event.id}`,
      title: event.location_name,
      timeLabel,
      mood: "Ambiance paisible pour se retrouver",
    });
  });

  return spots.slice(0, maxItems);
}

export function buildTribePortraits(input: {
  tribe: Tribe;
  members: TribeMember[];
  neighborhoods: Neighborhood[];
  places: CulturalPlaceListItem[];
  maxItems?: number;
}): TribePortrait[] {
  const maxItems = input.maxItems ?? 3;
  if (input.members.length > 0) {
    return input.members.slice(0, maxItems).map((member) => {
      const short = member.user_id.slice(0, 6);
      return {
        id: member.user_id,
        name: `Membre ${short}`,
        story: `${short} partage des moments de ${tribeCategoryLabel(input.tribe.category).toLowerCase()} avec la tribu dans ${input.tribe.city}.`,
        cta: "Découvrir son histoire",
      };
    });
  }

  const anchorHood = input.neighborhoods[0]?.display_name ?? input.tribe.city;
  const anchorPlace = input.places[0]?.name ?? "les rues locales";
  return [
    {
      id: `portrait-${input.tribe.id}`,
      name: "Voix locale",
      story: `Cette tribu tisse ses habitudes entre ${anchorPlace} et ${anchorHood}, dans une dynamique humaine et accessible.`,
      cta: "Découvrir son histoire",
    },
  ];
}

export function buildTribeLifestyleSlices(input: {
  city: string;
  tribe: Tribe;
  events: LocalEvent[];
  places: CulturalPlaceListItem[];
  offers: PartnerOfferPublic[];
  maxItems?: number;
}): TribeLifestyleSlice[] {
  const maxItems = input.maxItems ?? 4;
  const slices: TribeLifestyleSlice[] = [];
  const tribeEvents = input.events.filter((event) => matchTribeEvent(input.tribe, event));

  tribeEvents.slice(0, 2).forEach((event) => {
    slices.push({
      id: `life-event-${event.id}`,
      title: event.title,
      subtitle: event.location_name,
      imageUrl: event.cover_image_url,
      href: `/events/${event.id}`,
    });
  });

  input.places.slice(0, 1).forEach((place) => {
    slices.push({
      id: `life-place-${place.id}`,
      title: place.name,
      subtitle: place.short_description,
      imageUrl: place.hero_image_url || place.image_url,
      href: `/map?place=${encodeURIComponent(place.slug)}&city=${encodeURIComponent(input.city)}`,
    });
  });

  input.offers.slice(0, 1).forEach((offer) => {
    slices.push({
      id: `life-offer-${offer.id}`,
      title: offer.title,
      subtitle: offer.partner.name,
      imageUrl: null,
      href: "/passport",
    });
  });

  return slices.slice(0, maxItems);
}

export function buildTribeMapHref(slug: string, city: string): string {
  return `/map?tribe=${encodeURIComponent(slug)}&city=${encodeURIComponent(city)}`;
}

export function buildTribeMomentsHref(slug: string, city: string): string {
  return `/tribes/${encodeURIComponent(slug)}?city=${encodeURIComponent(city)}#agenda-tribu`;
}

export function buildTribeShareText(tribe: Tribe): string {
  return `${tribe.name} — cercle local à ${tribe.city}`;
}

export function tribeDetailHasNoFakeMetrics(lines: string[]): boolean {
  return lines.every((line) => !BANNED_METRICS.test(line));
}

export function resolveTribeHeroImage(tribe: Tribe): string | null {
  return tribe.cover_image_url || resolveTribeEditorialImage(tribe);
}

export function buildTribeBadgeLabel(tribe: Tribe): string {
  return tribe.is_featured ? "Tribu à l'honneur" : "Communauté locale";
}

export function buildRelatedNeighborhoodLinks(
  tribe: Tribe,
  neighborhoods: Neighborhood[],
): Array<{ label: string; href: string }> {
  const city = tribe.city;
  return neighborhoods.slice(0, 2).map((hood) => ({
    label: hood.display_name,
    href: neighborhoodHref(hood.slug, city),
  }));
}

export function buildTribeCtaHref(tribe: Tribe): string {
  return tribeHref(tribe.slug, tribe.city);
}

export type {
  TribeAgendaItem,
  TribeHabitItem,
  TribeLightSpot,
  TribeLifestyleSlice,
  TribePortrait,
};
