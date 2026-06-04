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

export type PartnerCreatorContentAuthorSummary = {
  id: string;
  email: string | null;
  display_name: string | null;
};

/** Staff moderation queue (ADMIN-CREATOR-01). */
export type PartnerCreatorContentAdmin = PartnerCreatorContentManagement & {
  author: PartnerCreatorContentAuthorSummary | null;
  submitted_at: string | null;
};

export type PartnerCreatorContentAdminListResponse = {
  items: PartnerCreatorContentAdmin[];
  total: number;
  page: number;
  page_size: number;
};

export type PartnerCreatorContentAdminListParams = {
  status?: PartnerCreatorContentStatus;
  sort?: "newest" | "oldest";
  page?: number;
  page_size?: number;
};

export type PartnerCreatorContentRejectPayload = {
  reason: string;
};

export type AdminCreatorContentAction = "approve" | "reject" | "archive";

export interface AdminCreatorContentActionActor {
  id: string;
  email: string;
  display_name: string | null;
}

export interface AdminCreatorContentActionItem {
  id: string;
  action: AdminCreatorContentAction;
  previous_status: string | null;
  new_status: string | null;
  reason: string | null;
  actor_user: AdminCreatorContentActionActor;
  created_at: string;
}

export interface AdminCreatorContentActionListResponse {
  items: AdminCreatorContentActionItem[];
  total: number;
  page: number;
  page_size: number;
}

export type PartnerCreatorContentAdminActionListParams = {
  page?: number;
  page_size?: number;
};

export type PartnerCreatorContentPublicListResponse = {
  items: PartnerCreatorContentPublic[];
  total: number;
  limit: number;
  offset: number;
};
