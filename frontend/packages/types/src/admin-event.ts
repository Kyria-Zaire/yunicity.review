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
