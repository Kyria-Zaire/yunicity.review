/** Partner self-service portal helpers (WEB-PARTNERS-08C). */

import type {
  LocalEventManagement,
  OrganizationMeItem,
  PartnerCreatorContentManagement,
  PartnerCreatorContentStatus,
  PartnerOfferManagement,
  PartnerOfferPublic,
  PartnerPublic,
  PartnerStatus,
} from "@yunicity/types";

import { partnerStatusLabel } from "./partner-labels";
import { PARTNER_OFFER_STATUS_LABELS } from "./passport-labels";
import { partnerPublicHref } from "./partner-detail";

export const PARTNER_PORTAL_BASE = "/organizations/me/partner";

export const PARTNER_PORTAL_EMPTY_TITLE = "Pas d’espace partenaire actif";
export const PARTNER_PORTAL_EMPTY_BODY =
  "Vous n’avez pas encore d’espace partenaire actif. Contactez l’équipe Yunicity si vous pensez qu’il s’agit d’une erreur.";

export const PARTNER_PORTAL_QR_EXPLANATION =
  "Ce QR permet à un citoyen d’ajouter un tampon de votre lieu à son Passport Yunicity. Validité 24 h après génération.";

const MANAGER_ROLES = new Set(["owner", "admin"]);

const PUBLIC_PARTNER_STATUSES: ReadonlySet<PartnerStatus> = new Set([
  "active",
  "premium",
  "founding_partner",
]);

const EVENT_MODERATION_LABELS: Record<string, string> = {
  pending_review: "En attente de validation",
  approved: "Publié",
  rejected: "Refusé",
};

const CREATOR_STATUS_LABELS: Record<PartnerCreatorContentStatus, string> = {
  draft: "Brouillon",
  pending_review: "En attente de validation",
  published: "Publié",
  rejected: "Refusé",
  archived: "Archivé",
};

export type PartnerPortalReadinessItem = {
  id: string;
  label: string;
  done: boolean;
  hint: string;
};

export function isPartnerPortalManager(org: OrganizationMeItem): boolean {
  return (
    MANAGER_ROLES.has(org.member_role) &&
    org.member_status === "active" &&
    org.verification_status === "verified"
  );
}

export function filterPartnerPortalOrganizations(
  items: OrganizationMeItem[],
): OrganizationMeItem[] {
  return items.filter(isPartnerPortalManager);
}

export function isPublicPartnerProfile(
  partner: Pick<PartnerPublic, "partner_status"> | null,
): boolean {
  if (!partner) return false;
  return PUBLIC_PARTNER_STATUSES.has(partner.partner_status);
}

export function partnerPortalStatusLabel(
  partner: Pick<PartnerPublic, "partner_status"> | null,
): string {
  if (!partner) return "Partenaire";
  return partnerStatusLabel(partner.partner_status);
}

export function partnerPortalOfferStatusLabel(
  status: PartnerOfferManagement["offer_status"],
): string {
  return PARTNER_OFFER_STATUS_LABELS[status] ?? status;
}

export function partnerPortalModerationStatusLabel(
  moderationStatus: string,
): string {
  return EVENT_MODERATION_LABELS[moderationStatus] ?? moderationStatus;
}

export function partnerPortalCreatorContentStatusLabel(
  status: PartnerCreatorContentStatus,
): string {
  return CREATOR_STATUS_LABELS[status] ?? status;
}

export function buildPartnerPortalPublicHref(
  partner: Pick<PartnerPublic, "slug" | "city">,
): string {
  return partnerPublicHref(partner);
}

export function buildPartnerPortalOverviewHref(): string {
  return PARTNER_PORTAL_BASE;
}

export function buildPartnerPortalOffersHref(): string {
  return `${PARTNER_PORTAL_BASE}/offers`;
}

export function buildPartnerPortalOfferCreateHref(): string {
  return `${PARTNER_PORTAL_BASE}/offers/new`;
}

export function buildPartnerPortalEventsHref(): string {
  return `${PARTNER_PORTAL_BASE}/events`;
}

export function buildPartnerPortalCreatorContentHref(): string {
  return `${PARTNER_PORTAL_BASE}/creator-content`;
}

export function buildPartnerPortalQrHref(): string {
  return `${PARTNER_PORTAL_BASE}/passport`;
}

export function buildPartnerPortalEventPublicHref(eventId: string): string {
  return `/events/${encodeURIComponent(eventId)}`;
}

export type PartnerPortalReadinessInput = {
  partner: PartnerPublic | null;
  offers: PartnerOfferManagement[];
  publicOffers: PartnerOfferPublic[];
  events: LocalEventManagement[];
  creatorContents: PartnerCreatorContentManagement[];
};

export function partnerPortalReadinessChecklist(
  input: PartnerPortalReadinessInput,
): PartnerPortalReadinessItem[] {
  const { partner, offers, publicOffers, events, creatorContents } = input;
  const profileComplete = Boolean(
    partner?.address?.trim() && (partner.logo_url || partner.cover_image_url),
  );
  const visibleOffer =
    publicOffers.length > 0 ||
    offers.some((o) => o.offer_status === "published" && o.is_active);
  const publishedEvent = events.some(
    (e) => e.moderation_status === "approved" && !e.is_cancelled,
  );
  const creatorPublished = creatorContents.some((c) => c.status === "published");
  const qrReady = partner !== null && isPublicPartnerProfile(partner);

  return [
    {
      id: "profile",
      label: "Fiche publique complète",
      done: profileComplete,
      hint: "Adresse et visuel (logo ou bannière) renseignés.",
    },
    {
      id: "offer",
      label: "Offre Passport visible",
      done: visibleOffer,
      hint: "Au moins une offre publiée et active.",
    },
    {
      id: "event",
      label: "Événement publié",
      done: publishedEvent,
      hint: "Un événement validé par l’équipe Yunicity.",
    },
    {
      id: "creator",
      label: "Contenu créateur publié",
      done: creatorPublished,
      hint: "Un contenu approuvé et visible.",
    },
    {
      id: "qr",
      label: "QR Passport prêt",
      done: qrReady,
      hint: "Partenaire actif — générez un QR depuis l’onglet dédié.",
    },
  ];
}
