import type {
  NeighborhoodContributionMeItem,
  NeighborhoodContributionMeStatus,
} from "@yunicity/types";

import {
  contributionHasVisibleTitle,
  formatNeighborhoodContributionDate,
} from "./neighborhood-contribution-presenter";
import { neighborhoodHref } from "./neighborhood-labels";

export const PROFILE_MEMORIES_SECTION_TITLE = "Mes souvenirs";
export const PROFILE_MEMORIES_SECTION_SUBTITLE =
  "Retrouvez les souvenirs que vous avez choisis de transmettre à votre ville.";

export const PROFILE_MEMORIES_EMPTY_TITLE = "Vous n'avez encore partagé aucun souvenir.";
export const PROFILE_MEMORIES_EMPTY_BODY =
  "Lorsque vous transmettrez un fragment de votre histoire, vous le retrouverez ici.";
export const PROFILE_MEMORIES_EMPTY_CTA = "Explorer les quartiers";
export const PROFILE_MEMORIES_EMPTY_HREF = "/neighborhoods";

export const PROFILE_MEMORIES_LOADING = "Chargement de vos souvenirs…";
export const PROFILE_MEMORIES_ERROR = "Impossible de charger vos souvenirs pour le moment.";
export const PROFILE_MEMORIES_RETRY = "Réessayer";

export const PROFILE_MEMORY_STATUS_BADGE: Record<NeighborhoodContributionMeStatus, string> = {
  pending: "En relecture",
  approved: "Partagé",
  rejected: "Non publié",
};

export const PROFILE_MEMORY_STATUS_COPY: Record<
  Extract<NeighborhoodContributionMeStatus, "pending" | "approved">,
  string
> = {
  pending: "Votre souvenir sera relu avant publication.",
  approved: "Merci d'avoir contribué à la mémoire de votre ville.",
};

export const PROFILE_MEMORY_REJECTED_FALLBACK =
  "Ce souvenir n'a pas pu être publié.";

export const PROFILE_MEMORY_GROUP_LABELS: Record<NeighborhoodContributionMeStatus, string> = {
  pending: "En relecture",
  approved: "Partagés",
  rejected: "Non publiés",
};

const STATUS_DISPLAY_ORDER: NeighborhoodContributionMeStatus[] = [
  "pending",
  "approved",
  "rejected",
];

export type ProfileMemoryCardSections = {
  neighborhoodName: string;
  neighborhoodHref: string;
  title: string | null;
  body: string;
  statusBadge: string;
  statusMessage: string;
  dateLabel: string;
};

export type ProfileMemoryGroup = {
  status: NeighborhoodContributionMeStatus;
  label: string;
  items: NeighborhoodContributionMeItem[];
};

export function resolveProfileMemoryStatusMessage(item: NeighborhoodContributionMeItem): string {
  if (item.status === "rejected") {
    return item.rejection_message?.trim() || PROFILE_MEMORY_REJECTED_FALLBACK;
  }
  return PROFILE_MEMORY_STATUS_COPY[item.status];
}

export function resolveProfileMemoryDate(
  item: NeighborhoodContributionMeItem,
  now: Date = new Date(),
): string {
  const iso =
    item.status === "approved"
      ? item.approved_at ?? item.submitted_at
      : item.status === "rejected"
        ? item.reviewed_at ?? item.submitted_at
        : item.submitted_at;
  return formatNeighborhoodContributionDate(iso, now);
}

export function sortProfileMemoriesDescending(
  items: NeighborhoodContributionMeItem[],
): NeighborhoodContributionMeItem[] {
  return [...items].sort(
    (left, right) =>
      new Date(right.submitted_at).getTime() - new Date(left.submitted_at).getTime(),
  );
}

export function groupProfileMemoriesByStatus(
  items: NeighborhoodContributionMeItem[],
): ProfileMemoryGroup[] {
  const sorted = sortProfileMemoriesDescending(items);
  return STATUS_DISPLAY_ORDER.map((status) => ({
    status,
    label: PROFILE_MEMORY_GROUP_LABELS[status],
    items: sorted.filter((item) => item.status === status),
  })).filter((group) => group.items.length > 0);
}

export function buildProfileMemoryCardSections(
  item: NeighborhoodContributionMeItem,
  city = "Reims",
  now: Date = new Date(),
): ProfileMemoryCardSections {
  return {
    neighborhoodName: item.neighborhood.display_name,
    neighborhoodHref: neighborhoodHref(item.neighborhood.slug, city),
    title: contributionHasVisibleTitle(item.title) ? item.title!.trim() : null,
    body: item.body,
    statusBadge: PROFILE_MEMORY_STATUS_BADGE[item.status],
    statusMessage: resolveProfileMemoryStatusMessage(item),
    dateLabel: resolveProfileMemoryDate(item, now),
  };
}
