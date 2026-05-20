/** Tribe types (FEATURE-A / TICKET-A.3) — alignés sur l’API backend A.2. */

import type { FeedPost } from "./feed";

export type TribeVisibility = "public" | "private_invite";

export type TribeMemberRole = "member" | "moderator" | "owner";

export type TribeCategory =
  | "sport_local"
  | "photography"
  | "volunteering"
  | "cafe_culture"
  | "students"
  | "music"
  | "association"
  | "other";

export interface Tribe {
  id: string;
  slug: string;
  name: string;
  description: string;
  city: string;
  category: string;
  visibility: TribeVisibility;
  persistence_kind: string;
  cover_image_url: string | null;
  is_featured: boolean;
  member_limit: number;
  active_member_count: number;
  is_archived: boolean;
  viewer_is_member: boolean;
  viewer_role: TribeMemberRole | null;
  created_at: string;
  updated_at: string;
}

export interface TribeListResponse {
  items: Tribe[];
  total: number;
  page: number;
  page_size: number;
}

export interface TribeMember {
  user_id: string;
  role: TribeMemberRole;
  joined_at: string;
}

export interface TribeMemberListResponse {
  items: TribeMember[];
  total: number;
  page: number;
  page_size: number;
}

export interface TribeJoinPayload {
  charter_accepted: boolean;
}

export interface TribePostCreatePayload {
  body: string;
  media_url?: string | null;
}

export interface TribePostListResponse {
  items: FeedPost[];
  next_cursor: string | null;
}

export interface TribeInvitationCreateResponse {
  token: string;
  expires_at: string;
}

export interface TribeInvitationAcceptPayload {
  charter_accepted?: boolean;
}

export interface TribeMemberRoleUpdatePayload {
  role: "member" | "moderator";
}

export interface TribeUpdatePayload {
  name?: string;
  description?: string;
  cover_image_url?: string | null;
  is_featured?: boolean;
  member_limit?: number;
}
