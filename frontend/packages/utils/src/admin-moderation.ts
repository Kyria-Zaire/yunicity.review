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

/** ADMIN-07C aliases (stable names for detail workspace). */
export const reportStatusLabel = adminReportStatusLabel;
export const reportReasonLabel = adminReportReasonLabel;
export const targetTypeLabel = adminReportTargetTypeLabel;
export const formatReportDate = formatModerationDate;
export const shortReportId = truncateReportId;
export const buildModerationReportDetailPath = buildModerationDetailPath;

const MODERATION_LIST_QUERY_KEYS = ["status", "reason", "page", "page_size"] as const;

export function buildModerationListBackPath(
  listQuery?: URLSearchParams | string | null,
): string {
  if (!listQuery) {
    return buildModerationListPath();
  }
  const params =
    typeof listQuery === "string" ? new URLSearchParams(listQuery) : listQuery;
  const record: Record<string, string | undefined> = {};
  for (const key of MODERATION_LIST_QUERY_KEYS) {
    const value = params.get(key);
    if (value?.trim()) {
      record[key] = value.trim();
    }
  }
  return buildModerationListPath(record);
}

const REPORT_AUTHOR_TYPE_LABELS: Record<string, string> = {
  citizen: "Citoyen",
  partner: "Partenaire",
  organization: "Organisation",
};

export function adminReportAuthorLabel(authorType: string, authorId: string): string {
  const typeLabel = REPORT_AUTHOR_TYPE_LABELS[authorType] ?? authorType;
  return `${typeLabel} · ${shortReportId(authorId)}`;
}

export function adminReportSafetyGuidance(reason: AdminReportReason): string {
  const base = "Vérifiez le contenu et le contexte avant toute décision.";
  switch (reason) {
    case "spam":
      return `${base} Méfiez-vous des contenus répétitifs, promotionnels ou automatisés.`;
    case "inappropriate":
      return `${base} Évaluez le contenu signalé dans son contexte local et communautaire.`;
    case "other":
      return `${base} Le motif « autre » nécessite une lecture attentive du contexte.`;
    default:
      return base;
  }
}

export function isAdminReportTargetUnavailable(
  target: { is_active: boolean; title: string | null; body_excerpt: string | null },
): boolean {
  if (!target.is_active) {
    return true;
  }
  const hasTitle = Boolean(target.title?.trim());
  const hasBody = Boolean(target.body_excerpt?.trim());
  return !hasTitle && !hasBody;
}

/** No dedicated public post route in web V1 — feed-only. */
export function buildPublicPostUrl(postId: string, webBase?: string | null): string | null {
  void postId;
  void webBase;
  return null;
}
