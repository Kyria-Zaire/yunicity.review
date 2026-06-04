/** Admin citizen reports workspace helpers (ADMIN-07B). */

import type {
  AdminReportListItem,
  AdminReportReason,
  AdminReportStatus,
  AdminReportStatusSummary,
  AdminReportTargetType,
} from "@yunicity/types";

export const MODERATION_DEFAULT_PAGE_SIZE = 20;
export const MODERATION_MAX_PAGE_SIZE = 50;

export type AdminReportStatusFilter = "" | AdminReportStatus | "all";
export type AdminReportReasonFilter = "" | AdminReportReason;

export const ADMIN_REPORT_STATUS_FILTER_OPTIONS: {
  value: AdminReportStatusFilter;
  label: string;
}[] = [
  { value: "pending", label: "En attente" },
  { value: "all", label: "Tous les statuts" },
  { value: "reviewed", label: "Examinés" },
  { value: "action_taken", label: "Action prise" },
  { value: "dismissed", label: "Classés sans suite" },
];

export const ADMIN_REPORT_REASON_FILTER_OPTIONS: {
  value: AdminReportReasonFilter;
  label: string;
}[] = [
  { value: "", label: "Tous les motifs" },
  { value: "spam", label: "Spam" },
  { value: "inappropriate", label: "Contenu inapproprié" },
  { value: "other", label: "Autre" },
];

export const ADMIN_REPORT_STATUS_LABELS: Record<AdminReportStatus, string> = {
  pending: "En attente",
  reviewed: "Examiné",
  dismissed: "Classé sans suite",
  action_taken: "Action prise",
};

export const ADMIN_REPORT_REASON_LABELS: Record<AdminReportReason, string> = {
  spam: "Spam",
  inappropriate: "Contenu inapproprié",
  other: "Autre",
};

export const ADMIN_REPORT_TARGET_TYPE_LABELS: Record<AdminReportTargetType, string> = {
  post: "Publication",
  offer: "Offre (feed)",
  event: "Événement (feed)",
  partner_creator: "Contenu créateur (feed)",
};

export function adminReportStatusLabel(status: AdminReportStatus | string): string {
  if (status in ADMIN_REPORT_STATUS_LABELS) {
    return ADMIN_REPORT_STATUS_LABELS[status as AdminReportStatus];
  }
  return status;
}

export function adminReportReasonLabel(reason: AdminReportReason | string): string {
  if (reason in ADMIN_REPORT_REASON_LABELS) {
    return ADMIN_REPORT_REASON_LABELS[reason as AdminReportReason];
  }
  return reason;
}

export function adminReportTargetTypeLabel(type: AdminReportTargetType | string): string {
  if (type in ADMIN_REPORT_TARGET_TYPE_LABELS) {
    return ADMIN_REPORT_TARGET_TYPE_LABELS[type as AdminReportTargetType];
  }
  return type;
}

export function adminReportReporterLabel(
  reporter: { email: string; display_name: string | null },
): string {
  if (reporter.display_name?.trim()) {
    return reporter.display_name.trim();
  }
  return reporter.email;
}

export function buildModerationListPath(query?: Record<string, string | undefined>): string {
  if (!query) {
    return "/moderation?status=pending";
  }
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value?.trim()) {
      search.set(key, value.trim());
    }
  }
  const qs = search.toString();
  return qs ? `/moderation?${qs}` : "/moderation?status=pending";
}

export function buildModerationDetailPath(reportId: string, listQuery?: URLSearchParams): string {
  const base = `/moderation/${encodeURIComponent(reportId)}`;
  const qs = listQuery?.toString();
  return qs ? `${base}?${qs}` : base;
}

export function formatModerationDate(iso: string | null | undefined): string {
  if (!iso) {
    return "—";
  }
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function truncateReportId(id: string): string {
  return id.length > 8 ? `${id.slice(0, 8)}…` : id;
}
