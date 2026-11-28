/** Public partner offer catalog helpers (WEB-PARTNERS-03). */

import type {
  PartnerOfferPublic,
  PartnerOfferType,
} from "@yunicity/types";

import { PARTNER_OFFER_TYPE_LABELS } from "./passport-labels";
import { PLACES_PARTNERS_BADGE } from "./partner-portal-labels";

const INTERNAL_OFFER_KEYS = [
  "max_redemptions_total",
  "max_redemptions_per_passport",
  "redemption_count",
  "created_by_user_id",
  "moderated_by_user_id",
  "rejection_reason",
  "metadata",
] as const;

export function partnerOfferTypeLabel(type: PartnerOfferType): string {
  return PARTNER_OFFER_TYPE_LABELS[type] ?? "Avantage";
}

export function partnerOfferBadgeLabel(offer: Pick<PartnerOfferPublic, "value_label" | "offer_type">): string {
  const value = offer.value_label?.trim();
  if (value) return value;
  return partnerOfferTypeLabel(offer.offer_type);
}

export function partnerOfferValueLabel(offer: Pick<PartnerOfferPublic, "value_label" | "title">): string {
  return offer.value_label?.trim() || offer.title;
}

export function isPartnerOfferActive(
  offer: Pick<PartnerOfferPublic, "valid_from" | "valid_until">,
  now = new Date(),
): boolean {
  if (offer.valid_from) {
    const start = new Date(offer.valid_from);
    if (start.getTime() > now.getTime()) return false;
  }
  if (offer.valid_until) {
    const end = new Date(offer.valid_until);
    if (end.getTime() < now.getTime()) return false;
  }
  return true;
}

export function formatPartnerOfferValidity(
  offer: Pick<PartnerOfferPublic, "valid_from" | "valid_until">,
): string | null {
  if (!offer.valid_until) return "Valable sans date de fin affichée";
  const end = new Date(offer.valid_until);
  if (Number.isNaN(end.getTime())) return null;
  return `Valable jusqu’au ${end.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })}`;
}

export function buildPassportOfferDetailHref(offerId: string): string {
  return `/passport/offre/${encodeURIComponent(offerId)}`;
}

export function buildPartnerOfferHref(offer: PartnerOfferPublic): string {
  return buildPassportOfferDetailHref(offer.id);
}

export function buildPartnerOfferMapHref(offer: PartnerOfferPublic): string {
  const params = new URLSearchParams({ partner: offer.partner.slug, city: offer.partner.city });
  return `/map?${params.toString()}`;
}

export function organizationIdsWithActiveOffers(offers: PartnerOfferPublic[]): Set<string> {
  const ids = new Set<string>();
  for (const offer of offers) {
    if (isPartnerOfferActive(offer)) {
      ids.add(offer.partner.slug);
    }
  }
  return ids;
}

export function partnerHasPassportOfferBadge(
  partnerSlug: string,
  offers: PartnerOfferPublic[],
): boolean {
  return offers.some((offer) => offer.partner.slug === partnerSlug && isPartnerOfferActive(offer));
}

export function passportOfferBadgeText(): string {
  return PLACES_PARTNERS_BADGE;
}

export function assertNoInternalOfferFields(payload: Record<string, unknown>): void {
  for (const key of INTERNAL_OFFER_KEYS) {
    if (key in payload) {
      throw new Error(`Internal offer field leaked: ${key}`);
    }
  }
}
