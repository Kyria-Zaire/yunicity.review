import type { AdminPlatformConfigSnapshot } from "@yunicity/types";

const MODULE_LABELS: Record<string, string> = {
  cockpit: "Cockpit",
  analytics: "Analytics",
  partners: "Partenaires",
  passport_ops: "Passport Ops",
  partner_offers: "Offres partenaires",
  local_events: "Événements",
  creator_content: "Contenus créateurs",
  moderation: "Modération",
  partner_leads: "Prospects partenaires",
  staff: "Staff",
  partner_scan: "Scanner Passport",
};

const COMING_SOON_LABELS: Record<string, string> = {
  maintenance_mode: "Mode maintenance",
  admin_email_digest: "Digest email admin",
  platform_settings_editing: "Édition des paramètres plateforme",
  session_analytics: "Analytics de sessions",
  commissions_cpc_cpm: "Commissions CPC / CPM",
  admin_notification_alerts: "Alertes notifications admin",
};

const PARTNER_STATUS_LABELS: Record<string, string> = {
  signed: "Signé",
  active: "Actif",
  paused: "En pause",
  premium: "Premium",
  founding_partner: "Partenaire fondateur",
};

export function formatModuleLabel(code: string): string {
  return MODULE_LABELS[code] ?? code;
}

export function formatComingSoonLabel(code: string): string {
  return COMING_SOON_LABELS[code] ?? code;
}

export function formatPartnerStatus(status: string): string {
  return PARTNER_STATUS_LABELS[status] ?? status;
}

export function formatBoolean(value: boolean): string {
  return value ? "Oui" : "Non";
}

export function formatPriceCents(cents: number): string {
  if (cents === 0) {
    return "Gratuit";
  }
  return `${(cents / 100).toFixed(2).replace(".", ",")} € / mois`;
}

export function formatReadinessStatus(status: string): string {
  if (status === "ready" || status === "ok") return "Opérationnel";
  if (status === "degraded") return "Dégradé";
  if (status === "disabled") return "Désactivé";
  if (status === "error") return "Erreur";
  return status;
}

export function formatGeneratedAt(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function formatPilotGoals(snapshot: AdminPlatformConfigSnapshot): string {
  const goals = snapshot.general.pilot_goals;
  return [
    `${goals.active_passports} passeports actifs`,
    `${goals.published_offers} offres publiées`,
    `${goals.upcoming_events} événements à venir`,
    `${goals.approved_creator_contents} contenus créateurs approuvés`,
    `${goals.qualified_leads} leads qualifiés`,
  ].join(" · ");
}
