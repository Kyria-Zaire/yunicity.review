import type { PartnerOfferType } from "./passport";

export type PartnerOfferStatus =
  | "draft"
  | "pending_review"
  | "published"
  | "rejected"
  | "archived";

export interface PartnerOfferManagement {
  id: string;
  organization_id: string;
  title: string;
  description: string | null;
  offer_type: PartnerOfferType;
  offer_status: PartnerOfferStatus;
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
}

export interface PartnerOfferManagementListResponse {
  items: PartnerOfferManagement[];
  total: number;
  page: number;
  page_size: number;
}

export interface PartnerOfferCreatePayload {
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

export interface PartnerOfferUpdatePayload {
  title?: string;
  description?: string | null;
  offer_type?: PartnerOfferType;
  valid_from?: string | null;
  valid_until?: string | null;
  redemption_limit?: number;
  max_redemptions_total?: number | null;
  tier_code_required?: string | null;
}

export interface PartnerOfferListParams {
  organization_id?: string;
  status?: PartnerOfferStatus;
  offer_type?: PartnerOfferType;
  page?: number;
  page_size?: number;
}
