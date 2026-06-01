/** Partner creator content types (WEB-PARTNERS-06A). */

export const PARTNER_CREATOR_CONTENT_STATUSES = [
  "draft",
  "pending_review",
  "published",
  "rejected",
  "archived",
] as const;

export type PartnerCreatorContentStatus =
  (typeof PARTNER_CREATOR_CONTENT_STATUSES)[number];

export type PartnerCreatorContentOrganizationSummary = {
  id: string;
  slug: string;
  name: string;
  city: string;
};

export type PartnerCreatorContentManagement = {
  id: string;
  organization_id: string;
  organization: PartnerCreatorContentOrganizationSummary;
  title: string;
  body: string | null;
  media_url: string | null;
  status: PartnerCreatorContentStatus;
  is_active: boolean;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
};

export type PartnerCreatorContentCreatePayload = {
  organization_id: string;
  title: string;
  body?: string | null;
  media_url?: string | null;
};

export type PartnerCreatorContentUpdatePayload = {
  title?: string;
  body?: string | null;
  media_url?: string | null;
};

export type PartnerCreatorContentManagementListResponse = {
  items: PartnerCreatorContentManagement[];
  total: number;
  page: number;
  page_size: number;
};

export type PartnerCreatorContentPublic = {
  id: string;
  title: string;
  body: string | null;
  media_url: string | null;
  published_at: string;
};

export type PartnerCreatorContentListParams = {
  city?: string;
  limit?: number;
  offset?: number;
};

export type PartnerCreatorContentManagementListParams = {
  organization_id?: string;
  status?: PartnerCreatorContentStatus;
  page?: number;
  page_size?: number;
};

export type PartnerCreatorContentPublicListResponse = {
  items: PartnerCreatorContentPublic[];
  total: number;
  limit: number;
  offset: number;
};
