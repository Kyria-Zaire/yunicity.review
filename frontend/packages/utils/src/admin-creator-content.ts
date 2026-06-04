/** Admin creator content moderation helpers (ADMIN-CREATOR-01 / ADMIN-06B / ADMIN-06C). */

import type {
  AdminCreatorContentAction,
  PartnerCreatorContentAdmin,
  PartnerCreatorContentStatus,
} from "@yunicity/types";

import { buildPublicPlaceHref } from "./place-routing";
import { formatPassportDate } from "./passport-labels";
import { adminPartnerDetailPath } from "./admin-partner";

export const ADMIN_CREATOR_CONTENT_TYPE_LABEL = "Contenu éditorial partenaire";

/** Confirmé dans PartnerCreatorContentService.approve_content (org.visibility = PUBLIC). */
export const CREATOR_CONTENT_APPROVE_FORCES_ORG_PUBLIC = true;

export const creatorContentApproveSideEffectCopy =
  "L'approbation staff publie le contenu, synchronise le feed local et peut forcer l'organisation en visibilité publique (règle backend actuelle).";

export const creatorContentApproveSideEffectWarningCopy =
  "Attention : approuver ce contenu peut rendre l'organisation publique si le backend applique organization.visibility = PUBLIC.";

export const creatorContentFeedSyncCopy =
  "La publication peut apparaître dans le feed local (type partner_creator) après validation staff.";

export const creatorContentMediaPreviewDisclaimerCopy =
  "Aperçu staff — les médias externes peuvent être indisponibles.";

export const CREATOR_CONTENT_DEFAULT_PAGE_SIZE = 20;
export const CREATOR_CONTENT_MAX_PAGE_SIZE = 100;

export const CREATOR_CONTENT_LIST_CONTEXT_KEYS = [
  "status",
  "organization_id",
  "page",
  "page_size",
] as const;

export const ADMIN_CREATOR_CONTENT_STATUS_LABELS: Record<PartnerCreatorContentStatus, string> = {
  draft: "Brouillon",
  pending_review: "En attente de validation",
  published: "Publié",
  rejected: "Refusé",
  archived: "Archivé",
};

export const ADMIN_CREATOR_CONTENT_STATUS_TONES: Record<
  PartnerCreatorContentStatus,
  { bg: string; text: string; border: string }
> = {
  draft: { bg: "#f5f5f4", text: "#57534e", border: "#e7e5e4" },
  pending_review: { bg: "#fef3c7", text: "#92400e", border: "#fde68a" },
  published: { bg: "#d1fae5", text: "#065f46", border: "#a7f3d0" },
  rejected: { bg: "#fee2e2", text: "#991b1b", border: "#fecaca" },
  archived: { bg: "#f3f4f6", text: "#4b5563", border: "#e5e7eb" },
};

export type AdminCreatorContentStatusFilter = "" | PartnerCreatorContentStatus;

export type AdminCreatorContentSort = "newest" | "oldest";

export const ADMIN_CREATOR_CONTENT_STATUS_FILTER_OPTIONS: {
  value: AdminCreatorContentStatusFilter;
  label: string;
}[] = [
  { value: "", label: "Tous les statuts" },
  { value: "pending_review", label: "En attente de validation" },
  { value: "draft", label: "Brouillons" },
  { value: "published", label: "Publiés" },
  { value: "rejected", label: "Refusés" },
  { value: "archived", label: "Archivés" },
];

export function adminCreatorContentStatusLabel(status: PartnerCreatorContentStatus): string {
  return ADMIN_CREATOR_CONTENT_STATUS_LABELS[status] ?? status;
}

/** Alias produit (KPI « approuvé » = statut `published`). */
export function creatorContentStatusLabel(status: PartnerCreatorContentStatus | string): string {
  if (status === "published") {
    return "Approuvé";
  }
  if (status in ADMIN_CREATOR_CONTENT_STATUS_LABELS) {
    return ADMIN_CREATOR_CONTENT_STATUS_LABELS[status as PartnerCreatorContentStatus];
  }
  return status;
}

export function creatorContentStatusBadgeVariant(
  status: PartnerCreatorContentStatus | string,
): keyof typeof ADMIN_CREATOR_CONTENT_STATUS_TONES | "unknown" {
  if (status in ADMIN_CREATOR_CONTENT_STATUS_TONES) {
    return status as keyof typeof ADMIN_CREATOR_CONTENT_STATUS_TONES;
  }
  return "unknown";
}

export function buildCreatorContentListPath(query?: Record<string, string | undefined>): string {
  if (!query) {
    return "/creator-content";
  }
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value?.trim()) {
      search.set(key, value.trim());
    }
  }
  const qs = search.toString();
  return qs ? `/creator-content?${qs}` : "/creator-content";
}

export function buildCreatorContentDetailPath(contentId: string): string {
  return `/creator-content/${encodeURIComponent(contentId)}`;
}

export function buildCreatorContentDetailPathWithListContext(
  contentId: string,
  listQuery: URLSearchParams,
): string {
  const base = buildCreatorContentDetailPath(contentId);
  const qs = listQuery.toString();
  return qs ? `${base}?${qs}` : base;
}

