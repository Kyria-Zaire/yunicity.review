/** Admin cockpit display helpers (ADMIN-01B). */

import type {
  AdminCockpitAttention,
  AdminCockpitPartners,
  AdminCockpitPassport,
  AdminCockpitSignals,
} from "@yunicity/types";

export type CockpitAttentionKey = keyof {
  offers_pending: number;
  creator_contents_pending: number;
  events_pending: number;
  reports_pending: number;
  partner_leads_open: number;
  organizations_pending_review: number;
};

export type CockpitAttentionSeverity = "none" | "low" | "medium" | "high";

const ATTENTION_LABELS: Record<CockpitAttentionKey, string> = {
  offers_pending: "Offres en attente",
  creator_contents_pending: "Contenus créateurs",
  events_pending: "Événements en attente",
  reports_pending: "Signalements citoyens",
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

/** HH:mm label for cockpit “last check” (ADMIN-UX-COCKPIT-01C). */
export function formatCockpitLastCheckTime(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
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

export function cockpitAttentionTotal(attention: AdminCockpitAttention): number {
  return (
    attention.offers_pending +
    attention.creator_contents_pending +
    attention.events_pending +
    attention.reports_pending +
    attention.partner_leads_open +
    attention.organizations_pending_review
  );
}

export function cockpitModerationPendingTotal(attention: AdminCockpitAttention): number {
  return (
    attention.offers_pending +
    attention.creator_contents_pending +
    attention.events_pending +
    attention.organizations_pending_review
  );
}

/** Pending count above which the Yunicity Signal shows intervention (ADMIN-UX-COCKPIT-02B). */
export const COCKPIT_SIGNAL_INTERVENTION_THRESHOLD = 6;

export type CockpitYunicitySignalLevel = "serene" | "vigilance" | "intervention";

export interface CockpitYunicitySignalView {
  level: CockpitYunicitySignalLevel;
  title: string;
  headline: string;
  secondaryLine: string;
  pendingTotal: number;
}

export function cockpitYunicitySignalLevel(pendingTotal: number): CockpitYunicitySignalLevel {
  if (pendingTotal === 0) {
    return "serene";
  }
  if (pendingTotal >= COCKPIT_SIGNAL_INTERVENTION_THRESHOLD) {
    return "intervention";
  }
  return "vigilance";
}

export function buildCockpitYunicitySignal(params: {
  city: string;
  attention: AdminCockpitAttention;
  usersActive: number;
}): CockpitYunicitySignalView {
  const pendingTotal = cockpitAttentionTotal(params.attention);
  const level = cockpitYunicitySignalLevel(pendingTotal);
  const { city } = params;
  const usersLabel = `${formatAdminMetric(params.usersActive)} citoyen${params.usersActive > 1 ? "s" : ""} actif${params.usersActive > 1 ? "s" : ""}`;

  switch (level) {
    case "serene":
      return {
        level,
        title: "Territoire serein",
        headline: `${city} fonctionne normalement.`,
        secondaryLine: `Aucune action urgente détectée. ${usersLabel}.`,
        pendingTotal,
      };
    case "vigilance":
      return {
        level,
        title: "Vigilance légère",
        headline: "Certaines validations méritent votre attention.",
        secondaryLine:
          pendingTotal === 1
            ? "1 élément attend une action."
            : `${formatAdminMetric(pendingTotal)} éléments attendent une action.`,
        pendingTotal,
      };
    case "intervention":
      return {
        level,
        title: "Intervention requise",
        headline: "Plusieurs actions nécessitent une prise en charge rapide.",
        secondaryLine: `${formatAdminMetric(pendingTotal)} éléments sont en attente.`,
        pendingTotal,
      };
  }
}

export type CockpitCityMood = "calm" | "active" | "busy";

export function cockpitCityMood(attention: AdminCockpitAttention): CockpitCityMood {
  const pending = cockpitModerationPendingTotal(attention);
  if (pending >= 10) {
    return "busy";
  }
  if (pending >= 3) {
    return "active";
  }
  return "calm";
}

export function cockpitCityMoodLabel(mood: CockpitCityMood): string {
  switch (mood) {
    case "busy":
      return "Files bien chargées";
    case "active":
      return "Modération en cours";
    default:
      return "Territoire serein";
  }
}

export function formatCockpitNowLabel(date: Date = new Date()): string {
  const datePart = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
  const timePart = new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
  const capitalized = datePart.charAt(0).toUpperCase() + datePart.slice(1);
  return `${capitalized} • ${timePart}`;
}

function capitalizeToken(value: string): string {
  if (!value) {
    return value;
  }
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function emailGreetingName(email: string | null | undefined): string | null {
  const trimmed = email?.trim();
  if (!trimmed) {
    return null;
  }
  const local = trimmed.split("@")[0] ?? "";
  if (!local) {
    return null;
  }
  const token = local.split(/[._-]/)[0] ?? local;
  if (!token) {
    return null;
  }
  if (token.toLowerCase() === "admin") {
    return "Admin";
  }
  return capitalizeToken(token);
}

function isSystemBootstrapDisplayName(fullName: string): boolean {
  const lower = fullName.toLowerCase();
  return lower.includes("bootstrap") || lower.startsWith("yunicity ");
}

/** Greeting label for cockpit header — avoids “Bonjour Yunicity” on bootstrap accounts. */
export function cockpitUserGreetingName(
  fullName: string | null | undefined,
  email?: string | null,
): string {
  const fromEmail = emailGreetingName(email);
  const trimmed = fullName?.trim();
  if (trimmed && !isSystemBootstrapDisplayName(trimmed)) {
    const first = trimmed.split(/\s+/)[0] ?? trimmed;
    if (first.toLowerCase() !== "yunicity") {
      return capitalizeToken(first);
    }
  }
  return fromEmail ?? "Admin Yunicity";
}

export function cockpitTerritoryPulseIsSparse(
  partners: AdminCockpitPartners,
  signals: AdminCockpitSignals,
  attention: AdminCockpitAttention,
): boolean {
  const top = signals.top_stamp_partner;
  return (
    partners.active === 0 &&
    signals.events_upcoming === 0 &&
    signals.stamps_today === 0 &&
    signals.redemptions_today === 0 &&
    signals.offers_published === 0 &&
    attention.partner_leads_open === 0 &&
    (top.stamps_count ?? 0) === 0
  );
}

export type CockpitOverviewKey =
  | "users"
  | "passports"
  | "partners"
  | "offers"
  | "creators"
  | "events";

/** Discreet subtext when a KPI total is zero — avoids “empty product” feel (02B). */
export function cockpitOverviewZeroHint(key: CockpitOverviewKey): string {
  switch (key) {
    case "users":
      return "Territoire en démarrage";
    case "passports":
      return "Premiers passports à venir";
    case "partners":
      return "Réseau en constitution";
    case "offers":
      return "Catalogue à enrichir";
    case "creators":
      return "Contenus à venir";
    case "events":
      return "Agenda à alimenter";
    default:
      return "—";
  }
}

export function cockpitOverviewHint(
  key: CockpitOverviewKey,
  executive: { users_active: number; creator_contents_total: number },
  attention: AdminCockpitAttention,
  partners: AdminCockpitPartners,
  signals: AdminCockpitSignals,
): string | undefined {
  switch (key) {
    case "users":
      return `${formatAdminMetric(executive.users_active)} actifs`;
    case "passports":
      return signals.passports_last_7_days > 0
        ? `+${formatAdminMetric(signals.passports_last_7_days)} cette semaine`
        : undefined;
    case "partners":
      return partners.active > 0
        ? `${formatAdminMetric(partners.active)} actifs`
        : undefined;
    case "offers":
      return signals.offers_published > 0
        ? `${formatAdminMetric(signals.offers_published)} publiées`
        : undefined;
    case "creators":
      return attention.creator_contents_pending > 0
        ? `${formatAdminMetric(attention.creator_contents_pending)} en attente`
        : undefined;
    case "events":
      return signals.events_upcoming > 0
        ? `${formatAdminMetric(signals.events_upcoming)} à venir`
        : undefined;
    default:
      return undefined;
  }
}

export const COCKPIT_PASSPORT_METRIC_LABELS: Record<keyof AdminCockpitPassport, string> = {
  passports_total: "Passeports",
  stamps_total: "Tampons",
  qr_stamps: "Tampons QR",
  partner_stamps: "Tampons partenaire",
  redemptions_total: "Utilisations",
  redemptions_completed: "Utilisations validées",
};
