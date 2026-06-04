/** Admin offers workspace helpers (ADMIN-04B / 04C). */

import type { AdminOfferListItem, AdminOfferStatus, AdminOfferRedemptionChannel } from "@yunicity/types";

import { adminPartnerDetailPath } from "./admin-partner";
import { buildPassportOfferAdminPath } from "./admin-passport";
import { formatPassportDate, PARTNER_OFFER_STATUS_TONES } from "./passport-labels";

export const DEFAULT_ADMIN_OFFERS_CITY = "Reims";

export const ADMIN_OFFER_STATUS_LABELS: Record<AdminOfferStatus, string> = {
  draft: "Brouillon",
  pending_review: "En attente de validation",
  published: "Publiée",
  rejected: "Rejetée",
  archived: "Archivée",
};

export type AdminOfferStatusBadgeVariant = "neutral" | "warning" | "success" | "muted";

export type OfferPublicExposureStatus = "ok" | "ko" | "unknown";

export interface OfferPublicExposureCheck {
  key: string;
  label: string;
  status: OfferPublicExposureStatus;
  detail: string;
}

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

/** Aligné sur partner_offer_workflow.py (TICKET-305A). */
export function canApproveOffer(status: AdminOfferStatus): boolean {
  return status === "pending_review";
}

export function canRejectOffer(status: AdminOfferStatus): boolean {
  return status === "pending_review";
}

export function canArchiveOffer(status: AdminOfferStatus): boolean {
  return status === "published";
}

export function formatOfferDate(iso: string | null | undefined): string {
  return formatPassportDate(iso);
}

export function buildOfferDetailPath(offerId: string): string {
  return buildPassportOfferAdminPath(offerId);
}

export function buildPartnerDetailPath(organizationId: string): string {
  return adminPartnerDetailPath(organizationId);
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

const LIST_CONTEXT_KEYS = ["status", "organization_id", "offer_type", "page", "page_size"] as const;

export function buildOfferDetailPathWithListContext(
  offerId: string,
  listQuery: URLSearchParams | Record<string, string | undefined>,
): string {
  const base = buildOfferDetailPath(offerId);
  const search =
    listQuery instanceof URLSearchParams ? new URLSearchParams(listQuery) : new URLSearchParams();
  if (!(listQuery instanceof URLSearchParams)) {
    for (const [key, value] of Object.entries(listQuery)) {
      if (value?.trim()) {
        search.set(key, value.trim());
      }
    }
  }
  const qs = search.toString();
  return qs ? `${base}?${qs}` : base;
}

export function buildOffersListBackPath(detailSearchParams: URLSearchParams): string {
  const query: Record<string, string> = {};
  for (const key of LIST_CONTEXT_KEYS) {
    const value = detailSearchParams.get(key);
    if (value) {
      query[key] = value;
    }
  }
  return buildOffersListPath(query);
}

function isOfferWithinValidityWindow(offer: AdminOfferListItem, nowMs: number): boolean {
  if (offer.valid_from) {
    const fromMs = new Date(offer.valid_from).getTime();
    if (fromMs > nowMs) {
      return false;
    }
  }
  if (offer.valid_until) {
    const untilMs = new Date(offer.valid_until).getTime();
    if (untilMs < nowMs) {
      return false;
    }
  }
  return true;
}

export function buildOfferPublicExposureChecks(offer: AdminOfferListItem): OfferPublicExposureCheck[] {
  const org = offer.organization;
  const nowMs = Date.now();
  const quotaExhausted =
    offer.max_redemptions_total !== null &&
    offer.max_redemptions_total > 0 &&
    offer.redemptions_count >= offer.max_redemptions_total;

  return [
    {
      key: "org_verified",
      label: "Organisation vérifiée",
      status: org.verification_status === "verified" ? "ok" : "ko",
      detail: org.verification_status,
    },
    {
      key: "org_public",
      label: "Organisation publique",
      status: org.visibility === "public" ? "ok" : "ko",
      detail: org.visibility,
    },
    {
      key: "partner_status",
      label: "Statut partenaire catalogue",
      status: "unknown",
      detail: "Non disponible dans cette version admin",
    },
    {
      key: "offer_published",
      label: "Offre publiée et active",
      status: offer.offer_status === "published" && offer.is_active ? "ok" : "ko",
      detail: offerStatusLabel(offer.offer_status),
    },
    {
      key: "valid_dates",
      label: "Dates de validité",
      status: isOfferWithinValidityWindow(offer, nowMs) ? "ok" : "ko",
      detail: `${formatOfferDate(offer.valid_from)} → ${formatOfferDate(offer.valid_until)}`,
    },
    {
      key: "quota",
      label: "Quota global",
      status: quotaExhausted ? "ko" : offer.max_redemptions_total === null ? "unknown" : "ok",
      detail:
        offer.max_redemptions_total === null
          ? "Non disponible dans cette version admin"
          : `${offer.redemptions_count} / ${offer.max_redemptions_total}`,
    },
  ];
}

export function isOfferPubliclyVisible(offer: AdminOfferListItem): boolean {
  const checks = buildOfferPublicExposureChecks(offer);
  const requiredKeys = ["org_verified", "org_public", "offer_published", "valid_dates"] as const;
  return requiredKeys.every(
    (key) => checks.find((check) => check.key === key)?.status === "ok",
  );
}

export const ADMIN_OFFER_STATUS_FILTER_OPTIONS: { value: "" | AdminOfferStatus; label: string }[] =
  [
    { value: "", label: "Tous les statuts" },
    ...(
      Object.entries(ADMIN_OFFER_STATUS_LABELS) as [AdminOfferStatus, string][]
    ).map(([value, label]) => ({ value, label })),
  ];

export const OFFER_REDEMPTION_CHANNEL_LABELS: Record<AdminOfferRedemptionChannel, string> = {
  self: "App citoyen",
  scan: "Scan partenaire",
  unknown: "Inconnu",
};

export function offerRedemptionChannelLabel(channel: AdminOfferRedemptionChannel): string {
  return OFFER_REDEMPTION_CHANNEL_LABELS[channel] ?? channel;
}
