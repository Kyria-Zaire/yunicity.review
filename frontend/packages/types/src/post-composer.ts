/** Post composer types (FEED-POST-COMPOSER-01). */

export type PostVisibilityId = "public" | "followers" | "close_friends" | "custom";

export type PostFormatId = "photo" | "video" | "text" | "poll" | "location";

export type PostMediaTypeId = "image" | "video";

export interface PostMediaItem {
  url: string;
  media_type: PostMediaTypeId;
}

export interface PostPollPayload {
  question: string;
  options: string[];
}

export interface PostCrossPostTargets {
  instagram: boolean;
  tiktok: boolean;
  facebook: boolean;
  twitter: boolean;
}

export interface PostComposerMeta {
  visibility: PostVisibilityId;
  post_format: PostFormatId | null;
  media_urls: PostMediaItem[];
  allow_comments: boolean;
  allow_shares: boolean;
  scheduled_at: string | null;
  location_label: string | null;
  activity_label: string | null;
  linked_tribe_id: string | null;
  tagged_user_ids: string[];
  audience_user_ids: string[];
  poll: PostPollPayload | null;
  cross_post_targets: PostCrossPostTargets | null;
  use_media_caption: boolean;
}

export interface PostCreatePayload {
  author_type?: "citizen";
  body: string;
  media_url?: string | null;
  media_urls?: PostMediaItem[];
  visibility?: PostVisibilityId;
  post_format?: PostFormatId | null;
  allow_comments?: boolean;
  allow_shares?: boolean;
  scheduled_at?: string | null;
  location_label?: string | null;
  activity_label?: string | null;
  linked_tribe_id?: string | null;
  tagged_user_ids?: string[];
  audience_user_ids?: string[];
  poll?: PostPollPayload | null;
  cross_post_targets?: PostCrossPostTargets | null;
  use_media_caption?: boolean;
  location?: { latitude: number; longitude: number } | null;
}

export interface PostMediaUploadResponse {
  url: string;
  media_type: PostMediaTypeId;
}
