/** Citizen feed types (TICKET-402 / TICKET-403) — alignés sur l’API backend. */

export type FeedPostType = "post" | "offer" | "event" | "partner_creator";

export type FeedAuthorType = "citizen" | "organization";

export type FeedReportReason = "spam" | "inappropriate" | "other";

export interface FeedLocation {
  latitude: number;
  longitude: number;
}

export interface FeedAuthor {
  type: FeedAuthorType;
  id: string;
  display_name: string;
  username: string | null;
  logo_url: string | null;
}

export interface FeedEventMeta {
  local_event_id: string;
  starts_at: string;
  ends_at: string | null;
  location_name: string;
  district: string | null;
  event_type: string | null;
  interested_by_me: boolean;
}

/** Discrete territorial badge on feed cards (TICKET-602). */
export interface FeedNeighborhoodSummary {
  slug: string;
  display_name: string;
}

export interface FeedCreatorContentMeta {
  partner_creator_content_id: string;
  published_at: string | null;
}

export interface FeedOfferMeta {
  partner_offer_id: string;
  valid_from: string | null;
  valid_until: string | null;
  offer_type: string | null;
  is_flash?: boolean;
  flash_ends_at?: string | null;
  remaining_hours?: number | null;
  remaining_minutes?: number | null;
}

export interface FeedPost {
  id: string;
  type: FeedPostType;
  author: FeedAuthor;
  city: string | null;
  title: string | null;
  body: string | null;
  media_url: string | null;
  location: FeedLocation | null;
  like_count: number;
  comment_count: number;
  liked_by_me: boolean;
  offer: FeedOfferMeta | null;
  event: FeedEventMeta | null;
  creator_content: FeedCreatorContentMeta | null;
  neighborhood_summary: FeedNeighborhoodSummary | null;
  created_at: string;
  updated_at: string;
}

export interface FeedListResponse {
  items: FeedPost[];
  next_cursor: string | null;
}

export interface FeedListParams {
  cursor?: string | null;
  limit?: number;
}

export interface PostCreatePayload {
  author_type?: "citizen";
  body: string;
  media_url?: string | null;
}

export interface FeedComment {
  id: string;
  post_id: string;
  user_id: string;
  author_display_name: string;
  author_username: string | null;
  body: string;
  created_at: string;
  updated_at: string;
}

export interface CommentListResponse {
  items: FeedComment[];
  next_cursor: string | null;
}

export interface CommentCreatePayload {
  body: string;
}

export interface ReportPostPayload {
  reason: FeedReportReason;
}
