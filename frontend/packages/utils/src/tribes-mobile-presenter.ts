import type { Tribe } from "@yunicity/types";

import { formatProfileMobileStatCount } from "./profile-mobile-presenter";
import {
  TRIBES_MOBILE_LAST_ACTIVITY_PREFIX,
} from "./tribes-mobile-labels";
import {
  buildTribesFeaturedCards,
  filterTribesForPortalCategory,
  resolveTribePortalCategories,
  type TribePortalCategoryId,
  type TribesFeaturedCard,
} from "./tribe-portal";
import { TRIBES_PORTAL_CATEGORY_LABELS } from "./tribe-portal-labels";
import { tribeCategoryLabel, tribeHref } from "./tribe-labels";

export const TRIBES_MOBILE_CATEGORY_IDS = [
  "all",
  "culture",
  "sport",
  "art",
  "student",
  "entrepreneurship",
] as const;

export type TribesMobileCategoryId = (typeof TRIBES_MOBILE_CATEGORY_IDS)[number];

export type TribesMobileMemberRow = {
  id: string;
  name: string;
  href: string;
  categoryLabel: string;
  memberCountLabel: string;
  lastActivityLabel: string;
  category: string;
  isFeatured: boolean;
};

export function mapTribesMobileCategoryToPortal(
  categoryId: TribesMobileCategoryId,
): TribePortalCategoryId | "" {
  switch (categoryId) {
    case "culture":
      return "culture";
    case "sport":
      return "sport";
    case "art":
      return "photo";
    case "student":
      return "education";
    case "entrepreneurship":
      return "solidarite";
    default:
      return "";
  }
}

function normalizeSearch(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

export function filterTribesByMobileSearch(tribes: Tribe[], query: string): Tribe[] {
  const needle = normalizeSearch(query);
  if (!needle) {
    return tribes.filter((tribe) => !tribe.is_archived);
  }

  return tribes.filter((tribe) => {
    if (tribe.is_archived) return false;
    const haystack = normalizeSearch(
      `${tribe.name} ${tribe.description} ${tribeCategoryLabel(tribe.category)}`,
    );
    return haystack.includes(needle);
  });
}

export function filterTribesByMobileCategory(
  tribes: Tribe[],
  categoryId: TribesMobileCategoryId,
): Tribe[] {
  const portalCategory = mapTribesMobileCategoryToPortal(categoryId);
  return filterTribesForPortalCategory(tribes, portalCategory);
}

export function buildTribesMobileFeaturedCards(input: {
  city: string;
  tribes: Tribe[];
  events: Parameters<typeof buildTribesFeaturedCards>[0]["events"];
  maxItems?: number;
}): TribesFeaturedCard[] {
  return buildTribesFeaturedCards({
    city: input.city,
    tribes: input.tribes,
    events: input.events,
    maxItems: input.maxItems ?? 6,
  });
}

function resolvePortalCategoryLabel(tribe: Tribe): string {
  const primary = resolveTribePortalCategories(tribe)[0];
  if (primary) {
    return TRIBES_PORTAL_CATEGORY_LABELS[primary] ?? tribeCategoryLabel(tribe.category);
  }
  return tribeCategoryLabel(tribe.category);
}

function formatTribesMobileMemberCount(count: number): string {
  const formatted = formatProfileMobileStatCount(count);
  return `${formatted} membre${count > 1 ? "s" : ""}`;
}

function formatTribesMobileRelativeActivity(iso: string, now = new Date()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return `${TRIBES_MOBILE_LAST_ACTIVITY_PREFIX} —`;

  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes < 60) {
    const minutes = Math.max(1, diffMinutes);
    return `${TRIBES_MOBILE_LAST_ACTIVITY_PREFIX} il y a ${minutes} min`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${TRIBES_MOBILE_LAST_ACTIVITY_PREFIX} il y a ${diffHours} h`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${TRIBES_MOBILE_LAST_ACTIVITY_PREFIX} il y a ${diffDays} j`;
  }

  return `${TRIBES_MOBILE_LAST_ACTIVITY_PREFIX} le ${date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  })}`;
}

export function buildTribesMobileMemberRows(input: {
  city: string;
  tribes: Tribe[];
  maxItems?: number;
}): TribesMobileMemberRow[] {
  const city = input.city.trim() || "Reims";
  const maxItems = input.maxItems ?? 8;

  return input.tribes
    .filter((tribe) => !tribe.is_archived && tribe.viewer_is_member)
    .slice()
    .sort(
      (left, right) =>
        new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime(),
    )
    .slice(0, maxItems)
    .map((tribe) => ({
      id: tribe.id,
      name: tribe.name,
      href: tribeHref(tribe.slug, city),
      categoryLabel: resolvePortalCategoryLabel(tribe),
      memberCountLabel: formatTribesMobileMemberCount(tribe.active_member_count),
      lastActivityLabel: formatTribesMobileRelativeActivity(tribe.updated_at),
      category: tribe.category,
      isFeatured: tribe.is_featured,
    }));
}

export function buildTribesMobileSuggestionCards(input: {
  city: string;
  tribes: Tribe[];
  events: Parameters<typeof buildTribesFeaturedCards>[0]["events"];
  maxItems?: number;
}): TribesFeaturedCard[] {
  const city = input.city.trim() || "Reims";
  const maxItems = input.maxItems ?? 6;

  const suggestions = input.tribes
    .filter((tribe) => !tribe.is_archived && !tribe.viewer_is_member)
    .slice()
    .sort((left, right) => right.active_member_count - left.active_member_count)
    .slice(0, maxItems);

  return buildTribesFeaturedCards({
    city,
    tribes: suggestions,
    events: input.events,
    maxItems,
  });
}
