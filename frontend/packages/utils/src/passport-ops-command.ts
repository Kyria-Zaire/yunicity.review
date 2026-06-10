/** Passport Command Center helpers (PASSPORT-OPS-V2-01) — UX pure. */

import type {
  AdminCockpitPassport,
  AdminCockpitSignals,
  AdminCockpitTopStampPartner,
  AdminPassportListItem,
} from "@yunicity/types";

import { buildPassportOpsListPath } from "./admin-passport";
import { formatAdminMetric } from "./admin-cockpit";

export const PASSPORT_OPS_PILOT_GOAL = 50;

export type PassportOpsSignalType = "empty" | "active" | "attention";

export interface PassportOpsProgramMetrics {
  city: string;
  totalPassports: number;
  suspendedPassports: number;
  totalStamps: number;
  totalRedemptions: number;
  engagedCitizens: number;
  isFilteredView: boolean;
}

export interface PassportOpsSignal {
  type: PassportOpsSignalType;
  title: string;
  description: string;
}

export interface PassportOpsRecommendedAction {
  id: string;
  title: string;
  description: string;
  ctaLabel: string;
  href: string;
}

export interface PassportOpsNextAction {
  id: string;
  title: string;
  ctaLabel: string;
  href: string;
}

export interface PassportOpsKpiCard {
  id: string;
  label: string;
  value: number;
  hint: string;
}

export type PassportOpsDashboardKpiTone = "positive" | "neutral";

export interface PassportOpsDashboardKpi {
  id: string;
  label: string;
  value: number;
  trend: string;
  trendTone: PassportOpsDashboardKpiTone;
}

export interface PassportOpsMomentum {
  city: string;
  activeCount: number;
  goal: number;
  progressPercent: number;
  progressRatio: number;
  microcopy: string;
}

export interface PassportOpsEngagedCitizen {
  id: string;
  name: string;
  tierLabel: string;
  stampsCount: number;
  redemptionsCount: number;
  detailHref: string;
}

export interface PassportOpsIntelligenceResult {
  hasData: boolean;
  topPartner: AdminCockpitTopStampPartner | null;
}

export function buildPassportOpsMetricsFromCockpit(
  city: string,
  passport: AdminCockpitPassport,
  suspendedPassports: number,
): PassportOpsProgramMetrics {
  const engagedCitizens =
    passport.stamps_total > 0 || passport.redemptions_completed > 0
      ? passport.passports_total
      : 0;

  return {
    city,
    totalPassports: passport.passports_total,
    suspendedPassports,
    totalStamps: passport.stamps_total,
    totalRedemptions: passport.redemptions_completed,
    engagedCitizens,
    isFilteredView: false,
  };
}

export function buildPassportOpsMetricsFromList(
  city: string,
  total: number,
  items: AdminPassportListItem[],
  isFilteredView: boolean,
): PassportOpsProgramMetrics {
  const totalStamps = items.reduce((sum, item) => sum + item.stamps_count, 0);
  const totalRedemptions = items.reduce((sum, item) => sum + item.redemptions_count, 0);
  const engagedCitizens = items.filter(
    (item) => item.stamps_count > 0 || item.redemptions_count > 0,
  ).length;
  const suspendedPassports = items.filter((item) => item.status === "suspended").length;

  return {
    city,
    totalPassports: total,
    suspendedPassports,
    totalStamps,
    totalRedemptions,
    engagedCitizens,
    isFilteredView,
  };
}

export function passportOpsActivePassportCount(metrics: PassportOpsProgramMetrics): number {
  return Math.max(metrics.totalPassports - metrics.suspendedPassports, 0);
}

export function buildPassportOpsSignal(metrics: PassportOpsProgramMetrics): PassportOpsSignal {
  if (metrics.totalPassports === 0) {
    return {
      type: "empty",
      title: "Programme en attente",
      description: "Aucun citoyen n'a encore rejoint le programme Passport.",
    };
  }

  if (metrics.suspendedPassports > 0) {
    const count = formatAdminMetric(metrics.suspendedPassports);
    return {
      type: "attention",
      title: "Vigilance requise",
      description: `${count} Passport(s) nécessitent une attention.`,
    };
  }

  return {
    type: "active",
    title: "Programme lancé",
    description: `Les citoyens commencent à utiliser le Passport à ${metrics.city}.`,
  };
}

export function buildPassportOpsNextAction(
  metrics: PassportOpsProgramMetrics,
): PassportOpsNextAction {
  if (metrics.suspendedPassports > 0) {
    return {
      id: "suspensions",
      title: "Traitez les Passport suspendus.",
      ctaLabel: "Voir les suspensions",
      href: buildPassportOpsListPath({ status: "suspended" }),
    };
  }

  if (metrics.totalStamps === 0) {
    return {
      id: "first-stamp",
      title: "Encouragez le premier tampon.",
      ctaLabel: "Scanner un Passport",
      href: "/partner-scan",
    };
  }

  if (metrics.totalPassports < PASSPORT_OPS_PILOT_GOAL) {
    return {
      id: "grow",
      title: "Développez le programme.",
      ctaLabel: "Inviter des partenaires",
      href: "/partners",
    };
  }

  return {
    id: "steady",
    title: "Le programme progresse normalement.",
    ctaLabel: "Consulter le registre",
    href: "/passport-ops#passport-registry",
  };
}

