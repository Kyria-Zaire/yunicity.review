/** Local Video V2 — types API (FEATURE-CREATORS-V2 / VIDEO-04A). */

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

/** Pipeline worker (VIDEO-03A) — aligné backend `LocalVideoProcessingStatus`. */
export type LocalVideoProcessingStatusId =
  | "uploaded"
  | "processing"
  | "ready"
  | "failed";

export type LocalVideoContentType = "video/mp4" | "video/quicktime";

export const LOCAL_VIDEO_MAX_BYTES = 52_428_800;
export const LOCAL_VIDEO_MAX_DURATION_SECONDS = 90;
export const LOCAL_VIDEO_ALLOWED_CONTENT_TYPES: readonly LocalVideoContentType[] = [
  "video/mp4",
  "video/quicktime",
] as const;

export type LocalVideoAuthor = {
  id: string;
  username: string | null;
  full_name: string;
  avatar_url: string | null;
};

/** Détail vidéo — `GET /local-videos/{id}` (`LocalVideoItem` backend). */
export type LocalVideo = {
  id: string;
  author_user_id: string;
  city: string;
  neighborhood_id: string;
  video_type: LocalVideoTypeId;
  title: string | null;
  description: string | null;
  cultural_place_id: string | null;
  local_event_id: string | null;
  tribe_id: string | null;
  organization_id: string | null;
  media_url: string;
  thumbnail_url: string;
  duration_seconds: number;
  file_size_bytes: number;
  mime_type: string;
  latitude: number | null;
  longitude: number | null;
  status: LocalVideoStatusId;
  processing_status: LocalVideoProcessingStatusId;
  processing_error: string | null;
  published_at: string | null;
  created_at: string;
};

/** Session upload — `POST /local-videos/upload-init` (`LocalVideoUploadInitResponse`). */
export type LocalVideoUpload = {
  upload_id: string;
  presigned_url: string;
  storage_key: string;
  expires_at: string;
  upload_method: string;
  upload_headers: Record<string, string>;
};

export type LocalVideoUploadInitPayload = {
  filename: string;
  content_type: LocalVideoContentType;
  file_size_bytes: number;
  city?: string;
  neighborhood_id?: string;
  organization_id?: string;
};

export type LocalVideoPublishPayload = {
  upload_id: string;
  city?: string;
  neighborhood_id: string;
  video_type: LocalVideoTypeId;
  title?: string | null;
  description?: string | null;
  cultural_place_id?: string | null;
  local_event_id?: string | null;
  tribe_id?: string | null;
  organization_id?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

/** Réponse publish — HTTP 202 (`LocalVideoPublishAcceptedResponse`). */
export type LocalVideoPublishAcceptedResponse = {
  id: string;
  status: LocalVideoStatusId;
  processing_status: LocalVideoProcessingStatusId;
  job_id: string;
  message: string;
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
  view_count: number;
  liked_by_me: boolean;
};

export type LocalVideoLikeResponse = {
  liked: boolean;
  like_count: number;
};

export type LocalVideoComment = {
  id: string;
  video_id: string;
  author_user_id: string;
  author_display_name: string;
  author_username: string | null;
  body: string;
  created_at: string;
  updated_at: string;
};

export type LocalVideoCommentListResponse = {
  items: LocalVideoComment[];
  next_cursor: string | null;
};

export type LocalVideoCommentCreatePayload = {
  body: string;
};

export type LocalVideoReportReason =
  | "spam"
  | "harassment"
  | "hate"
  | "violence"
  | "sexual"
  | "copyright"
  | "other";

export type LocalVideoReportCreatePayload = {
  reason: LocalVideoReportReason;
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

/** Codes d'erreur API Local Video connus (backend `AppError.code`). */
export type LocalVideoErrorCode =
  | "LOCAL_VIDEO_INVALID_CONTENT"
  | "LOCAL_VIDEO_INVALID_TYPE"
  | "LOCAL_VIDEO_TOO_LARGE"
  | "LOCAL_VIDEO_SIZE_MISMATCH"
  | "LOCAL_VIDEO_UPLOAD_EXPIRED"
  | "LOCAL_VIDEO_UPLOAD_MISSING"
  | "LOCAL_VIDEO_UPLOAD_NOT_AVAILABLE"
  | "LOCAL_VIDEO_UPLOAD_ALREADY_USED"
  | "LOCAL_VIDEO_UPLOAD_NOT_FOUND"
  | "LOCAL_VIDEO_FORBIDDEN"
  | "LOCAL_VIDEO_NOT_FOUND"
  | "LOCAL_VIDEO_INVALID_NEIGHBORHOOD"
  | "LOCAL_VIDEO_CITY_MISMATCH"
  | "LOCAL_VIDEO_CITY_SLUG_MISMATCH"
  | "LOCAL_VIDEO_INVALID_MEDIA"
  | "LOCAL_VIDEO_TOO_LONG"
  | "LOCAL_VIDEO_TRANSCODE_FAILED"
  | "LOCAL_VIDEO_THUMBNAIL_FAILED"
  | "LOCAL_VIDEO_BINARY_ENDPOINT_UNAVAILABLE"
  | "LOCAL_VIDEO_PROCESSING_TIMEOUT"
  | "RATE_LIMITED"
  | "UNKNOWN_ERROR";
