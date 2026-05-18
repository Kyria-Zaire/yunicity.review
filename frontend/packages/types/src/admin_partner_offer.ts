import type { PartnerOfferType } from "./passport";
import type { PartnerOfferStatus } from "./partner_offer_management";

/** Alias admin — même enum produit que self-service (TICKET-305A). */
export type PartnerOfferAdminStatus = PartnerOfferStatus;

export interface PartnerOfferAdminOrganization {
  id: string;
  slug: string;
  name: string;
  city: string;
  verification_status: string;
  visibility: string;
}

export interface PartnerOfferAdmin {
  id: string;
  organization_id: string;
  title: string;
  description: string | null;
  offer_type: PartnerOfferType;
  offer_status: PartnerOfferAdminStatus;
  is_active: boolean;
  tier_code_required: string | null;
  max_redemptions_total: number | null;
  redemption_limit: number;
  valid_from: string | null;
  valid_until: string | null;
  redemptions_count: number;
  created_by_user_id: string | null;
  moderated_by_user_id: string | null;
  moderated_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  organization: PartnerOfferAdminOrganization;
}

export interface PartnerOfferAdminListResponse {
  items: PartnerOfferAdmin[];
  total: number;
  page: number;
  page_size: number;
}

export interface PartnerOfferAdminCreatePayload {
  organization_id: string;
  title: string;
  description?: string | null;
  offer_type: PartnerOfferType;
  valid_from?: string | null;
  valid_until?: string | null;
  redemption_limit?: number;
  max_redemptions_total?: number | null;
  tier_code_required?: string | null;
}

export interface PartnerOfferAdminUpdatePayload {
  title?: string;
  description?: string | null;
  offer_type?: PartnerOfferType;
  valid_from?: string | null;
  valid_until?: string | null;
  redemption_limit?: number;
  max_redemptions_total?: number | null;
  tier_code_required?: string | null;
}

export interface PartnerOfferRejectPayload {
  reason: string;
}

export interface VerifiedOrganizationOption {
  id: string;
  slug: string;
  name: string;
  city: string;
  visibility: string;
}

export interface VerifiedOrganizationListResponse {
  items: VerifiedOrganizationOption[];
}

export interface PartnerOfferAdminListParams {
  status?: PartnerOfferAdminStatus;
  offer_type?: PartnerOfferType;
  organization_id?: string;
  page?: number;
  page_size?: number;
}
