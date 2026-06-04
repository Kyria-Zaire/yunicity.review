/** Admin passport ops (ADMIN-03A / 03C). */

import type { OfferRedemptionStatus, PassportStampSource, PassportTierCode } from "./passport";

export type AdminPassportStatus = "active" | "suspended";

export type AdminPassportSearchMode =
  | "email"
  | "passport_number"
  | "display_name"
  | "qr_fragment";

export interface AdminPassportUserSummary {
  id: string;
  email: string;
  display_name: string | null;
}

export interface AdminPassportListItem {
  id: string;
  passport_number: string;
  city: string;
  status: AdminPassportStatus;
  tier_code: PassportTierCode;
  user: AdminPassportUserSummary;
  stamps_count: number;
  redemptions_count: number;
  activated_at: string | null;
  suspended_at: string | null;
  created_at: string;
}

export interface AdminPassportListParams {
  city?: string;
  status?: AdminPassportStatus;
  q?: string;
  search_mode?: AdminPassportSearchMode;
  page?: number;
  page_size?: number;
}

export interface AdminPassportListResponse {
  items: AdminPassportListItem[];
  total: number;
  page: number;
  page_size: number;
}

export interface AdminPassportTierDetail {
  code: PassportTierCode;
  label: string;
}

export interface AdminPassportDetailUser {
  id: string;
  email: string;
  display_name: string | null;
  is_active: boolean;
}

export interface AdminPassportDetailStats {
  stamps_total: number;
  redemptions_total: number;
  redemptions_completed: number;
}

export interface AdminPassportStatusPatchPayload {
  status: AdminPassportStatus;
  reason: string;
}

export interface AdminPassportDetailResponse {
  id: string;
  passport_number: string;
  city: string;
  status: AdminPassportStatus;
  qr_token: string;
  tier: AdminPassportTierDetail;
  user: AdminPassportDetailUser;
  stats: AdminPassportDetailStats;
  activated_at: string | null;
  suspended_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminPassportSubresourceListParams {
  page?: number;
  page_size?: number;
}

export interface AdminPassportStampItem {
  id: string;
  organization_id: string;
  organization_name: string;
  stamp_source: PassportStampSource;
  stamped_at: string;
  created_at: string;
}

export interface AdminPassportStampListResponse {
  items: AdminPassportStampItem[];
  total: number;
  page: number;
  page_size: number;
}

export interface AdminPassportRedemptionItem {
  id: string;
  offer_id: string;
  offer_title: string;
  organization_id: string;
  organization_name: string;
  status: OfferRedemptionStatus;
  redeemed_at: string | null;
  created_at: string;
}

export interface AdminPassportRedemptionListResponse {
  items: AdminPassportRedemptionItem[];
  total: number;
  page: number;
  page_size: number;
}
