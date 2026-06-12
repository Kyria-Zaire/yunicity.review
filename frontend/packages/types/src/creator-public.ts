/** Public creator hub types (FEATURE-CREATORS-V1 C1-01). */

export const CREATOR_CONTENT_TYPES = ["article", "photo"] as const;

export type CreatorContentType = (typeof CREATOR_CONTENT_TYPES)[number];

export const CREATOR_AUTHOR_KINDS = ["partner", "creator_profile"] as const;

export type CreatorContentAuthorKind = (typeof CREATOR_AUTHOR_KINDS)[number];

export type CreatorContentAuthor = {
  kind: CreatorContentAuthorKind;
  organization_id: string;
  display_name: string;
  slug: string;
};

export type CreatorPublicContent = {
  id: string;
  title: string;
  cover: string | null;
  content_type: CreatorContentType;
  city: string;
  published_at: string;
  body: string | null;
  author: CreatorContentAuthor;
};

export type CreatorPublicListParams = {
  city?: string;
  limit?: number;
  offset?: number;
};

export type CreatorPublicListResponse = {
  items: CreatorPublicContent[];
  total: number;
  limit: number;
  offset: number;
};

/** List card item — same shape as hub list entry (C1-02 related). */
export type CreatorPublicListItem = CreatorPublicContent;

export type CreatorPublicDetailResponse = CreatorPublicContent & {
  related: CreatorPublicListItem[];
};

export type CreatorPublicTerritory = {
  city: string;
  neighborhood_name: string | null;
};

export type CreatorPublicProfileStats = {
  published_content_count: number;
};

export type CreatorPublicProfile = {
  id: string;
  kind: CreatorContentAuthorKind;
  display_name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  territory: CreatorPublicTerritory;
  stats: CreatorPublicProfileStats;
  contents: CreatorPublicContent[];
  contents_total: number;
  contents_limit: number;
  contents_offset: number;
};

export type CreatorPublicProfileParams = {
  limit?: number;
  offset?: number;
};
