/** Admin offers workspace helpers (ADMIN-04B). */

import type { AdminOfferStatus } from "@yunicity/types";

import { buildPassportOfferAdminPath } from "./admin-passport";
import { PARTNER_OFFER_STATUS_TONES } from "./passport-labels";

export const DEFAULT_ADMIN_OFFERS_CITY = "Reims";

export const ADMIN_OFFER_STATUS_LABELS: Record<AdminOfferStatus, string> = {
  draft: "Brouillon",
  pending_review: "En attente de validation",
  published: "Publiée",
  rejected: "Rejetée",
  archived: "Archivée",
};

export type AdminOfferStatusBadgeVariant = "neutral" | "warning" | "success" | "muted";

const OFFER_STATUS_BADGE_VARIANTS: Record<AdminOfferStatus, AdminOfferStatusBadgeVariant> = {
  draft: "neutral",
  pending_review: "warning",
  published: "success",
  rejected: "warning",
  archived: "muted",
};

export function offerStatusLabel(status: AdminOfferStatus): string {
  return ADMIN_OFFER_STATUS_LABELS[status] ?? status;
}

export function offerStatusBadgeVariant(status: AdminOfferStatus): AdminOfferStatusBadgeVariant {
  return OFFER_STATUS_BADGE_VARIANTS[status] ?? "neutral";
}

export function offerStatusBadgeTone(status: AdminOfferStatus) {
  return PARTNER_OFFER_STATUS_TONES[status];
}

export function buildOfferDetailPath(offerId: string): string {
  return buildPassportOfferAdminPath(offerId);
}

export function buildOffersListPath(query?: Record<string, string | undefined>): string {
  if (!query) {
    return "/passport-offers";
  }
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value?.trim()) {
      search.set(key, value.trim());
    }
  }
  const qs = search.toString();
  return qs ? `/passport-offers?${qs}` : "/passport-offers";
}

export const ADMIN_OFFER_STATUS_FILTER_OPTIONS: { value: "" | AdminOfferStatus; label: string }[] =
  [
    { value: "", label: "Tous les statuts" },
    ...(
      Object.entries(ADMIN_OFFER_STATUS_LABELS) as [AdminOfferStatus, string][]
    ).map(([value, label]) => ({ value, label })),
  ];
