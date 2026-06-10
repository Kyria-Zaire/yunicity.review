import type {
  AdminAnalyticsAttention,
  AdminAnalyticsPeriod,
  AdminAnalyticsSummary,
} from "@yunicity/types";

const PERIOD_DAYS: Record<AdminAnalyticsPeriod, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

export function formatAnalyticsPeriodRange(
  period: AdminAnalyticsPeriod,
  generatedAt: string,
): string {
  const end = new Date(generatedAt);
  const start = new Date(end);
  start.setDate(start.getDate() - PERIOD_DAYS[period]);

  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  const monthFormatter = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" });
  const dayFormatter = new Intl.DateTimeFormat("fr-FR", { day: "numeric" });

  if (sameMonth) {
    return `${start.getDate()}–${dayFormatter.format(end)} ${monthFormatter.format(end)}`;
  }

  const shortStart = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
  }).format(start);
  const shortEnd = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(end);
  return `${shortStart} – ${shortEnd}`;
}

export function formatVariationPercent(value: number | null, compareEnabled: boolean): string {
  if (!compareEnabled || value === null) {
    return "Comparaison indisponible";
  }
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(1)} % vs période précédente`;
}

export function variationTone(
  value: number | null,
  compareEnabled: boolean,
): "positive" | "negative" | "neutral" {
  if (!compareEnabled || value === null || value === 0) {
    return "neutral";
  }
  return value > 0 ? "positive" : "negative";
}

export function attentionTotal(attention: AdminAnalyticsAttention): number {
  return (
    attention.pending_offers +
    attention.pending_events +
    attention.pending_creator_contents +
    attention.pending_partner_verifications +
    attention.open_leads
  );
}

export function passportActivityInPeriod(summary: AdminAnalyticsSummary): number {
  return summary.passport.stamps_in_period + summary.passport.redemptions_in_period;
}

export interface AnalyticsModuleBar {
  id: string;
  label: string;
  value: number;
  color: string;
}

export function buildModuleActivityBars(summary: AdminAnalyticsSummary): AnalyticsModuleBar[] {
  return [
    {
      id: "passport",
      label: "Passport Ops",
      value: passportActivityInPeriod(summary),
      color: "#7c3aed",
    },
    {
      id: "offers",
      label: "Offres",
      value: summary.offers.published,
      color: "#3b82f6",
    },
    {
      id: "events",
      label: "Événements",
      value: summary.events.approved,
      color: "#22c55e",
    },
    {
      id: "creators",
      label: "Contenus créateurs",
      value: summary.creators.published,
      color: "#f97316",
    },
    {
      id: "crm",
      label: "Partenaires / CRM",
      value: summary.crm.total_leads,
      color: "#94a3b8",
    },
  ];
}

export interface AnalyticsDonutSegment {
  id: string;
  label: string;
  value: number;
  color: string;
}

export function buildPassportDistribution(summary: AdminAnalyticsSummary): AnalyticsDonutSegment[] {
  return [
    {
      id: "qr",
      label: "Tampons QR",
      value: summary.passport.qr_claims_in_period,
      color: "#7c3aed",
    },
    {
      id: "partner",
      label: "Tampons partenaire",
      value: summary.passport.partner_claims_in_period,
      color: "#3b82f6",
    },
    {
      id: "redemptions",
      label: "Échanges",
      value: summary.passport.redemptions_in_period,
      color: "#22c55e",
    },
  ];
}

export function buildOperationalHealthSegments(
  attention: AdminAnalyticsAttention,
): AnalyticsDonutSegment[] {
  return [
    {
      id: "offers",
      label: "Offres en attente",
      value: attention.pending_offers,
      color: "#7c3aed",
    },
    {
      id: "events",
      label: "Événements en attente",
      value: attention.pending_events,
      color: "#3b82f6",
    },
    {
      id: "creators",
      label: "Contenus en attente",
      value: attention.pending_creator_contents,
      color: "#22c55e",
    },
    {
      id: "verifications",
      label: "Vérifications partenaires",
      value: attention.pending_partner_verifications,
      color: "#f97316",
    },
  ];
}
