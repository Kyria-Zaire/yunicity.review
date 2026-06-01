import type { PartnerOfferStatus, PartnerOfferType, PassportTierCode } from "@yunicity/types";

export interface PassportTierMeta {
  label: string;
  description: string;
  accent: string;
  accentMuted: string;
  border: string;
}

export const PASSPORT_TIER_META: Record<PassportTierCode, PassportTierMeta> = {
  basic: {
    label: "Citoyen·ne",
    description: "Votre place dans la ville — exploration locale",
    accent: "#2A2FFF",
    accentMuted: "#EEF0FF",
    border: "#C7D2FE",
  },
  silver: {
    label: "Silver",
    description: "Engagement régulier reconnu sur le territoire",
    accent: "#64748b",
    accentMuted: "#f1f5f9",
    border: "#cbd5e1",
  },
  gold: {
    label: "Gold",
    description: "Ambassadeur·rice de votre ville",
    accent: "#a16207",
    accentMuted: "#fffbeb",
    border: "#fcd34d",
  },
  neo_arrivant: {
    label: "Néo-arrivant",
    description: "Bienvenue sur le territoire",
    accent: "#0f766e",
    accentMuted: "#f0fdfa",
    border: "#5eead4",
  },
  press_creator: {
    label: "Créateur·rice",
    description: "Voix locale — création territoriale",
    accent: "#2A2FFF",
    accentMuted: "#EEF0FF",
    border: "#C7D2FE",
  },
  business: {
    label: "Business",
    description: "Passport organisation",
    accent: "#334155",
    accentMuted: "#f8fafc",
    border: "#94a3b8",
  },
};

export const PARTNER_OFFER_STATUS_LABELS: Record<PartnerOfferStatus, string> = {
  draft: "Brouillon",
  pending_review: "En attente de validation",
  published: "Visible dans Yunicity",
  rejected: "À ajuster",
  archived: "Archivée",
};

/** Micro-copy partenaire — ton humain (TICKET-305B, validé CTO). */
export const PARTNER_OFFER_STATUS_MICROCOPY: Record<PartnerOfferStatus, string> = {
  draft: "Tu peux encore modifier et soumettre quand tu es prêt.",
  pending_review: "En attente de validation par l’équipe Yunicity.",
  published: "Ton offre est visible dans Yunicity Reims.",
  rejected: "Quelques ajustements sont nécessaires avant publication.",
  archived: "Cette offre n’est plus proposée aux citoyens.",
};

/** Passport citoyen — aucune offre publiée à proximité (TICKET-506). */
export const PASSPORT_CITIZEN_OFFERS_EMPTY =
  "Aucune offre disponible pour le moment. Les commerces de votre ville publient au fil des semaines.";

/** Hub partenaire — liste vide (TICKET-305B). */
export const PARTNER_OFFERS_EMPTY_TITLE = "Pas encore d’offre";
export const PARTNER_OFFERS_EMPTY_BODY =
  "Crée la première et fais vivre ton commerce dans Yunicity.";
export const PARTNER_OFFERS_EMPTY_CTA = "Créer une offre";

export const PARTNER_OFFER_REJECTED_SECTION_TITLE =
  "Quelques ajustements sont nécessaires";
export const PARTNER_OFFER_REJECTED_REASON_LABEL = "Ce qu’il faut préciser";
export const PARTNER_OFFER_REJECTED_HINT =
  "Modifie ton offre puis renvoie-la — on t’accompagne pour la publication.";

export const PARTNER_OFFER_STATUS_TONES: Record<
  PartnerOfferStatus,
  { bg: string; text: string; border: string }
> = {
  draft: { bg: "#f5f5f4", text: "#44403c", border: "#e7e5e4" },
  pending_review: { bg: "#fffbeb", text: "#92400e", border: "#fde68a" },
  published: { bg: "#ecfdf5", text: "#047857", border: "#a7f3d0" },
  rejected: { bg: "#fffbeb", text: "#92400e", border: "#fde68a" },
  archived: { bg: "#f8fafc", text: "#64748b", border: "#e2e8f0" },
};

export function canEditPartnerOffer(status: PartnerOfferStatus): boolean {
  return status === "draft" || status === "rejected";
}

export function canSubmitPartnerOffer(status: PartnerOfferStatus): boolean {
  return status === "draft" || status === "rejected";
}

export const PARTNER_OFFER_TYPE_LABELS: Record<PartnerOfferType, string> = {
  drink: "Boisson",
  discount: "Réduction",
  vip: "VIP",
  gift: "Cadeau",
  event_access: "Événement",
  custom: "Sur mesure",
};

export function maskQrToken(token: string): string {
  if (token.length <= 16) {
    return `${token.slice(0, 4)}…${token.slice(-4)}`;
  }
  return `${token.slice(0, 8)}…${token.slice(-6)}`;
}

export function formatPassportDate(iso: string | null | undefined): string {
  if (!iso) {
    return "—";
  }
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function isPassportNotActiveError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "PASSPORT_NOT_ACTIVE"
  );
}

export const PASSPORT_STAMP_CLAIM_LOADING = "Validation de votre tampon…";
export const PASSPORT_STAMP_CLAIM_SUCCESS_TITLE = "Tampon ajouté à votre Passport";
export const PASSPORT_STAMP_CLAIM_SUCCESS_BODY = "Bienvenue chez {partner}. Votre tampon Passport a bien été enregistré.";
export const PASSPORT_STAMP_CLAIM_ALREADY_CLAIMED_BODY = "Ce tampon est déjà dans votre Passport.";
export const PASSPORT_STAMP_CLAIM_EXPIRED_BODY = "Ce QR a expiré. Demandez un nouveau QR au partenaire.";
export const PASSPORT_STAMP_CLAIM_INVALID_BODY = "Ce QR n'est pas valide.";
export const PASSPORT_STAMP_CLAIM_PARTNER_INACTIVE_BODY = "Ce partenaire n'est pas actif pour le moment.";
export const PASSPORT_STAMP_CLAIM_ERROR_BODY = "Une erreur est survenue. Réessayez plus tard.";
export const PASSPORT_STAMP_CLAIM_CTA_PASSPORT = "Voir mon Passport";
export const PASSPORT_STAMP_CLAIM_CTA_PARTNER = "Voir le partenaire";
