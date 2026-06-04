import type { AdminEventModerationStatus, AdminEventModerationStatusFilter } from "@yunicity/types";
import { DEFAULT_ADMIN_EVENTS_CITY } from "@yunicity/utils";

export const EVENTS_DEFAULT_PAGE_SIZE = 20;
export const EVENTS_MAX_PAGE_SIZE = 50;

export interface AdminEventsListState {
  status: AdminEventModerationStatusFilter;
  city: string;
  page: number;
  pageSize: number;
}

const MODERATION_STATUSES: AdminEventModerationStatus[] = [
  "pending_review",
  "approved",
  "rejected",
];

function parseStatus(raw: string | null): AdminEventModerationStatusFilter {
  if (raw === "all") {
    return "";
  }
  if (raw && MODERATION_STATUSES.includes(raw as AdminEventModerationStatus)) {
    return raw as AdminEventModerationStatus;
  }
  if (raw === null) {
    return "pending_review";
  }
  return "";
}

function parsePage(raw: string | null): number {
  const value = Number(raw ?? "1");
  return Number.isFinite(value) && value >= 1 ? Math.floor(value) : 1;
}

function parsePageSize(raw: string | null): number {
  const value = Number(raw ?? String(EVENTS_DEFAULT_PAGE_SIZE));
  if (!Number.isFinite(value) || value < 1) {
    return EVENTS_DEFAULT_PAGE_SIZE;
  }
  return Math.min(Math.floor(value), EVENTS_MAX_PAGE_SIZE);
}

export function parseEventsSearchParams(params: URLSearchParams): AdminEventsListState {
  const city = params.get("city")?.trim() || DEFAULT_ADMIN_EVENTS_CITY;
  return {
    status: parseStatus(params.get("status")),
    city,
    page: parsePage(params.get("page")),
    pageSize: parsePageSize(params.get("page_size")),
  };
}

export function eventsStateToSearchParams(state: AdminEventsListState): URLSearchParams {
  const params = new URLSearchParams();
  if (state.status) {
    params.set("status", state.status);
  } else if (state.page > 1 || state.city !== DEFAULT_ADMIN_EVENTS_CITY) {
    params.set("status", "all");
  }
  if (state.city && state.city !== DEFAULT_ADMIN_EVENTS_CITY) {
    params.set("city", state.city);
  }
  if (state.page > 1) {
    params.set("page", String(state.page));
  }
  if (state.pageSize !== EVENTS_DEFAULT_PAGE_SIZE) {
    params.set("page_size", String(state.pageSize));
  }
  return params;
}

export function toAdminLocalEventListParams(state: AdminEventsListState): {
  status?: AdminEventModerationStatus;
  city?: string;
  page: number;
  page_size: number;
} {
  return {
    status: state.status || undefined,
    city: state.city || undefined,
    page: state.page,
    page_size: state.pageSize,
  };
}
