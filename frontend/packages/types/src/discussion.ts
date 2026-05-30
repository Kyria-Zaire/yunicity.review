import type { FeedPost } from "./feed";

export type DiscussionCategoryId =
  | "all"
  | "questions"
  | "tips"
  | "news"
  | "culture"
  | "sports"
  | "tribes";

export type DiscussionParticipant = {
  display_name: string;
  avatar_url: string | null;
};

export type DiscussionThread = FeedPost & {
  discussion_title: string;
  excerpt: string;
  category_ids: string[];
  category_labels: string[];
  discussion_tags: string[];
  linked_tribe_id: string | null;
  linked_tribe_name: string | null;
  participants: DiscussionParticipant[];
  participants_overflow: number;
  last_activity_at: string | null;
};

export type DiscussionListResponse = {
  items: DiscussionThread[];
  next_cursor: string | null;
  city: string | null;
};

export type DiscussionTrendingTopic = {
  id: string;
  label: string;
  message_count: number;
};

export type DiscussionActiveItem = {
  post_id: string;
  title: string;
  reply_count: number;
  last_activity_at: string | null;
  has_recent_activity: boolean;
  author_display_name: string;
  author_avatar_url: string | null;
};

export type DiscussionInsightsResponse = {
  trending_topics: DiscussionTrendingTopic[];
  active_discussions: DiscussionActiveItem[];
};

export type DiscussionListParams = {
  category?: DiscussionCategoryId;
  cursor?: string | null;
  limit?: number;
  require_comments?: boolean;
};

export type DiscussionCreatePayload = {
  title: string;
  body: string;
  category: DiscussionCategoryId;
  tags?: string[];
  linked_tribe_id?: string | null;
  media_url?: string | null;
};
