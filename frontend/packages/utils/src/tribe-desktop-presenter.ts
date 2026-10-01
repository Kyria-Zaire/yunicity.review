import type {
  LocalEvent,
  Neighborhood,
  Tribe,
  TribeInvitationPending,
  TribeVisibility,
} from "@yunicity/types";

import { formatEventClockTime } from "./events-agenda";
import { resolveTribeEditorialImage } from "./editorial-fallback-images";
import {
  TRIBES_DESKTOP_CARD_JOIN,
  TRIBES_DESKTOP_CARD_REQUEST,
  TRIBES_DESKTOP_CARD_VIEW,
  TRIBES_DESKTOP_VISIBILITY_ON_REQUEST,
  TRIBES_DESKTOP_VISIBILITY_PUBLIC,
} from "./tribe-desktop-labels";
import { tribeCategoryLabel, tribeHref } from "./tribe-labels";
import {
  buildFeaturedTribe,
  findTribeForEvent,
  resolveTribePortalCategories,
} from "./tribe-portal";
import { TRIBES_PORTAL_CATEGORY_LABELS } from "./tribe-portal-labels";

export const TRIBES_DESKTOP_NAV_IDS = [
  "discover",
  "mine",
  "invitations",
  "sent_requests",
  "saved",
] as const;
export type TribesDesktopNavId = (typeof TRIBES_DESKTOP_NAV_IDS)[number];

export const TRIBES_DESKTOP_VISIBILITY_IDS = ["all", "public", "on_request"] as const;
export type TribesDesktopVisibilityId = (typeof TRIBES_DESKTOP_VISIBILITY_IDS)[number];

export const TRIBES_DESKTOP_CATEGORY_IDS = [
  "for_you",
  "nearby",
  "culture",
  "sport",
  "students",
  "parents",
  "creators",
  "entraide",
] as const;
export type TribesDesktopCategoryId = (typeof TRIBES_DESKTOP_CATEGORY_IDS)[number];

export type TribesDesktopSpotlightCard = {
  id: string;
  tribeId: string;
  slug: string;
  title: string;
  description: string;
  imageUrl: string | null;
  href: string;
  visibility: TribeVisibility;
  visibilityBadge: string;
  visibilityTone: string;
  tags: string[];
  nextMeetupLabel: string | null;
  viewerIsMember: boolean;
  viewerHasPendingJoinRequest: boolean;
  isPrivateInvite: boolean;
};

export type TribesDesktopRecommendedCard = {
  id: string;
  tribeId: string;
  slug: string;
  name: string;
  tagsLine: string;
  statusLine: string;
  imageUrl: string | null;
  href: string;
  visibilityBadge: string;
  visibilityTone: string;
  cta: string;
  ctaVariant: "join" | "request" | "view";
  viewerIsMember: boolean;
  isPrivateInvite: boolean;
};

export type TribesDesktopActivityItem = {
  id: string;
  tribeName: string;
  authorLabel: string;
  timestampLabel: string;
  excerpt: string;
  href: string;
  tribeHref: string;
};

export type TribesDesktopMyTribeRow = {
  id: string;
  name: string;
  statusLine: string;
  imageUrl: string | null;
  href: string;
};

export type TribesDesktopNearbyRow = {
  id: string;
  name: string;
  metaLine: string;
  imageUrl: string | null;
  href: string;
};

export type TribesDesktopInvitationCard = {
  id: string;
  tribeName: string;
  tribeSlug: string;
  tribeCity: string;
  sourceLabel: string;
  href: string;
};

const VISIBILITY_TONES: Record<TribeVisibility, string> = {
  public: "bg-sky-100 text-sky-700",
  private_invite: "bg-orange-100 text-orange-700",
};

function normalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function resolveVisibilityBadge(visibility: TribeVisibility): string {
  return visibility === "public"
    ? TRIBES_DESKTOP_VISIBILITY_PUBLIC.toUpperCase()
    : TRIBES_DESKTOP_VISIBILITY_ON_REQUEST.toUpperCase();
}

function resolveTribeTags(tribe: Tribe): string[] {
  const categories = resolveTribePortalCategories(tribe);
  const labels = categories
    .map((id) => TRIBES_PORTAL_CATEGORY_LABELS[id])
    .filter((label): label is string => Boolean(label));
  if (labels.length > 0) return labels.slice(0, 3);
  return [tribeCategoryLabel(tribe.category)];
}