export function buildPassportOpsConseilMessage(metrics: PassportOpsProgramMetrics): string {
  if (metrics.totalStamps === 0) {
    return "Invitez un partenaire à réaliser la première interaction Passport.";
  }

  if (metrics.suspendedPassports > 0) {
    return "Traitez rapidement les Passport suspendus.";
  }

  if (passportOpsActivePassportCount(metrics) >= PASSPORT_OPS_PILOT_GOAL) {
    return "Le programme Passport dispose désormais d'une base solide.";
  }

  return "Continuez à développer l'engagement citoyen.";
}

export function buildPassportOpsRecommendedAction(
  metrics: PassportOpsProgramMetrics,
): PassportOpsRecommendedAction {
  if (metrics.totalPassports === 0) {
    return {
      id: "launch",
      title: "Lancez le programme Passport.",
      description: "Invitez les premiers citoyens à rejoindre l'expérience Yunicity.",
      ctaLabel: "Scanner un Passport",
      href: "/partner-scan",
    };
  }

  if (metrics.totalStamps === 0) {
    return {
      id: "first-stamp",
      title: "Encouragez le premier tampon.",
      description: "Invitez un partenaire à réaliser la première interaction Passport.",
      ctaLabel: "Scanner un Passport",
      href: "/partner-scan",
    };
  }

  if (metrics.totalRedemptions === 0) {
    return {
      id: "first-redemption",
      title: "Débloquez les premiers avantages.",
      description: "Accompagnez les partenaires vers leur première rédemption.",
      ctaLabel: "Voir les partenaires",
      href: "/partners",
    };
  }

  return {
    id: "grow",
    title: "Le programme évolue.",
    description: "Continuez à accompagner l'engagement citoyen.",
    ctaLabel: "Voir les Passport",
    href: "/passport-ops#passport-registry",
  };
}

function kpiHint(value: number, emptyHint: string, activeHint: string): string {
  return value > 0 ? activeHint : emptyHint;
}

export function buildPassportOpsDashboardKpisFromCockpit(
  passport: AdminCockpitPassport,
  signals: AdminCockpitSignals,
  suspendedPassports: number,
): PassportOpsDashboardKpi[] {
  const total = passport.passports_total;
  const active = Math.max(total - suspendedPassports, 0);
  const activePercent = total > 0 ? Math.round((active / total) * 100) : 0;
  const newWeek = signals.passports_last_7_days;

  return [
    {
      id: "passports",
      label: "Passports (total)",
      value: total,
      trend:
        newWeek > 0
          ? `+${formatAdminMetric(newWeek)} cette semaine`
          : "— vs semaine dernière",
      trendTone: newWeek > 0 ? "positive" : "neutral",
    },
    {
      id: "active-citizens",
      label: "Citoyens actifs",
      value: active,
      trend: total > 0 ? `${activePercent}% du total` : "—",
      trendTone: active > 0 ? "positive" : "neutral",
    },
    {
      id: "redemptions",
      label: "Utilisations validées",
      value: passport.redemptions_completed,
      trend:
        signals.redemptions_today > 0
          ? `+${formatAdminMetric(signals.redemptions_today)} aujourd'hui`
          : "— vs hier",
      trendTone: signals.redemptions_today > 0 ? "positive" : "neutral",
    },
    {
      id: "stamps-today",
      label: "Tampons aujourd'hui",
      value: signals.stamps_today,
      trend: signals.stamps_today > 0 ? "Activité du jour" : "— vs hier",
      trendTone: signals.stamps_today > 0 ? "positive" : "neutral",
    },
    {
      id: "new-week",
      label: "Nouveaux (7j)",
      value: newWeek,
      trend: newWeek > 0 ? "Cette semaine" : "— vs semaine dernière",
      trendTone: newWeek > 0 ? "positive" : "neutral",
    },
  ];
}

export function buildPassportOpsDashboardKpisFromList(
  metrics: PassportOpsProgramMetrics,
): PassportOpsDashboardKpi[] {
  const active = Math.max(metrics.totalPassports - metrics.suspendedPassports, 0);
  const activePercent =
    metrics.totalPassports > 0
      ? Math.round((active / metrics.totalPassports) * 100)
      : 0;

  return [
    {
      id: "passports",
      label: "Passports (résultats)",
      value: metrics.totalPassports,
      trend: metrics.isFilteredView ? "Vue filtrée" : "—",
      trendTone: metrics.totalPassports > 0 ? "positive" : "neutral",
    },
    {
      id: "active-citizens",
      label: "Citoyens actifs",
      value: active,
      trend: metrics.totalPassports > 0 ? `${activePercent}% du total` : "—",
      trendTone: active > 0 ? "positive" : "neutral",
    },
    {
      id: "redemptions",
      label: "Rédemptions (page)",
      value: metrics.totalRedemptions,
      trend: "Somme page courante",
      trendTone: "neutral",
    },
    {
      id: "stamps-today",
      label: "Tampons (page)",
      value: metrics.totalStamps,
      trend: "Somme page courante",
      trendTone: "neutral",
    },
    {
      id: "new-week",
      label: "Engagés (page)",
      value: metrics.engagedCitizens,
      trend: "Au moins 1 interaction",
      trendTone: metrics.engagedCitizens > 0 ? "positive" : "neutral",
    },
  ];
}

