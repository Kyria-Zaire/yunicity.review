/** Admin partner detail read API (ADMIN-02D1 / 02D2). */

import type {
  OrganizationType,
  OrganizationVisibility,
  VerificationStatus,
} from "./organization";
import type { PartnerStatus, PartnershipType } from "./partner";

export interface AdminPartnerOrganizationDetail {
  id: string;
  name: string;
  slug: string;
  type: OrganizationType;
  city: string;
  visibility: OrganizationVisibility;
  verification_status: VerificationStatus;
  created_at: string;
  updated_at: string;
}

export interface AdminPartnerProfileDetail {
  partner_status: PartnerStatus;
  partnership_type: PartnershipType;
  is_featured: boolean;
  signed_at: string | null;
  activated_at: string | null;
}

export interface AdminPartnerCounters {
  offers_total: number;
  offers_pending: number;
  offers_published: number;
  creator_contents_total: number;
  creator_contents_pending: number;
  events_total: number;
  events_pending: number;
  stamps_total: number;
  redemptions_total: number;
  redemptions_completed: number;
}

export interface AdminPartnerLinks {
  public_place_slug: string;
  organization_id: string;
  offers_admin: string;
  creator_content_admin: string;
  verification_queue: string;
}

export interface AdminPartnerCapabilities {
  can_activate: boolean;
  can_pause: boolean;
  can_upgrade_premium: boolean;
  can_create_profile: boolean;
}

export interface AdminPartnerDetailResponse {
  organization: AdminPartnerOrganizationDetail;
  partner_profile: AdminPartnerProfileDetail | null;
  counters: AdminPartnerCounters;
  links: AdminPartnerLinks;
  capabilities: AdminPartnerCapabilities;
}
