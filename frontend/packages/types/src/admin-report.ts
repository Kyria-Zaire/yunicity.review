/** Admin citizen reports read types (ADMIN-07B). */

export type AdminReportStatus = "pending" | "reviewed" | "dismissed" | "action_taken";
export type AdminReportReason = "spam" | "inappropriate" | "other";
export type AdminReportTargetType = "post" | "offer" | "event" | "partner_creator";

export interface AdminReportReporterSummary {
  id: string;
  email: string;
  display_name: string | null;
}

export interface AdminReportListItem {
  id: string;
  reason: AdminReportReason;
  status: AdminReportStatus;
  reporter: AdminReportReporterSummary;
  target_type: AdminReportTargetType;
  target_id: string;
  created_at: string;
}

export interface AdminReportStatusSummary {
  total: number;
  pending: number;
  resolved: number;
  dismissed: number;
}

export interface AdminReportListResponse {
  items: AdminReportListItem[];
  total: number;
  page: number;
  page_size: number;
  summary: AdminReportStatusSummary;
}

export interface AdminReportListParams {
  status?: AdminReportStatus | "all";
  reason?: AdminReportReason;
  page?: number;
  page_size?: number;
}

export interface AdminReportResolverSummary {
  id: string;
  email: string;
  display_name: string | null;
}

export interface AdminReportTargetPostSummary {
  id: string;
  type: AdminReportTargetType;
  title: string | null;
  body_excerpt: string | null;
  is_active: boolean;
  author_type: string;
  author_id: string;
  city: string | null;
}

export interface AdminReportDetailResponse {
  id: string;
  reason: AdminReportReason;
  status: AdminReportStatus;
  created_at: string;
  resolved_at: string | null;
  resolution_note: string | null;
  reporter: AdminReportReporterSummary;
  resolver: AdminReportResolverSummary | null;
  target_type: AdminReportTargetType;
  target_id: string;
  target_post: AdminReportTargetPostSummary;
}

export interface AdminReportDismissPayload {
  reason?: string | null;
}

export interface AdminReportResolvePayload {
  reason?: string | null;
  hide_post: boolean;
}
