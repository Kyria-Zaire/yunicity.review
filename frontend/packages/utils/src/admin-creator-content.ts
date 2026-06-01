/** Admin creator content moderation helpers (ADMIN-CREATOR-01). */

import type { PartnerCreatorContentStatus } from "@yunicity/types";

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