function matchesNeighborhood(tribe: Tribe, neighborhoodSlug: string, neighborhoods: Neighborhood[]): boolean {
  if (!neighborhoodSlug || neighborhoodSlug === "all") return true;
  const hood = neighborhoods.find((item) => normalize(item.slug) === normalize(neighborhoodSlug));
  if (!hood) return false;
  const key = normalize(tribe.slug);
  const nameKey = normalize(hood.display_name);
  return key.includes(normalize(neighborhoodSlug)) || normalize(tribe.description).includes(nameKey);
}

function matchesSearch(tribe: Tribe, query: string): boolean {
  const q = normalize(query);
  if (!q) return true;
  const blob = normalize(`${tribe.name} ${tribe.description} ${tribeCategoryLabel(tribe.category)}`);
  return blob.includes(q);
}

function matchesDesktopCategory(tribe: Tribe, categoryId: TribesDesktopCategoryId): boolean {
  if (categoryId === "for_you" || categoryId === "nearby") return true;

  const text = normalize(`${tribe.name} ${tribe.description}`);
  const category = normalize(tribe.category);

  switch (categoryId) {
    case "culture":
      return ["cafe_culture", "music", "photography", "association"].includes(tribe.category);
    case "sport":
      return category.includes("sport") || text.includes("running") || text.includes("sport");
    case "students":
      return tribe.category === "students" || text.includes("etudiant") || text.includes("campus");
    case "parents":
      return text.includes("parent") || text.includes("famille") || text.includes("enfant");
    case "creators":
      return (
        text.includes("createur") ||
        text.includes("entrepreneur") ||
        text.includes("design") ||
        text.includes("numerique")
      );
    case "entraide":
      return (
        tribe.category === "volunteering" ||
        text.includes("entraide") ||
        text.includes("benevol") ||
        text.includes("voisin")
      );
    default:
      return true;
  }
}

function resolveNextEventForTribe(
  tribe: Tribe,
  events: LocalEvent[],
  now = new Date(),
): LocalEvent | null {
  return (
    events
      .filter(
        (event) =>
          !event.is_cancelled &&
          Date.parse(event.starts_at) >= now.getTime() &&
          findTribeForEvent(event, [tribe])?.id === tribe.id,
      )
      .sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at))[0] ?? null
  );
}

function formatNextMeetupLabel(event: LocalEvent | null, now = new Date()): string | null {
  if (!event) return null;
  const start = new Date(event.starts_at);
  if (Number.isNaN(start.getTime())) return null;
  const dayLabel = start.toLocaleDateString("fr-FR", { weekday: "long" });
  const timeLabel = formatEventClockTime(event.starts_at);
  const capitalizedDay = dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1);
  return `${capitalizedDay} ${timeLabel}`;
}

function resolveCardCta(tribe: Tribe): Pick<TribesDesktopRecommendedCard, "cta" | "ctaVariant"> {
  if (tribe.viewer_is_member) {
    return { cta: TRIBES_DESKTOP_CARD_VIEW, ctaVariant: "view" };
  }
  if (tribe.visibility === "private_invite") {
    return { cta: TRIBES_DESKTOP_CARD_REQUEST, ctaVariant: "request" };
  }
  return { cta: TRIBES_DESKTOP_CARD_JOIN, ctaVariant: "join" };
}

export function filterTribesForDesktopNav(
  tribes: Tribe[],
  navId: TribesDesktopNavId,
  invitationSlugs: Set<string>,
): Tribe[] {
  const active = tribes.filter((tribe) => !tribe.is_archived);
  switch (navId) {
    case "mine":
      return active.filter((tribe) => tribe.viewer_is_member);
    case "invitations":
      return active.filter((tribe) => invitationSlugs.has(normalize(tribe.slug)));
    case "sent_requests":
      return active.filter((tribe) => tribe.viewer_has_pending_join_request);
    case "saved":
      return [];
    default:
      return active;
  }
}

export function filterTribesByDesktopVisibility(
  tribes: Tribe[],
  visibilityId: TribesDesktopVisibilityId,
): Tribe[] {
  if (visibilityId === "all") return tribes;
  if (visibilityId === "public") return tribes.filter((tribe) => tribe.visibility === "public");
  return tribes.filter((tribe) => tribe.visibility === "private_invite");
}

export function filterTribesByDesktopCategory(
  tribes: Tribe[],
  categoryId: TribesDesktopCategoryId,
): Tribe[] {
  return tribes.filter((tribe) => matchesDesktopCategory(tribe, categoryId));
}

export function filterTribesByDesktopNeighborhood(
  tribes: Tribe[],
  neighborhoodSlug: string,
  neighborhoods: Neighborhood[],
): Tribe[] {
  if (!neighborhoodSlug || neighborhoodSlug === "all") return tribes;
  return tribes.filter((tribe) => matchesNeighborhood(tribe, neighborhoodSlug, neighborhoods));
}