export function passportOpsCitizenInitials(
  displayName: string | null | undefined,
  email: string,
): string {
  const source = displayName?.trim() || email;
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export function passportOpsLastActivityAt(item: AdminPassportListItem): string | null {
  return item.activated_at ?? item.created_at ?? null;
}

export function buildPassportOpsKpiCards(metrics: PassportOpsProgramMetrics): PassportOpsKpiCard[] {
  return [
    {
      id: "active",
      label: "Passport actifs",
      value: metrics.totalPassports,
      hint: kpiHint(metrics.totalPassports, "Programme en attente", "Programme lancé"),
    },
    {
      id: "engaged",
      label: "Citoyens engagés",
      value: metrics.engagedCitizens,
      hint: kpiHint(metrics.engagedCitizens, "Premiers citoyens attendus", "Participation en cours"),
    },
    {
      id: "stamps",
      label: "Tampons",
      value: metrics.totalStamps,
      hint: kpiHint(metrics.totalStamps, "Premières interactions attendues", "Interactions enregistrées"),
    },
    {
      id: "redemptions",
      label: "Avantages utilisés",
      value: metrics.totalRedemptions,
      hint: kpiHint(metrics.totalRedemptions, "Aucune rédemption", "Programme utilisé"),
    },
  ];
}

export function passportOpsMomentumProgress(
  activeCount: number,
  goal: number = PASSPORT_OPS_PILOT_GOAL,
): number {
  if (goal <= 0) {
    return 0;
  }
  return Math.min(Math.round((activeCount / goal) * 100), 100);
}

export function passportOpsMomentumMicrocopy(activeCount: number): string {
  if (activeCount === 0) {
    return "Le programme attend ses premiers citoyens.";
  }
  if (activeCount <= 24) {
    return "Le territoire commence à s'engager.";
  }
  if (activeCount <= 49) {
    return "Le pilote prend de l'ampleur.";
  }
  return "Le programme dispose d'une base solide.";
}

export function buildPassportOpsMomentum(
  metrics: PassportOpsProgramMetrics,
): PassportOpsMomentum {
  const activeCount = passportOpsActivePassportCount(metrics);
  const goal = PASSPORT_OPS_PILOT_GOAL;

  return {
    city: metrics.city,
    activeCount,
    goal,
    progressPercent: passportOpsMomentumProgress(activeCount, goal),
    progressRatio: Math.min(activeCount / goal, 1),
    microcopy: passportOpsMomentumMicrocopy(activeCount),
  };
}

export function buildPassportOpsEngagedCitizens(
  items: AdminPassportListItem[],
  tierLabelFn: (code: AdminPassportListItem["tier_code"]) => string,
  detailPathFn: (id: string) => string,
): PassportOpsEngagedCitizen[] {
  return [...items]
    .sort((a, b) => {
      const scoreA = a.stamps_count + a.redemptions_count;
      const scoreB = b.stamps_count + b.redemptions_count;
      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }
      return a.passport_number.localeCompare(b.passport_number);
    })
    .slice(0, 5)
    .map((item) => ({
      id: item.id,
      name: item.user.display_name?.trim() || item.user.email,
      tierLabel: tierLabelFn(item.tier_code),
      stampsCount: item.stamps_count,
      redemptionsCount: item.redemptions_count,
      detailHref: detailPathFn(item.id),
    }));
}

export function buildPassportOpsIntelligence(
  metrics: PassportOpsProgramMetrics,
  topPartner: AdminCockpitTopStampPartner | null,
): PassportOpsIntelligenceResult {
  const hasData =
    !metrics.isFilteredView &&
    (metrics.totalStamps > 0 || metrics.totalRedemptions > 0) &&
    topPartner !== null &&
    (topPartner.stamps_count ?? 0) > 0 &&
    Boolean(topPartner.name);

  return {
    hasData,
    topPartner: hasData ? topPartner : null,
  };
}

export function passportOpsIntelligenceEmptyCopy(): {
  title: string;
  intro: string;
  promises: string[];
} {
  return {
    title: "Intelligence programme",
    intro: "Les tendances d'usage apparaîtront à mesure que les citoyens utiliseront leur Passport.",
    promises: [
      "Les partenaires les plus actifs",
      "Les avantages les plus utilisés",
      "Les quartiers les plus engagés",
    ],
  };
}
