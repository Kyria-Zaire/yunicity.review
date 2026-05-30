/** Signed partner detail helpers (WEB-PARTNERS-02). */

import type { LocalEvent, PartnerOffer, PartnerPublic, PartnerStatus } from "@yunicity/types";

import { EDITORIAL_IMAGE_CAFE_RENCONTRE_ENTREPRENEURS } from "./editorial-fallback-images";
import { buildMapPlaceUrl, buildPartnerMapUrl } from "./explorer-links";
import { buildPublicPlaceHref } from "./place-routing";
import { isPublicPartner, partnerDisplayCategory, partnerStatusLabel } from "./partner-labels";

const PARTNER_HERO_FALLBACKS: Record<string, string> = {
  food: EDITORIAL_IMAGE_CAFE_RENCONTRE_ENTREPRENEURS,
  cafe: EDITORIAL_IMAGE_CAFE_RENCONTRE_ENTREPRENEURS,
  asian_food: EDITORIAL_IMAGE_CAFE_RENCONTRE_ENTREPRENEURS,
  fast_food: EDITORIAL_IMAGE_CAFE_RENCONTRE_ENTREPRENEURS,
  nightlife: EDITORIAL_IMAGE_CAFE_RENCONTRE_ENTREPRENEURS,
  barber: EDITORIAL_IMAGE_CAFE_RENCONTRE_ENTREPRENEURS,
  sport: EDITORIAL_IMAGE_CAFE_RENCONTRE_ENTREPRENEURS,
  services: EDITORIAL_IMAGE_CAFE_RENCONTRE_ENTREPRENEURS,
  institutional: EDITORIAL_IMAGE_CAFE_RENCONTRE_ENTREPRENEURS,
  creator: EDITORIAL_IMAGE_CAFE_RENCONTRE_ENTREPRENEURS,
};

export type PartnerBadgeTone = "default" | "founding" | "premium";

export type PartnerContactAction = {
  id: "map" | "call" | "website" | "instagram";
  label: string;
  href: string;
  external?: boolean;
  disabled?: boolean;
  disabledReason?: string;
};

export type PartnerPlaceCard = {
  id: string;
  slug: string;
  name: string;
  categoryLabel: string;
  badgeLabel: string;
  imageUrl: string | null;
  logoUrl: string | null;
  href: string;
  isFeatured: boolean;
};

export function partnerPublicHref(partner: Pick<PartnerPublic, "slug" | "city">): string {
  return buildPublicPlaceHref(partner.slug, partner.city);
}

export function partnerMapHref(partner: Pick<PartnerPublic, "slug" | "city">): string {
  return buildPartnerMapUrl(partner.slug, { city: partner.city });
}

export function hasPartnerCoordinates(
  partner: Pick<PartnerPublic, "latitude" | "longitude">,
): boolean {
  return (
    typeof partner.latitude === "number" &&
    Number.isFinite(partner.latitude) &&
    typeof partner.longitude === "number" &&
    Number.isFinite(partner.longitude)
  );
}

export function resolvePartnerImage(
  partner: Pick<PartnerPublic, "cover_image_url" | "logo_url" | "category">,
  variant: "hero" | "logo" | "card" = "hero",
): string | null {
  if (variant === "logo") {
    return partner.logo_url?.trim() || partner.cover_image_url?.trim() || null;
  }
  const cover = partner.cover_image_url?.trim();
  if (cover) return cover;
  if (variant === "card") {
    const logo = partner.logo_url?.trim();
    if (logo) return logo;
  }
  const category = partner.category?.trim().toLowerCase() ?? "";
  return PARTNER_HERO_FALLBACKS[category] ?? EDITORIAL_IMAGE_CAFE_RENCONTRE_ENTREPRENEURS;
}

export function partnerBadgeLabel(status: PartnerStatus): string {
  if (status === "founding_partner") return "Partenaire fondateur";
  if (status === "premium") return "Partenaire premium";
  if (status === "active") return "Partenaire Yunicity";
  return partnerStatusLabel(status);
}

export function partnerBadgeTone(status: PartnerStatus): PartnerBadgeTone {
  if (status === "founding_partner") return "founding";
  if (status === "premium") return "premium";
  return "default";
}

export function partnerContactActions(partner: PartnerPublic): PartnerContactAction[] {
  const actions: PartnerContactAction[] = [];
  if (hasPartnerCoordinates(partner)) {
    actions.push({
      id: "map",
      label: "Voir sur la carte",
      href: partnerMapHref(partner),
    });
  } else {
    actions.push({
      id: "map",
      label: "Voir sur la carte",
      href: partnerMapHref(partner),
      disabled: true,
      disabledReason: "Ce partenaire n’a pas encore d’adresse géolocalisée.",
    });
  }
  const phone = partner.phone?.trim();
  if (phone) {
    actions.push({
      id: "call",
      label: "Appeler",
      href: `tel:${phone.replace(/\s+/g, "")}`,
    });
  }
  const website = partner.website_url?.trim();
  if (website) {
    actions.push({
      id: "website",
      label: "Site web",
      href: website.startsWith("http") ? website : `https://${website}`,
      external: true,
    });
  }
  const instagram = partner.instagram_url?.trim();
  if (instagram) {
    actions.push({
      id: "instagram",
      label: "Instagram",
      href: instagram.startsWith("http") ? instagram : `https://instagram.com/${instagram.replace(/^@/, "")}`,
      external: true,
    });
  }
  return actions;
}

export function buildPartnerPlaceCards(partners: PartnerPublic[]): PartnerPlaceCard[] {
  return partners
    .filter((partner) => isPublicPartner(partner.partner_status))
    .map((partner) => ({
      id: partner.id,
      slug: partner.slug,
      name: partner.name,
      categoryLabel: partner.public_partner_label ?? partnerDisplayCategory(partner),
      badgeLabel: partnerBadgeLabel(partner.partner_status),
      imageUrl: resolvePartnerImage(partner, "card"),
      logoUrl: partner.logo_url,
      href: partnerPublicHref(partner),
      isFeatured: partner.is_featured,
    }));
}

export function filterPartnerOffersForOrganization(
  offers: PartnerOffer[],
  organizationId: string,
): PartnerOffer[] {
  return offers.filter((offer) => offer.organization_id === organizationId);
}

export function filterPartnerEvents(
  events: LocalEvent[],
  organizationId: string,
  limit = 6,
): LocalEvent[] {
  const now = Date.now();
  return events
    .filter((event) => event.organization_id === organizationId && !event.is_cancelled)
    .filter((event) => new Date(event.starts_at).getTime() >= now - 86_400_000)
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
    .slice(0, limit);
}

/** Legacy map place URLs still supported for cultural markers. */
export function culturalPlaceMapHref(slug: string, city: string, route?: boolean): string {
  return buildMapPlaceUrl(slug, { city, route });
}
