/** Admin organization verification queue (ADMIN-02B1 / 02B2). */

import type { OrganizationType, OrganizationVisibility, VerificationStatus } from "./organization";
import type { PartnerStatus, PartnershipType } from "./partner";

export interface AdminOrganizationListItem {
  id: string;
  name: string;
  slug: string;
  type: OrganizationType;
  city: string;
  visibility: OrganizationVisibility;
  verification_status: VerificationStatus;
  created_at: string;
  updated_at: string;
  partner_status: PartnerStatus | null;
  partnership_type: PartnershipType | null;
}

export interface AdminOrganizationListParams {
  city?: string;
  verification_status?: VerificationStatus;
  page?: number;
  page_size?: number;
}

export interface AdminOrganizationListResponse {
  items: AdminOrganizationListItem[];
  total: number;
  page: number;
  page_size: number;
}

export interface OrganizationReviewPayload {
  decision: VerificationStatus;
  method?: "manual" | "email_domain" | "document" | "phone" | "video" | "postcard" | "trusted_partner";
  reason?: string | null;
}

export interface OrganizationReviewResponse {
  id: string;
  slug: string;
  name: string;
  verification_status: VerificationStatus;
  visibility: OrganizationVisibility;
}
