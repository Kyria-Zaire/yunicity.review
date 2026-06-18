import type { PartnerOfferType } from "./passport";
import type { PartnerOfferReadinessFields, PartnerOfferReadinessLevel } from "./partner-offer-readiness";
import type { OfferRedemptionStatus } from "./passport";
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
  value_label?: string | null;
  conditions?: string | null;
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
  readiness: PartnerOfferReadinessFields;
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
  q?: string;
  readiness?: PartnerOfferReadinessLevel;
  page?: number;
  page_size?: number;
}

export interface PartnerOfferAdminSummaryResponse {
  city: string;
  generated_at: string;
  total: number;
  pending_review: number;
  published: number;
  draft: number;
  rejected: number;
  archived: number;
  contributor_partners: number;
  expired_or_inactive: number;
}

export interface PartnerOfferAdminSummaryParams {
  city?: string;
}

export type AdminOfferRedemptionChannel = "self" | "scan" | "unknown";

export interface AdminOfferRedemptionPassport {
  id: string;
  passport_number: string;
}

export interface AdminOfferRedemptionCitizen {
  id: string;
  display_name: string | null;
  email: string;
}

export interface PartnerOfferAdminRedemptionItem {
  id: string;
  passport: AdminOfferRedemptionPassport;
  citizen: AdminOfferRedemptionCitizen;
  channel: AdminOfferRedemptionChannel;
  status: OfferRedemptionStatus;
  redeemed_at: string | null;
}

export interface PartnerOfferAdminRedemptionListResponse {
  items: PartnerOfferAdminRedemptionItem[];
  total: number;
  page: number;
  page_size: number;
}

export interface PartnerOfferAdminRedemptionListParams {
  page?: number;
  page_size?: number;
}

export type AdminPartnerOfferAction = "approve" | "reject" | "archive";

export interface AdminPartnerOfferActorSummary {
  id: string;
  email: string;
  display_name: string | null;
}

export interface AdminPartnerOfferActionItem {
  id: string;
  action: AdminPartnerOfferAction;
  previous_status: string | null;
  new_status: string | null;
  reason: string | null;
  actor_user: AdminPartnerOfferActorSummary;
  created_at: string;
}

export interface AdminPartnerOfferActionListResponse {
  items: AdminPartnerOfferActionItem[];
  total: number;
  page: number;
  page_size: number;
}

export interface PartnerOfferAdminActionListParams {
  page?: number;
  page_size?: number;
}