export function filterTribesByDesktopSearch(tribes: Tribe[], query: string): Tribe[] {
  return tribes.filter((tribe) => matchesSearch(tribe, query));
}

export function filterTribesForDesktopPortal(input: {
  tribes: Tribe[];
  navId: TribesDesktopNavId;
  visibilityId: TribesDesktopVisibilityId;
  categoryId: TribesDesktopCategoryId;
  neighborhoodSlug: string;
  neighborhoods: Neighborhood[];
  searchQuery: string;
  invitationSlugs: string[];
}): Tribe[] {
  const invitationSet = new Set(input.invitationSlugs.map(normalize));
  let result = filterTribesForDesktopNav(input.tribes, input.navId, invitationSet);
  result = filterTribesByDesktopVisibility(result, input.visibilityId);
  result = filterTribesByDesktopCategory(result, input.categoryId);
  result = filterTribesByDesktopNeighborhood(result, input.neighborhoodSlug, input.neighborhoods);
  result = filterTribesByDesktopSearch(result, input.searchQuery);
  return result;
}

export function buildTribesDesktopSpotlight(input: {
  city: string;
  tribes: Tribe[];
  events: LocalEvent[];
  excludeIds?: string[];
  now?: Date;
}): TribesDesktopSpotlightCard | null {
  const city = input.city.trim() || "Reims";
  const now = input.now ?? new Date();
  const exclude = new Set(input.excludeIds ?? []);
  const featured = buildFeaturedTribe(input.tribes.filter((tribe) => !exclude.has(tribe.id)));
  if (!featured) return null;

  const nextEvent = resolveNextEventForTribe(featured, input.events, now);
  const nextMeetupLabel = formatNextMeetupLabel(nextEvent, now);

  return {
    id: featured.id,
    tribeId: featured.id,
    slug: featured.slug,
    title: featured.name,
    description: featured.description,
    imageUrl: featured.cover_image_url || resolveTribeEditorialImage(featured),
    href: tribeHref(featured.slug, city),
    visibility: featured.visibility,
    visibilityBadge: resolveVisibilityBadge(featured.visibility),
    visibilityTone: VISIBILITY_TONES[featured.visibility],
    tags: resolveTribeTags(featured),
    nextMeetupLabel,
    viewerIsMember: featured.viewer_is_member,
    viewerHasPendingJoinRequest: featured.viewer_has_pending_join_request,
    isPrivateInvite: featured.visibility === "private_invite" && !featured.viewer_is_member,
  };
}

export function buildTribesDesktopRecommendedCards(input: {
  city: string;
  tribes: Tribe[];
  events: LocalEvent[];
  excludeId?: string | null;
  limit?: number;
  now?: Date;
}): TribesDesktopRecommendedCard[] {
  const city = input.city.trim() || "Reims";
  const limit = input.limit ?? 4;
  const now = input.now ?? new Date();

  return input.tribes
    .filter((tribe) => !tribe.is_archived && tribe.id !== input.excludeId)
    .slice()
    .sort((a, b) => {
      if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
      return b.active_member_count - a.active_member_count;
    })
    .slice(0, limit)
    .map((tribe) => {
      const nextEvent = resolveNextEventForTribe(tribe, input.events, now);
      const tags = resolveTribeTags(tribe);
      const cta = resolveCardCta(tribe);
      const statusLine = nextEvent
        ? `${nextEvent.title} · ${formatNextMeetupLabel(nextEvent, now) ?? ""}`.trim()
        : `${tribe.active_member_count} participant${tribe.active_member_count > 1 ? "s" : ""}`;

      return {
        id: tribe.id,
        tribeId: tribe.id,
        slug: tribe.slug,
        name: tribe.name,
        tagsLine: tags.slice(0, 2).join(" · "),
        statusLine,
        imageUrl: tribe.cover_image_url || resolveTribeEditorialImage(tribe),
        href: tribeHref(tribe.slug, city),
        visibilityBadge: resolveVisibilityBadge(tribe.visibility),
        visibilityTone: VISIBILITY_TONES[tribe.visibility],
        viewerIsMember: tribe.viewer_is_member,
        isPrivateInvite: tribe.visibility === "private_invite" && !tribe.viewer_is_member,
        ...cta,
      };
    });
}

