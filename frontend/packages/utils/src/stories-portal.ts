import type {
  ProfileMe,
  StoryCategoryId,
  StoryItem,
  StoryRingItem,
  StoryTabId,
} from "@yunicity/types";

import type { Tribe } from "@yunicity/types";
import { formatFeedRelativeTime } from "./feed-portal";
import {
  STORIES_CATEGORY_ALL,
  STORIES_CATEGORY_CAFES,
  STORIES_CATEGORY_CONCERTS,
  STORIES_CATEGORY_CULTURE,
  STORIES_CATEGORY_EVENTS,
  STORIES_CATEGORY_LOCAL,
  STORIES_CATEGORY_NATURE,
  STORIES_CATEGORY_SPORT,
  STORIES_RING_YOURS,
  STORIES_TAB_FOR_YOU,
  STORIES_TAB_RECENT,
  STORIES_TAB_SUBSCRIPTIONS,
} from "./stories-portal-labels";

export type StoryCategoryNavItem = {
  id: StoryCategoryId;
  label: string;
};

export const STORY_CATEGORY_NAV: StoryCategoryNavItem[] = [
  { id: "all", label: STORIES_CATEGORY_ALL },
  { id: "cafes_bars", label: STORIES_CATEGORY_CAFES },
  { id: "concerts", label: STORIES_CATEGORY_CONCERTS },
  { id: "nature", label: STORIES_CATEGORY_NATURE },
  { id: "culture", label: STORIES_CATEGORY_CULTURE },
  { id: "sport", label: STORIES_CATEGORY_SPORT },
  { id: "local_life", label: STORIES_CATEGORY_LOCAL },
  { id: "events", label: STORIES_CATEGORY_EVENTS },
];

export function formatStoryRelativeTime(iso: string, now = new Date()): string {
  return formatFeedRelativeTime(iso, now);
}

export function storyDetailHref(storyId: string): string {
  return `/stories#story-${storyId}`;
}

export const STORIES_JUST_PUBLISHED_STORAGE_KEY = "yunicity-stories-just-published";

export function mergeStoryItems(prev: StoryItem[], next: StoryItem[]): StoryItem[] {
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

export type StoryRingDisplay = {
  id: string;
  kind: "publish" | "mine" | "author";
  name: string;
  subtitle: string;
  imageUrl: string | null;
  href: string;
  hasActivity: boolean;
};

export function buildStoryRingDisplay(input: {
  profile: Pick<ProfileMe, "display_name" | "username" | "avatar_url" | "user_id"> | null;
  rings: StoryRingItem[];
}): StoryRingDisplay[] {
  const displayName =
    input.profile?.display_name?.trim() ||
    input.profile?.username?.trim() ||
    "Vous";
  const userId = input.profile?.user_id ?? null;
  const ownRing = userId ? input.rings.find((ring) => ring.author_id === userId) : undefined;
  const otherRings = userId
    ? input.rings.filter((ring) => ring.author_id !== userId)
    : input.rings;

  const items: StoryRingDisplay[] = ownRing
    ? [
        {
          id: "mine",
          kind: "mine",
          name: displayName,
          subtitle: ownRing.subtitle || STORIES_RING_YOURS,
          imageUrl: ownRing.latest_media_url ?? input.profile?.avatar_url ?? null,
          href: storyDetailHref(ownRing.latest_story_id),
          hasActivity: true,
        },
      ]
    : [
        {
          id: "publish",
          kind: "publish",
          name: displayName,
          subtitle: STORIES_RING_YOURS,
          imageUrl: input.profile?.avatar_url ?? null,
          href: "/stories/new",
          hasActivity: false,
        },
      ];

  for (const ring of otherRings) {
    items.push({
      id: ring.author_id,
      kind: "author",
      name: ring.author_name,
      subtitle: ring.subtitle,
      imageUrl: ring.latest_media_url ?? ring.author_avatar_url,
      href: storyDetailHref(ring.latest_story_id),
      hasActivity: ring.has_recent,
    });
  }
  return items;
}

export { buildDiscussionTribeSidebarItems as buildStoryTribeSidebarItems } from "./discussions-portal";

export type StoryTabOption = { id: StoryTabId; label: string };

export const STORY_TAB_OPTIONS: StoryTabOption[] = [
  { id: "for_you", label: STORIES_TAB_FOR_YOU },
  { id: "subscriptions", label: STORIES_TAB_SUBSCRIPTIONS },
  { id: "recent", label: STORIES_TAB_RECENT },
];

export function storyAuthorLine(story: StoryItem, city: string): string {
  const time = formatStoryRelativeTime(story.created_at);
  const place = story.location_label || story.city || city;
  return `${place} · ${time}`;
}
