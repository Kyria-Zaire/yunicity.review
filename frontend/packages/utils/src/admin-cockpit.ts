/** Admin cockpit display helpers (ADMIN-01B). */

import type { AdminCockpitPartners, AdminCockpitPassport } from "@yunicity/types";

export type CockpitAttentionKey = keyof {
  offers_pending: number;
  creator_contents_pending: number;
  events_pending: number;
  partner_leads_open: number;
  organizations_pending_review: number;
};

export type CockpitAttentionSeverity = "none" | "low" | "medium" | "high";

const ATTENTION_LABELS: Record<CockpitAttentionKey, string> = {
  offers_pending: "Offres en attente",
  creator_contents_pending: "Contenus créateurs",
  events_pending: "Événements en attente",
  partner_leads_open: "Leads ouverts",
  organizations_pending_review: "Organisations à vérifier",
};

export function formatAdminMetric(value: number): string {
  return new Intl.NumberFormat("fr-FR").format(value);
}

export function formatGeneratedAt(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function cockpitAttentionLabel(key: CockpitAttentionKey): string {
  return ATTENTION_LABELS[key];
}

export function cockpitAttentionSeverity(count: number): CockpitAttentionSeverity {
  if (count <= 0) {
    return "none";
  }
  if (count < 3) {
    return "low";
  }
  if (count < 10) {
    return "medium";
  }
  return "high";
}

export const COCKPIT_PARTNER_METRIC_LABELS: Record<keyof AdminCockpitPartners, string> = {
  active: "Actifs",
  signed: "Signés",
  premium: "Premium",
  founding_partner: "Fondateurs",
  paused: "En pause",
  public: "Publics",
  private: "Privés",
  verified: "Vérifiés",
  pending_review: "En revue",
};

export const COCKPIT_PASSPORT_METRIC_LABELS: Record<keyof AdminCockpitPassport, string> = {
  passports_total: "Passeports",
  stamps_total: "Tampons",
  qr_stamps: "Tampons QR",
  partner_stamps: "Tampons partenaire",
  redemptions_total: "Utilisations",
  redemptions_completed: "Utilisations validées",
};
