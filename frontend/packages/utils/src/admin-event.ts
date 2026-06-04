/** Admin local events workspace helpers (ADMIN-05B). */

import type { AdminEventModerationStatus, AdminEventModerationStatusFilter } from "@yunicity/types";

import { formatPassportDate } from "./passport-labels";

export const DEFAULT_ADMIN_EVENTS_CITY = "Reims";

export const ADMIN_EVENT_MODERATION_STATUS_LABELS: Record<AdminEventModerationStatus, string> = {
  pending_review: "En attente de validation",
  approved: "Approuvé",
  rejected: "Rejeté",
};

export const ADMIN_EVENT_VISIBILITY_LABELS: Record<"public", string> = {
  public: "Public",
};

export const ADMIN_EVENT_MODERATION_STATUS_FILTER_OPTIONS: {
  value: AdminEventModerationStatusFilter;
  label: string;
}[] = [
  { value: "pending_review", label: "En attente de validation" },
  { value: "approved", label: "Approuvés" },
  { value: "rejected", label: "Rejetés" },
  { value: "", label: "Tous les statuts" },
];

export function eventModerationStatusLabel(status: AdminEventModerationStatus | string): string {
  if (status in ADMIN_EVENT_MODERATION_STATUS_LABELS) {
    return ADMIN_EVENT_MODERATION_STATUS_LABELS[status as AdminEventModerationStatus];
  }
  return status;
}

export function eventVisibilityLabel(visibility: string | null | undefined): string {
  if (visibility === "public") {
    return ADMIN_EVENT_VISIBILITY_LABELS.public;
  }
  return visibility?.trim() ? visibility : "Public";
}

export function formatEventDate(iso: string | null | undefined): string {
  return formatPassportDate(iso);
}

export function buildAdminEventDetailPath(eventId: string): string {
  return `/events/${encodeURIComponent(eventId)}`;
}

export function buildEventsListPath(query?: Record<string, string | undefined>): string {
  if (!query) {
    return "/events";
  }
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value?.trim()) {
      search.set(key, value.trim());
    }
  }
  const qs = search.toString();
  return qs ? `/events?${qs}` : "/events";
}

export function buildEventDetailPathWithListContext(
  eventId: string,
  listQuery: URLSearchParams,
): string {
  const base = buildAdminEventDetailPath(eventId);
  const qs = listQuery.toString();
  return qs ? `${base}?${qs}` : base;
}

export function canAdminApproveEvent(status: string): boolean {
  return status === "pending_review";
}

export function canAdminRejectEvent(status: string): boolean {
  return status === "pending_review" || status === "approved";
}