export function buildTribesDesktopActivityItems(input: {
  city: string;
  tribes: Tribe[];
  events: LocalEvent[];
  limit?: number;
  now?: Date;
}): TribesDesktopActivityItem[] {
  const city = input.city.trim() || "Reims";
  const limit = input.limit ?? 2;
  const now = input.now ?? new Date();
  const activeTribes = input.tribes.filter((tribe) => !tribe.is_archived);

  return input.events
    .filter((event) => !event.is_cancelled && Date.parse(event.starts_at) >= now.getTime())
    .map((event) => {
      const tribe = findTribeForEvent(event, activeTribes);
      if (!tribe) return null;
      const start = new Date(event.starts_at);
      const timestampLabel = Number.isNaN(start.getTime())
        ? ""
        : start.toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
      const excerpt = event.description?.trim() || event.title;
      return {
        id: event.id,
        tribeName: tribe.name,
        authorLabel: "Communauté",
        timestampLabel,
        excerpt,
        href: `/events/${event.id}`,
        tribeHref: tribeHref(tribe.slug, city),
      } satisfies TribesDesktopActivityItem;
    })
    .filter((item): item is TribesDesktopActivityItem => Boolean(item))
    .slice(0, limit);
}

export function buildTribesDesktopMyTribeRows(input: {
  city: string;
  tribes: Tribe[];
  events: LocalEvent[];
  maxItems?: number;
  now?: Date;
}): TribesDesktopMyTribeRow[] {
  const city = input.city.trim() || "Reims";
  const maxItems = input.maxItems ?? 4;
  const now = input.now ?? new Date();

  return input.tribes
    .filter((tribe) => !tribe.is_archived && tribe.viewer_is_member)
    .slice(0, maxItems)
    .map((tribe) => {
      const nextEvent = resolveNextEventForTribe(tribe, input.events, now);
      const statusLine = nextEvent
        ? `Nouveau rendez-vous ${formatNextMeetupLabel(nextEvent, now)?.toLowerCase() ?? ""}`.trim()
        : "Membre actif";
      return {
        id: tribe.id,
        name: tribe.name,
        statusLine,
        imageUrl: tribe.cover_image_url || resolveTribeEditorialImage(tribe),
        href: tribeHref(tribe.slug, city),
      };
    });
}

export function buildTribesDesktopNearbyRows(input: {
  city: string;
  tribes: Tribe[];
  neighborhoods: Neighborhood[];
  neighborhoodSlug?: string;
  maxItems?: number;
}): TribesDesktopNearbyRow[] {
  const city = input.city.trim() || "Reims";
  const maxItems = input.maxItems ?? 3;
  const slug =
    input.neighborhoodSlug ??
    input.neighborhoods.find((hood) => hood.is_featured)?.slug ??
    input.neighborhoods[0]?.slug ??
    "";
  const hood = input.neighborhoods.find((item) => normalize(item.slug) === normalize(slug));
  const hoodLabel = hood?.display_name ?? city;

  return input.tribes
    .filter((tribe) => !tribe.is_archived && matchesNeighborhood(tribe, slug || "all", input.neighborhoods))
    .slice(0, maxItems)
    .map((tribe) => ({
      id: tribe.id,
      name: tribe.name,
      metaLine: `${resolveTribeTags(tribe)[0] ?? tribeCategoryLabel(tribe.category)} · ${hoodLabel}`,
      imageUrl: tribe.cover_image_url || resolveTribeEditorialImage(tribe),
      href: tribeHref(tribe.slug, city),
    }));
}

export function buildTribesDesktopInvitationCards(input: {
  city: string;
  invitations: TribeInvitationPending[];
  maxItems?: number;
}): TribesDesktopInvitationCard[] {
  const city = input.city.trim() || "Reims";
  const maxItems = input.maxItems ?? 1;

  return input.invitations.slice(0, maxItems).map((invitation) => ({
    id: invitation.id,
    tribeName: invitation.tribe_name,
    tribeSlug: invitation.tribe_slug,
    tribeCity: invitation.tribe_city || city,
    sourceLabel: "Association locale",
    href: tribeHref(invitation.tribe_slug, invitation.tribe_city || city),
  }));
}

export function resolveTribesDesktopFeaturedNeighborhoodLabel(
  neighborhoods: Neighborhood[],
  neighborhoodSlug?: string,
): string {
  if (neighborhoodSlug && neighborhoodSlug !== "all") {
    const hood = neighborhoods.find((item) => normalize(item.slug) === normalize(neighborhoodSlug));
    if (hood) return hood.display_name;
  }
  return (
    neighborhoods.find((hood) => hood.is_featured)?.display_name ??
    neighborhoods[0]?.display_name ??
    "Saint-Remi"
  );
}