export function buildCreatorContentPublicPath(
  slug: string,
  city: string,
  webAppBaseUrl?: string,
): string {
  const path = buildPublicPlaceHref(slug, city);
  const base = webAppBaseUrl?.replace(/\/$/, "") ?? "";
  return base ? `${base}${path}` : path;
}

export function buildCreatorContentOrganizationAdminPath(organizationId: string): string {
  return adminPartnerDetailPath(organizationId);
}

export function buildCreatorContentListBackPath(detailSearchParams: URLSearchParams): string {
  const query: Record<string, string> = {};
  for (const key of CREATOR_CONTENT_LIST_CONTEXT_KEYS) {
    const value = detailSearchParams.get(key);
    if (value) {
      query[key] = value;
    }
  }
  return buildCreatorContentListPath(query);
}

export type CreatorContentKpiCounts = {
  total: number;
  pendingReview: number;
  approved: number;
  rejected: number;
};

export function countCreatorContentKpis(
  items: Pick<PartnerCreatorContentAdmin, "status">[],
): CreatorContentKpiCounts {
  let pendingReview = 0;
  let approved = 0;
  let rejected = 0;
  for (const item of items) {
    if (item.status === "pending_review") {
      pendingReview += 1;
    } else if (item.status === "published") {
      approved += 1;
    } else if (item.status === "rejected") {
      rejected += 1;
    }
  }
  return {
    total: items.length,
    pendingReview,
    approved,
    rejected,
  };
}

export function adminCreatorContentAuthorLabel(
  author: { email: string | null; display_name: string | null } | null | undefined,
): string {
  if (!author) {
    return "—";
  }
  if (author.display_name?.trim()) {
    return author.display_name.trim();
  }
  if (author.email?.trim()) {
    return author.email.trim();
  }
  return "—";
}

export function adminCreatorContentExcerpt(body: string | null, maxLength = 120): string {
  if (!body?.trim()) {
    return "—";
  }
  const text = body.trim().replace(/\s+/g, " ");
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength)}…`;
}

export function canAdminApproveCreatorContent(status: PartnerCreatorContentStatus): boolean {
  return status === "pending_review";
}

export function canAdminRejectCreatorContent(status: PartnerCreatorContentStatus): boolean {
  return status === "pending_review" || status === "published";
}

export function canAdminArchiveCreatorContent(status: PartnerCreatorContentStatus): boolean {
  return status === "published";
}

/** Alias alignés ticket ADMIN-06C. */
export const canApproveCreatorContent = canAdminApproveCreatorContent;
export const canRejectCreatorContent = canAdminRejectCreatorContent;
export const canArchiveCreatorContent = canAdminArchiveCreatorContent;

export function creatorContentIsFeedDistributed(status: PartnerCreatorContentStatus): boolean {
  return status === "published";
}

export function creatorContentIsPartnerPageVisible(
  status: PartnerCreatorContentStatus,
  isActive: boolean,
): boolean {
  return status === "published" && isActive;
}

export function formatCreatorContentDate(iso: string | null | undefined): string {
  return formatPassportDate(iso);
}

export const CREATOR_CONTENT_ADMIN_ACTION_LABELS: Record<AdminCreatorContentAction, string> = {
  approve: "Approbation",
  reject: "Rejet",
  archive: "Archivage",
};

export function creatorContentAdminActionLabel(action: AdminCreatorContentAction): string {
  return CREATOR_CONTENT_ADMIN_ACTION_LABELS[action] ?? action;
}

function creatorContentStaffStatusLabel(status: string | null | undefined): string {
  if (!status) {
    return "—";
  }
  if (status in ADMIN_CREATOR_CONTENT_STATUS_LABELS) {
    return adminCreatorContentStatusLabel(status as PartnerCreatorContentStatus);
  }
  return status;
}

export function formatCreatorContentAdminActionStatusTransition(
  previousStatus: string | null,
  newStatus: string | null,
): string {
  return `${creatorContentStaffStatusLabel(previousStatus)} → ${creatorContentStaffStatusLabel(newStatus)}`;
}

export function formatCreatorContentPublishedAt(
  content: Pick<PartnerCreatorContentAdmin, "status" | "submitted_at" | "updated_at">,
): string {
  if (content.status !== "published") {
    return "—";
  }
  const iso = content.submitted_at ?? content.updated_at;
  return formatCreatorContentDate(iso);
}

export function isCreatorContentMediaImageUrl(mediaUrl: string | null | undefined): boolean {
  if (!mediaUrl?.trim()) {
    return false;
  }
  return /\.(png|jpe?g|gif|webp)(\?|$)/i.test(mediaUrl.trim());
}

export function shouldShowCreatorContentApproveSideEffectWarning(
  status: PartnerCreatorContentStatus,
): boolean {
  return CREATOR_CONTENT_APPROVE_FORCES_ORG_PUBLIC && canAdminApproveCreatorContent(status);
}
