import type {
  CulturalPlaceListItem,
  LocalEvent,
  Neighborhood,
  PartnerOfferPublic,
  PassportMe,
  Tribe,
} from "@yunicity/types";

import { formatEventDateRange } from "./event-labels";
import { resolveEventHeroImage, resolveFeaturedCarouselEventImage } from "./event-hero-image";
import { formatEventClockTime } from "./events-agenda";
import { buildMapEventUrl } from "./explorer-links";
import { resolveTribeEditorialImage } from "./editorial-fallback-images";
import { neighborhoodHref } from "./neighborhood-labels";
import {
  TRIBES_PORTAL_BADGE_FEATURED,
  TRIBES_PORTAL_BADGE_NEW,
  TRIBES_PORTAL_BADGE_POPULAR,
  TRIBES_PORTAL_CATEGORY_LABELS,
  TRIBES_PORTAL_THEME_LABELS,
} from "./tribe-portal-labels";
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

export const TRIBES_PORTAL_VIEWS = ["all", "mine", "featured", "meetups"] as const;
export type TribesPortalView = (typeof TRIBES_PORTAL_VIEWS)[number];

export const TRIBES_PORTAL_CATEGORY_IDS = [
  "culture",
  "nature",
  "sport",
  "gastronomie",
  "musique",
  "photo",
  "education",
  "solidarite",
] as const;
export type TribePortalCategoryId = (typeof TRIBES_PORTAL_CATEGORY_IDS)[number];

export type TribesPortalStats = {
  activeTribes: number;
  engagedMembers: number;
  meetupsThisWeek: number;
};

export type TribesFeaturedCard = {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  href: string;
  badge: string;
  badgeVariant: "featured" | "new" | "popular" | "category";
  iconKey: string;
  memberCount: number;
  meetupsThisWeek: number;
};

export type TribesMeetupCard = {
  id: string;
  title: string;
  locationLabel: string;
  dateBadgeDay: string;
  dateBadgeDate: string;
  dateBadgeMonth: string;
  timeRange: string;
  imageUrl: string | null;
  tribeName: string | null;
  href: string;
};

const PORTAL_CATEGORY_BY_TRIBE_CATEGORY: Record<string, TribePortalCategoryId[]> = {
  sport_local: ["sport", "nature"],
  photography: ["photo"],
  volunteering: ["solidarite"],
  cafe_culture: ["culture", "gastronomie"],
  students: ["education"],
  music: ["musique", "culture"],
  association: ["culture", "solidarite"],
  other: ["culture"],
};

const NEW_TRIBE_DAYS = 21;
const POPULAR_MEMBER_MIN = 2;

