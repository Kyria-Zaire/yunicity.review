import type { DiscussionCategoryId, DiscussionThread, Tribe } from "@yunicity/types";

import { formatFeedRelativeTime } from "./feed-portal";
import { tribeCategoryLabel, tribeHref } from "./tribe-labels";
import {
  DISCUSSIONS_CATEGORY_ALL,
  DISCUSSIONS_CATEGORY_CULTURE,
  DISCUSSIONS_CATEGORY_NEWS,
  DISCUSSIONS_CATEGORY_QUESTIONS,
  DISCUSSIONS_CATEGORY_SPORTS,
  DISCUSSIONS_CATEGORY_TIPS,
  DISCUSSIONS_CATEGORY_TRIBES,
} from "./discussions-portal-labels";

export type DiscussionCategoryChip = {
  id: DiscussionCategoryId;
  label: string;
};

export const DISCUSSION_CATEGORY_CHIPS: DiscussionCategoryChip[] = [
  { id: "all", label: DISCUSSIONS_CATEGORY_ALL },
  { id: "questions", label: DISCUSSIONS_CATEGORY_QUESTIONS },
  { id: "tips", label: DISCUSSIONS_CATEGORY_TIPS },
  { id: "news", label: DISCUSSIONS_CATEGORY_NEWS },
  { id: "culture", label: DISCUSSIONS_CATEGORY_CULTURE },
  { id: "sports", label: DISCUSSIONS_CATEGORY_SPORTS },
  { id: "tribes", label: DISCUSSIONS_CATEGORY_TRIBES },
];

const TAG_TONE: Record<string, string> = {
  questions: "bg-amber-50 text-amber-800 border-amber-100",
  tips: "bg-orange-50 text-orange-800 border-orange-100",
  news: "bg-sky-50 text-sky-800 border-sky-100",
  culture: "bg-violet-50 text-violet-800 border-violet-100",
  sports: "bg-emerald-50 text-emerald-800 border-emerald-100",
  tribes: "bg-pink-50 text-pink-800 border-pink-100",
  default: "bg-neutral-50 text-neutral-700 border-neutral-100",
};

export function discussionTagTone(categoryId: string): string {
  return TAG_TONE[categoryId] ?? "bg-neutral-50 text-neutral-700 border-neutral-100";
}

export function formatDiscussionActivityAgo(iso: string | null, now = new Date()): string {
  if (!iso) return "";
  return formatFeedRelativeTime(iso, now);
}

export type DiscussionTribeSidebarItem = {
  id: string;
  name: string;
  subtitle: string;
  href: string;
  hasActivity: boolean;
};

export function buildDiscussionTribeSidebarItems(input: {
  city: string;
  tribes: Tribe[];
  maxVisible?: number;
}): { visible: DiscussionTribeSidebarItem[]; moreCount: number } {
  const maxVisible = input.maxVisible ?? 4;
  const memberTribes = input.tribes.filter((t) => !t.is_archived && t.viewer_is_member);
  const visible = memberTribes.slice(0, maxVisible).map((tribe) => ({
    id: tribe.id,
    name: tribe.name,
    subtitle: tribeCategoryLabel(tribe.category),
    href: tribeHref(tribe.slug, input.city),
    hasActivity: tribe.active_member_count > 0,
  }));
  return {
    visible,
    moreCount: Math.max(0, memberTribes.length - maxVisible),
  };
}

export function discussionThreadHref(postId: string): string {
  return `/discussions#thread-${postId}`;
}

export function mergeDiscussionThreads(
  prev: DiscussionThread[],
  next: DiscussionThread[],
): DiscussionThread[] {
  const seen = new Set(prev.map((item) => item.id));
  const merged = [...prev];
  for (const item of next) {
    if (!seen.has(item.id)) {
      merged.push(item);
      seen.add(item.id);
    }
  }
  return merged;
}
