import type { AdminReportReason, AdminReportStatus } from "@yunicity/types";
import {
  MODERATION_DEFAULT_PAGE_SIZE,
  MODERATION_MAX_PAGE_SIZE,
  type AdminReportReasonFilter,
  type AdminReportStatusFilter,
} from "@yunicity/utils";

export interface AdminModerationListState {
  status: AdminReportStatusFilter;
  reason: AdminReportReasonFilter;
  page: number;
  pageSize: number;
}

const REPORT_STATUSES: AdminReportStatus[] = [
  "pending",
  "reviewed",
  "dismissed",
  "action_taken",
];

const REPORT_REASONS: AdminReportReason[] = ["spam", "inappropriate", "other"];

function parseStatus(raw: string | null): AdminReportStatusFilter {
  if (raw === "all") {
    return "all";
  }
  if (raw && REPORT_STATUSES.includes(raw as AdminReportStatus)) {
    return raw as AdminReportStatus;
  }
  if (raw === null) {
    return "pending";
  }
  return "pending";
}

function parseReason(raw: string | null): AdminReportReasonFilter {
  if (raw && REPORT_REASONS.includes(raw as AdminReportReason)) {
    return raw as AdminReportReason;
  }
  return "";
}

function parsePage(raw: string | null): number {
  const value = Number(raw ?? "1");
  return Number.isFinite(value) && value >= 1 ? Math.floor(value) : 1;
}

function parsePageSize(raw: string | null): number {
  const value = Number(raw ?? String(MODERATION_DEFAULT_PAGE_SIZE));
  if (!Number.isFinite(value) || value < 1) {
    return MODERATION_DEFAULT_PAGE_SIZE;
  }
  return Math.min(Math.floor(value), MODERATION_MAX_PAGE_SIZE);
}

export function parseModerationSearchParams(params: URLSearchParams): AdminModerationListState {
  return {
    status: parseStatus(params.get("status")),
    reason: parseReason(params.get("reason")),
    page: parsePage(params.get("page")),
    pageSize: parsePageSize(params.get("page_size")),
  };
}

export function moderationStateToSearchParams(state: AdminModerationListState): URLSearchParams {
  const params = new URLSearchParams();
  if (state.status === "all") {
    params.set("status", "all");
  } else if (state.status && state.status !== "pending") {
    params.set("status", state.status);
  } else if (state.reason || state.page > 1) {
    params.set("status", "pending");
  }
  if (state.reason) {
    params.set("reason", state.reason);
  }
  if (state.page > 1) {
    params.set("page", String(state.page));
  }
  if (state.pageSize !== MODERATION_DEFAULT_PAGE_SIZE) {
    params.set("page_size", String(state.pageSize));
  }
  return params;
}

export function toAdminReportListParams(state: AdminModerationListState): {
  status?: AdminReportStatus | "all";
  reason?: AdminReportReason;
  page: number;
  page_size: number;
} {
  return {
    status: state.status || "pending",
    reason: state.reason || undefined,
    page: state.page,
    page_size: state.pageSize,
  };
}