export type TribePortalCard = {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  categoryLabel: string;
  categoryId: TribePortalCategoryId | "";
  themeLabels: string[];
  neighborhoodLabel: string;
  showNeighborhood: boolean;
  themeTags: TribePortalTheme[];
  memberCount: number;
  href: string;
  cta: "Rejoindre" | "Voir la tribu";
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

export function findTribeForEvent(event: LocalEvent, tribes: Tribe[]): Tribe | null {
  const active = tribes.filter((tribe) => !tribe.is_archived);
  const blob = normalize(`${event.title} ${event.description ?? ""} ${event.event_type ?? ""}`);

  for (const tribe of active) {
    const nameKey = normalize(tribe.name);
    if (nameKey.length > 3 && blob.includes(nameKey)) {
      return tribe;
    }
    const slugParts = normalize(tribe.slug)
      .split("-")
      .filter((part) => part.length > 4);
    if (slugParts.some((part) => blob.includes(part))) {
      return tribe;
    }
  }

  const categoryHints: Array<{ pattern: RegExp; categories: string[] }> = [
    { pattern: /photo|urbain|atelier/, categories: ["photography"] },
    { pattern: /cafe|café|lecture|livre|rencontre/, categories: ["cafe_culture"] },
    { pattern: /running|sport|marche|balade/, categories: ["sport_local"] },
    { pattern: /musique|concert|jam|acoust/, categories: ["music"] },
    { pattern: /benevol|solidar|associ/, categories: ["volunteering", "association"] },
  ];

  for (const hint of categoryHints) {
    if (!hint.pattern.test(blob)) continue;
    const match = active.find((tribe) => hint.categories.includes(tribe.category));
    if (match) return match;
  }

  return null;
}

function isWithinNextDays(iso: string, days: number, now = new Date()): boolean {
  const start = new Date(iso);
  if (Number.isNaN(start.getTime())) return false;
  const horizon = new Date(now);
  horizon.setDate(horizon.getDate() + days);
  return start >= now && start <= horizon;
}

function isNewTribe(tribe: Tribe, now = new Date()): boolean {
  const created = new Date(tribe.created_at);
  if (Number.isNaN(created.getTime())) return false;
  const ageMs = now.getTime() - created.getTime();
  return ageMs >= 0 && ageMs <= NEW_TRIBE_DAYS * 86_400_000;
}

export function countMeetupsThisWeekForTribe(tribe: Tribe, events: LocalEvent[], now = new Date()): number {
  return events.filter(
    (event) =>
      !event.is_cancelled &&
      isWithinNextDays(event.starts_at, 7, now) &&
      findTribeForEvent(event, [tribe])?.id === tribe.id,
  ).length;
}

export function buildTribesPortalStats(
  tribes: Tribe[],
  events: LocalEvent[],
  now = new Date(),
): TribesPortalStats {
  const active = tribes.filter((tribe) => !tribe.is_archived);
  const meetupsThisWeek = events.filter(
    (event) =>
      !event.is_cancelled &&
      isWithinNextDays(event.starts_at, 7, now) &&
      findTribeForEvent(event, active),
  ).length;
  return {
    activeTribes: active.length,
    engagedMembers: active.reduce((sum, tribe) => sum + tribe.active_member_count, 0),
    meetupsThisWeek,
  };
}

export function resolveTribePortalCategories(tribe: Tribe): TribePortalCategoryId[] {
  return PORTAL_CATEGORY_BY_TRIBE_CATEGORY[tribe.category] ?? ["culture"];
}

export function filterTribesForPortalCategory(
  tribes: Tribe[],
  categoryId: TribePortalCategoryId | "",
): Tribe[] {
  if (!categoryId) {
    return tribes.filter((tribe) => !tribe.is_archived);
  }
  return tribes.filter(
    (tribe) => !tribe.is_archived && resolveTribePortalCategories(tribe).includes(categoryId),
  );
}

export function filterTribesForPortalView(
  tribes: Tribe[],
  view: TribesPortalView,
  events: LocalEvent[],
): Tribe[] {
  const active = tribes.filter((tribe) => !tribe.is_archived);
  switch (view) {
    case "mine":
      return active.filter((tribe) => tribe.viewer_is_member);
    case "featured":
      return active.filter((tribe) => tribe.is_featured);
    case "meetups": {
      const linkedIds = new Set(
        events
          .filter((event) => !event.is_cancelled && findTribeForEvent(event, active))
          .map((event) => findTribeForEvent(event, active)!.id),
      );
      return active.filter((tribe) => linkedIds.has(tribe.id));
    }
    default:
      return active;
  }
}

function resolveFeaturedBadge(
  tribe: Tribe,
  activeTribes: Tribe[],
  now = new Date(),
): Pick<TribesFeaturedCard, "badge" | "badgeVariant"> {
  if (tribe.is_featured) {
    return { badge: TRIBES_PORTAL_BADGE_FEATURED, badgeVariant: "featured" };
  }
  if (isNewTribe(tribe, now)) {
    return { badge: TRIBES_PORTAL_BADGE_NEW, badgeVariant: "new" };
  }
  const maxMembers = Math.max(...activeTribes.map((item) => item.active_member_count), 0);
  if (tribe.active_member_count >= POPULAR_MEMBER_MIN && tribe.active_member_count === maxMembers) {
    return { badge: TRIBES_PORTAL_BADGE_POPULAR, badgeVariant: "popular" };
  }
  return {
    badge: tribeCategoryLabel(tribe.category).toUpperCase(),
    badgeVariant: "category",
  };
}

export function buildTribesFeaturedCards(input: {
  city: string;
  tribes: Tribe[];
  events: LocalEvent[];
  maxItems?: number;
  now?: Date;
}): TribesFeaturedCard[] {
  const city = input.city.trim() || "Reims";
  const maxItems = input.maxItems ?? 8;
  const now = input.now ?? new Date();
  const active = input.tribes.filter((tribe) => !tribe.is_archived);

  return active
    .slice()
    .sort((a, b) => {
      if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
      return b.active_member_count - a.active_member_count;
    })
    .slice(0, maxItems)
    .map((tribe) => {
      const badge = resolveFeaturedBadge(tribe, active, now);
      return {
        id: tribe.id,
        name: tribe.name,
        description: tribe.description,
        imageUrl: tribe.cover_image_url || resolveTribeEditorialImage(tribe),
        href: tribeHref(tribe.slug, city),
        ...badge,
        iconKey: tribe.category,
        memberCount: tribe.active_member_count,
        meetupsThisWeek: countMeetupsThisWeekForTribe(tribe, input.events, now),
      };
    });
}

function formatMeetupTimeRange(startsAt: string, endsAt: string | null): string {
  const start = formatEventClockTime(startsAt);
  if (!endsAt) return start;
  const end = formatEventClockTime(endsAt);
  return end ? `${start} - ${end}` : start;
}

function formatMeetupDateParts(iso: string): Pick<
  TribesMeetupCard,
  "dateBadgeDay" | "dateBadgeDate" | "dateBadgeMonth"
> {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return { dateBadgeDay: "", dateBadgeDate: "", dateBadgeMonth: "" };
  }
  return {
    dateBadgeDay: date
      .toLocaleDateString("fr-FR", { weekday: "short" })
      .replace(".", "")
      .toUpperCase(),
    dateBadgeDate: String(date.getDate()),
    dateBadgeMonth: date
      .toLocaleDateString("fr-FR", { month: "short" })
      .replace(".", "")
      .toUpperCase(),
  };
}

