/** Admin passport ops (ADMIN-03A / 03C). */

import type { PassportTierCode } from "./passport";

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
