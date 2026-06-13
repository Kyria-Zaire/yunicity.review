/** Local Video V2 — types API (FEATURE-CREATORS-V2 / C2-S2). */

export type LocalVideoTypeId =
  | "bon_plan"
  | "moment"
  | "quartier"
  | "lieu"
  | "tribu"
  | "autre";

export type LocalVideoStatusId =
  | "processing"
  | "published"
  | "failed"
  | "hidden"
  | "deleted";

export type LocalVideoAuthor = {
  id: string;
  username: string | null;
  full_name: string;
  avatar_url: string | null;
};

export type LocalVideoFeedItem = {
  id: string;
  author_user_id: string;
  author: LocalVideoAuthor;
  city: string;
  neighborhood_id: string;
  neighborhood_name: string;
  neighborhood_slug: string;
  video_type: LocalVideoTypeId;
  title: string | null;
  description: string | null;
  cultural_place_id: string | null;
  cultural_place_slug: string | null;
  cultural_place_name: string | null;
  local_event_id: string | null;
  tribe_id: string | null;
  organization_id: string | null;
  media_url: string;
  thumbnail_url: string;
  duration_seconds: number;
  mime_type: string;
  latitude: number | null;
  longitude: number | null;
  status: LocalVideoStatusId;
  published_at: string | null;
  created_at: string;
  distance_meters: number | null;
  walk_minutes: number | null;
  like_count: number;
  comment_count: number;
};

export type LocalVideoListParams = {
  cursor?: string;
  limit?: number;
  city?: string;
  latitude?: number;
  longitude?: number;
};

export type LocalVideoListResponse = {
  items: LocalVideoFeedItem[];
  next_cursor: string | null;
  city: string;
};
