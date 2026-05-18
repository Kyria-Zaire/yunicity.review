import type { PartnerOfferType, PassportTierCode } from "@yunicity/types";

export interface PassportTierMeta {
  label: string;
  description: string;
  accent: string;
  accentMuted: string;
  border: string;
}

export const PASSPORT_TIER_META: Record<PassportTierCode, PassportTierMeta> = {
  basic: {
    label: "Basic",
    description: "Citoyen Yunicity — exploration locale",
    accent: "#1c1917",
    accentMuted: "#f5f5f4",
    border: "#d6d3d1",
  },
  silver: {
    label: "Silver",
    description: "Engagement régulier sur le territoire",
    accent: "#64748b",
    accentMuted: "#f1f5f9",
    border: "#cbd5e1",
  },
  gold: {
    label: "Gold",
    description: "Ambassadeur de ta ville",
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
    label: "Press / Creator",
    description: "Voix locale et création territoriale",
    accent: "#6d28d9",
    accentMuted: "#f5f3ff",
    border: "#c4b5fd",
  },
  business: {
    label: "Business",
    description: "Passport organisation",
    accent: "#334155",
    accentMuted: "#f8fafc",
    border: "#94a3b8",
  },
};

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
