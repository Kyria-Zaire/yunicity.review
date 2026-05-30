import type { FeedAuthor } from "./feed";

export type StoryCategoryId =
  | "all"
  | "cafes_bars"
  | "concerts"
  | "nature"
  | "culture"
  | "sport"
  | "local_life"
  | "events";

export type StoryTabId = "for_you" | "subscriptions" | "recent";

export type StoryItem = {
  id: string;
  author: FeedAuthor;
  caption: string;
  media_url: string;
  location_label: string | null;
  category_ids: string[];
  category_labels: string[];
  view_count: number;
  like_count: number;
  liked_by_me: boolean;
  created_at: string;
  expires_at: string | null;
  is_recent: boolean;
  city: string | null;
};

export type StoryListResponse = {
  items: StoryItem[];
  next_cursor: string | null;
  city: string | null;
};

export type StoryRingItem = {
  author_id: string;
  author_name: string;
  author_avatar_url: string | null;
  subtitle: string;
  latest_story_id: string;
  latest_media_url: string | null;
  has_recent: boolean;
};

export type StoryRingsResponse = {
  items: StoryRingItem[];
  publish_href: string;
};

export type StoryLiveItem = {
  story_id: string;
  author_name: string;
  author_avatar_url: string | null;
  location_label: string | null;
  subtitle: string;
  view_count: number;
  is_recent: boolean;
};

export type StoryContributorItem = {
  author_id: string;
  author_name: string;
  author_avatar_url: string | null;
  story_count: number;
};

export type StoryFeaturedItem = {
  story_id: string;
  title: string;
  description: string;
  media_url: string;
  href: string;
};

export type StoryInsightsResponse = {
  live_stories: StoryLiveItem[];
  top_contributors: StoryContributorItem[];
  featured: StoryFeaturedItem | null;
};

export type StoryListParams = {
  tab?: StoryTabId;
  category?: StoryCategoryId;
  cursor?: string | null;
  limit?: number;
};

export type StoryAudienceId = "public" | "community";

export type StoryCreatePayload = {
  media_url: string;
  caption?: string;
  category?: StoryCategoryId;
  audience?: StoryAudienceId;
  tags?: string[];
  media_type?: "image" | "video" | null;
  location_label?: string | null;
};

export type StoryMediaUploadResponse = {
  url: string;
  media_type: "image" | "video";
};
