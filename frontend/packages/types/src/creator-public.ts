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
