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
  event_type?: string;
  q?: string;
  page?: number;
  page_size?: number;
}

export interface LocalEventAdminSummaryResponse {
  city: string;
  generated_at: string;
  total: number;
  pending_review: number;
  published: number;
  upcoming_published: number;
  cancelled_or_archived: number;
  rejected: number;
}

export interface LocalEventAdminSummaryParams {
  city?: string;
}

export interface LocalEventRejectPayload {
  reason: string;
}

export interface LocalEventCancelPayload {
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
  cancelled_at: string | null;
  cancelled_by_user_id: string | null;
  interest_count: number;
  rejection_reason?: string | null;
  organization: AdminLocalEventOrganizationDetail | null;
  created_at: string;
  updated_at: string;
}

export type AdminLocalEventAction = "approve" | "reject" | "cancel";

export interface AdminLocalEventActorSummary {
  id: string;
  email: string;
  display_name: string | null;
}

export interface AdminLocalEventActionItem {
  id: string;
  action: AdminLocalEventAction;
  previous_status: string | null;
  new_status: string | null;
  reason: string | null;
  actor_user: AdminLocalEventActorSummary;
  created_at: string;
}

export interface AdminLocalEventActionListResponse {
  items: AdminLocalEventActionItem[];
  total: number;
  page: number;
  page_size: number;
}

export interface AdminLocalEventActionListParams {
  page?: number;
  page_size?: number;
}