export function buildTribesMeetupCards(input: {
  city: string;
  tribes: Tribe[];
  events: LocalEvent[];
  culturalPlaces: CulturalPlaceListItem[];
  maxItems?: number;
  now?: Date;
}): TribesMeetupCard[] {
  const city = input.city.trim() || "Reims";
  const maxItems = input.maxItems ?? 8;
  const now = input.now ?? new Date();
  const active = input.tribes.filter((tribe) => !tribe.is_archived);

  return input.events
    .filter((event) => !event.is_cancelled && new Date(event.starts_at) >= now)
    .slice()
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
    .map((event) => {
      const tribe = findTribeForEvent(event, active);
      const district =
        event.neighborhood_summary?.display_name ?? event.district?.trim() ?? null;
      const locationLabel = district
        ? `${district} · ${event.location_name}`
        : event.location_name;
      return {
        id: event.id,
        title: event.title,
        locationLabel,
        ...formatMeetupDateParts(event.starts_at),
        timeRange: formatMeetupTimeRange(event.starts_at, event.ends_at),
        imageUrl:
          resolveFeaturedCarouselEventImage(event) ??
          resolveEventHeroImage(event, input.culturalPlaces),
        tribeName: tribe?.name ?? null,
        href: `/events/${event.id}`,
      };
    })
    .filter((card) => card.tribeName !== null)
    .slice(0, maxItems);
}

export function resolveTribesPortalHeroImage(tribes: Tribe[]): string | null {
  const featured = buildFeaturedTribe(tribes);
  if (!featured) return null;
  return featured.cover_image_url || resolveTribeEditorialImage(featured);
}

function resolveTribeListCategoryLabel(tribe: Tribe): {
  categoryId: TribePortalCategoryId | "";
  categoryLabel: string;
} {
  const categories = resolveTribePortalCategories(tribe);
  const primary = categories[0];
  if (primary) {
    return {
      categoryId: primary,
      categoryLabel:
        TRIBES_PORTAL_CATEGORY_LABELS[primary] ?? tribeCategoryLabel(tribe.category),
    };
  }
  return { categoryId: "", categoryLabel: tribeCategoryLabel(tribe.category) };
}

function resolveTribeListThemeLabels(tribe: Tribe): string[] {
  return inferThemesForTribe(tribe)
    .map((theme) => TRIBES_PORTAL_THEME_LABELS[theme])
    .filter((label, index, labels) => labels.indexOf(label) === index)
    .slice(0, 2);
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
      const { categoryId, categoryLabel } = resolveTribeListCategoryLabel(tribe);
      const themeTags = inferThemesForTribe(tribe);
      return {
        id: tribe.id,
        name: tribe.name,
        description: tribe.description,
        imageUrl: tribe.cover_image_url || resolveTribeEditorialImage(tribe),
        categoryLabel,
        categoryId,
        themeLabels: resolveTribeListThemeLabels(tribe),
        neighborhoodLabel: matchingHood?.display_name ?? city,
        showNeighborhood: Boolean(matchingHood),
        themeTags,
        memberCount: tribe.active_member_count,
        href: tribeHref(tribe.slug, city),
        cta: (tribe.viewer_is_member ? "Voir la tribu" : "Rejoindre") as TribePortalCard["cta"],
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
      const tribe = findTribeForEvent(event, activeTribes);
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
  offers: PartnerOfferPublic[];
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
      subtitle: firstOffer.partner.name,
      href: "/passport",
    });
  }

  return slices.slice(0, maxItems);
}

export function tribePortalHasNoFakeMetrics(lines: string[]): boolean {
  return lines.every((line) => !BANNED_METRIC_PATTERN.test(line));
}

