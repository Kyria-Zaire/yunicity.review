/** Citizen feed types (TICKET-402 / TICKET-403) — alignés sur l’API backend. */

export type FeedPostType = "post" | "offer";

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

export interface FeedOfferMeta {
  partner_offer_id: string;
  valid_from: string | null;
  valid_until: string | null;
  offer_type: string | null;
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
