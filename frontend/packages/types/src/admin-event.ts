/** Admin local events workspace types (ADMIN-05B). */

import type { LocalEventManagement, LocalEventManagementListResponse } from "./local-event";

export type AdminEventModerationStatus = "pending_review" | "approved" | "rejected";

export type AdminEventModerationStatusFilter = "" | AdminEventModerationStatus;

export type AdminLocalEventListItem = LocalEventManagement;

export type AdminLocalEventListResponse = LocalEventManagementListResponse;

export interface AdminLocalEventListParams {
  /** Query param `status` on GET /admin/local-events (moderation_status). */
  status?: AdminEventModerationStatus;
  city?: string;
  page?: number;
  page_size?: number;
}

export interface LocalEventRejectPayload {
  reason: string;
}

export interface AdminLocalEventOrganizationDetail {
  id: string;
  name: string;
  slug: string;
  verification_status: string;
  visibility: string;
}

/** Staff event detail (GET /admin/local-events/{id}, ADMIN-05C). */
export interface AdminLocalEventDetail {
  id: string;
  title: string;
  description: string | null;
  city: string;
  location_name: string;
  address: string | null;
  starts_at: string;
  ends_at: string | null;
  timezone: string;
  visibility: string;
  moderation_status: AdminEventModerationStatus | string;
  is_cancelled: boolean;
  interest_count: number;
  rejection_reason?: string | null;
  organization: AdminLocalEventOrganizationDetail | null;
  created_at: string;
  updated_at: string;
}
