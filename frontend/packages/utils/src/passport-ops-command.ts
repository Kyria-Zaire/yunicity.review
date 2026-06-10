/** Passport Command Center helpers (PASSPORT-OPS-V2-01) — UX pure. */

import type { AdminCockpitPassport, AdminCockpitTopStampPartner, AdminPassportListItem } from "@yunicity/types";

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

export interface PassportOpsKpiCard {
  id: string;
  label: string;
  value: number;
  hint: string;
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

export function buildPassportOpsSignal(metrics: PassportOpsProgramMetrics): PassportOpsSignal {
  if (metrics.suspendedPassports > 0) {
    return {
      type: "attention",
      title: "Une attention particulière est requise.",
      description: "Certains Passport nécessitent une vérification.",
    };
  }

  if (metrics.totalPassports === 0) {
    return {
      type: "empty",
      title: "Le programme attend ses premiers participants.",
      description: `Aucun Passport actif n'a encore été détecté à ${metrics.city}.`,
    };
  }

  return {
    type: "active",
    title: "Le programme est lancé.",
    description: `Les premiers citoyens commencent à utiliser le Passport à ${metrics.city}.`,
  };
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
    return "Le programme fait ses premiers pas.";
  }
  if (activeCount <= 9) {
    return "Les premiers citoyens rejoignent Yunicity.";
  }
  if (activeCount <= 24) {
    return "La communauté commence à émerger.";
  }
  if (activeCount <= 49) {
    return "Le Passport s'installe dans les habitudes locales.";
  }
  return "Le Passport est devenu un réflexe territorial.";
}

export function buildPassportOpsMomentum(
  metrics: PassportOpsProgramMetrics,
): PassportOpsMomentum {
  const activeCount = metrics.totalPassports;
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
