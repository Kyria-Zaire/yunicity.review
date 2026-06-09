/** Partners network command center helpers (ADMIN-PARTNERS-UX-01). */

import { formatAdminMetric } from "./admin-cockpit";

import type {
  AdminPartnersTerrainListItem,
  AdminPartnersWorkspaceSummary,
} from "@yunicity/types";

import { organizationTypeLabel } from "./admin-partner";
import { partnerTypeLabel } from "./partner-labels";

export const PARTNERS_NETWORK_TAB_IDS = [
  "leads",
  "partners",
  "verification",
  "activation",
] as const;

export type PartnersNetworkTabId = (typeof PARTNERS_NETWORK_TAB_IDS)[number];

export type PartnerNetworkSignalLevel = "preparing" | "action" | "active";

/** Signal territorial UX-04 — success | warning | critical */
export type PartnersNetworkSignalType = "success" | "warning" | "critical";

export interface PartnerNetworkSignal {
  level: PartnerNetworkSignalLevel;
  title: string;
  message: string;
}

export interface PartnersNetworkSignalResult {
  type: PartnersNetworkSignalType;
  title: string;
  description: string;
  updatedAt: string;
}

export interface PartnerPipelineStep {
  id: "prospection" | "verification" | "activation" | "active_network";
  label: string;
  count: number | null;
  unavailable?: boolean;
  hint?: string;
}

export interface PartnerPriorityAction {
  id: string;
  label: string;
  count: number;
  href: string;
}

export const PARTNERS_WORKSPACE_TAB_PRODUCT_LABELS: Record<
  PartnersNetworkTabId,
  string
> = {
  leads: "Prospects",
  partners: "Réseau actif",
  verification: "Vérifications",
  activation: "Activation",
};

export function partnerTabLabel(tab: PartnersNetworkTabId): string {
  return PARTNERS_WORKSPACE_TAB_PRODUCT_LABELS[tab];
}

export type TerrainPartnerUiStatus = "active" | "pending" | "verified" | "inactive";

export interface PartnerTerrainKpiCard {
  id: string;
  label: string;
  value: string;
  hint: string;
  href: string;
  tone: "primary" | "success" | "warning" | "info" | "danger";
}

export function partnerTerrainNetworkTotal(summary: AdminPartnersWorkspaceSummary): number {
  return summary.partners_total + summary.organizations_pending_review;
}

export const PARTNER_EVOLUTION_CHART_MIN_TOTAL = 5;

export function shouldShowPartnerEvolutionChart(
  summary: AdminPartnersWorkspaceSummary,
): boolean {
  return summary.partners_total >= PARTNER_EVOLUTION_CHART_MIN_TOTAL;
}

export interface PartnerStorytellingCopy {
  title: string;
  message: string;
}

export function partnerTerrainTableEmptyState(
  filtered: boolean,
  city: string,
): PartnerStorytellingCopy {
  if (filtered) {
    return {
      title: "Aucun partenaire ne correspond à ces critères.",
      message: "Essayez d'élargir votre recherche ou de réinitialiser les filtres.",
    };
  }
  return {
    title: `${city} est prête à accueillir ses premiers partenaires Yunicity.`,
    message:
      "Les commerces, associations et lieux apparaîtront ici dès leur intégration au réseau.",
  };
}

export function partnerTerrainMapEmptyCopy(): PartnerStorytellingCopy {
  return {
    title: "Le réseau Yunicity prendra forme ici.",
    message:
      "Les partenaires géolocalisés apparaîtront automatiquement sur la carte du territoire.",
  };
}

export function partnerTerrainCategoryEmptyCopy(): PartnerStorytellingCopy {
  return {
    title: "La diversité du territoire se révélera avec les premiers partenaires.",
    message: "Les catégories apparaîtront dès que les acteurs locaux seront intégrés.",
  };
}

export function partnerTerrainTopActiveEmptyCopy(): PartnerStorytellingCopy {
  return {
    title: "Les partenaires les plus engagés apparaîtront ici.",
    message: "Le classement se construira avec les premiers usages Passport.",
  };
}

export function partnerPendingRequestsEmptyCopy(): PartnerStorytellingCopy {
  return {
    title: "Aucune demande partenaire en attente.",
    message: "Le territoire est prêt à accueillir ses prochaines candidatures.",
  };
}

export const PILOT_MOMENTUM_ACTIVE_GOAL = 10;

export const PARTNER_NETWORK_PRIMARY_ACTION_IDS = ["add", "verify", "scan"] as const;

export type PartnerNetworkPrimaryActionId =
  (typeof PARTNER_NETWORK_PRIMARY_ACTION_IDS)[number];

export interface PartnerPilotMomentumProgress {
  active: number;
  goal: number;
  ratio: number;
  percent: number;
}

export function partnerPilotMomentumProgress(
  summary: AdminPartnersWorkspaceSummary,
): PartnerPilotMomentumProgress {
  const active = partnerNetworkActiveTotal(summary);
  const goal = PILOT_MOMENTUM_ACTIVE_GOAL;
  const ratio = Math.min(active / goal, 1);
  return { active, goal, ratio, percent: Math.round(ratio * 100) };
}

export function partnerPilotMomentumObjectiveCopy(
  summary: AdminPartnersWorkspaceSummary,
): string {
  const total = summary.partners_total;
  if (total === 0) {
    return "Activez les premiers partenaires pour révéler les tendances locales.";
  }
  if (total < 10) {
    return "Le réseau prend forme. Continuez à intégrer des acteurs clés.";
  }
  return "Le pilote est lancé. Consolidez l'engagement du territoire.";
}

export function partnerPilotMomentumProgressLabel(active: number): string {
  if (active === 0) {
    return "Le pilote attend ses premiers partenaires.";
  }
  if (active < PILOT_MOMENTUM_ACTIVE_GOAL) {
    return "Le réseau se construit.";
  }
  return "Objectif atteint.";
}

export interface PartnerRecommendedAction {
  id: string;
  title: string;
  description: string;
  href: string;
  ctaLabel: string;
}

export function partnerRecommendedAction(
  summary: AdminPartnersWorkspaceSummary,
): PartnerRecommendedAction {
  const city = summary.city;
  const pending = summary.organizations_pending_review;
  const activationReady = summary.activation_items_ready;

  if (pending > 0) {
    return {
      id: "verify",
      title: "Vérifier les organisations",
      description: `${formatAdminMetric(pending)} candidature${pending > 1 ? "s" : ""} attend${pending > 1 ? "ent" : ""} votre validation.`,
      href: "/partners?tab=verification",
      ctaLabel: "Examiner les demandes",
    };
  }

  if (activationReady > 0) {
    return {
      id: "activation",
      title: "Gérer les activations",
      description: `${formatAdminMetric(activationReady)} activation${activationReady > 1 ? "s" : ""} prête${activationReady > 1 ? "s" : ""} à finaliser.`,
      href: "/partners?tab=activation",
      ctaLabel: "Ouvrir les activations",
    };
  }

  if (summary.partners_total === 0) {
    return {
      id: "add",
      title: "Ajouter un partenaire",
      description: `Lancez le premier réseau Yunicity de ${city}.`,
      href: "/partner-leads",
      ctaLabel: "Ajouter un partenaire",
    };
  }

  return {
    id: "scan",
    title: "Scanner un Passport",
    description: "Validez une interaction terrain et renforcez l'engagement local.",
    href: "/partner-scan",
    ctaLabel: "Ouvrir le scanner",
  };
}

/** @deprecated UX-05 — remplacé par Momentum du pilote ; conservé pour compat exports. */
export function partnerEvolutionNarrativeCopy(city: string): PartnerStorytellingCopy {
  return {
    title: "Construction du réseau",
    message: `Yunicity est actuellement en phase pilote à ${city}. Les tendances apparaîtront automatiquement dès les premières activations partenaires.`,
  };
}

export function partnerFutureNetworkSidebarCopy(): PartnerStorytellingCopy & { footer: string } {
  return {
    title: "Le futur réseau Yunicity",
    message: "",
    footer: "Les premières intégrations alimenteront ces indicateurs.",
  };
}

export function partnerTerrainTableEmptyFootnote(): string {
  return "Commencez par inviter un commerce, une association ou un lieu emblématique.";
}

export interface PartnerLaunchStatusItem {
  label: string;
  done: boolean;
}

/** Checklist « État du lancement » — valeurs réelles uniquement. */
export function partnerNetworkLaunchStatus(
  summary: AdminPartnersWorkspaceSummary,
): PartnerLaunchStatusItem[] {
  const active = partnerNetworkActiveTotal(summary);
  const pending = summary.organizations_pending_review;
  const inactive = summary.partners_inactive;

  return [
    { label: "Prêt pour le pilote", done: true },
    {
      label:
        active > 0 ? `Actifs : ${formatAdminMetric(active)}` : "Réseau à développer",
      done: active > 0,
    },
    {
      label:
        pending > 0
          ? `Demandes : ${formatAdminMetric(pending)}`
          : "Aucune demande",
      done: pending === 0,
    },
    {
      label:
        inactive > 0
          ? `Inactifs : ${formatAdminMetric(inactive)}`
          : "Aucun partenaire inactif",
      done: inactive === 0,
    },
  ];
}

/**
 * Signal réseau territorial (UX-04).
 * Priorité : critical > warning > success.
 */
export function partnersNetworkSignal(
  summary: AdminPartnersWorkspaceSummary,
): PartnersNetworkSignalResult {
  const pending = summary.organizations_pending_review;
  const activationReady = summary.activation_items_ready;
  const partnersTotal = summary.partners_total;
  const city = summary.city;
  const updatedAt = summary.generated_at;

  if (pending >= 5 || activationReady >= 5) {
    return {
      type: "critical",
      title: "Le territoire nécessite une attention particulière.",
      description:
        "Des partenaires attendent une action pour poursuivre leur intégration.",
      updatedAt,
    };
  }

  if (pending === 0 && activationReady === 0 && partnersTotal === 0) {
    return {
      type: "success",
      title: `${city} est prête à accueillir ses premiers partenaires.`,
      description:
        "Aucune candidature n'est en attente.\nLe territoire est opérationnel pour lancer son pilote Yunicity.",
      updatedAt,
    };
  }

  if (pending > 0 || partnersTotal < 10) {
    return {
      type: "warning",
      title: "Le réseau Yunicity prend forme.",
      description:
        "Des candidatures sont en cours de traitement.\nContinuez à développer l'écosystème local.",
      updatedAt,
    };
  }

  const activeTotal = partnerNetworkActiveTotal(summary);
  return {
    type: "success",
    title: "Le réseau Yunicity est actif sur le territoire.",
    description: `${formatAdminMetric(activeTotal)} partenaire${activeTotal > 1 ? "s" : ""} actif${activeTotal > 1 ? "s" : ""} — le pilote progresse.`,
    updatedAt,
  };
}

export interface PartnerNetworkActionItem {
  id: string;
  label: string;
  description: string;
  href: string;
}

export function partnerNetworkActionItems(
  summary: AdminPartnersWorkspaceSummary,
): PartnerNetworkActionItem[] {
  const pending = summary.organizations_pending_review;
  const inactive = summary.partners_inactive;
  const activationReady = summary.activation_items_ready;

  return [
    {
      id: "add",
      label: "Ajouter un partenaire",
      description: "Intégrez un nouveau prospect au réseau territorial.",
      href: "/partner-leads",
    },
    {
      id: "verify",
      label: "Vérifier une organisation",
      description:
        pending > 0
          ? `${formatAdminMetric(pending)} demande${pending > 1 ? "s" : ""} à examiner`
          : "Aucune vérification en attente pour le moment.",
      href: "/partners?tab=verification",
    },
    {
      id: "scan",
      label: "Scanner un Passport",
      description: "Validez une interaction terrain en temps réel.",
      href: "/partner-scan",
    },
    {
      id: "export",
      label: "Exporter le réseau",
      description: "Consultez et exportez les prospects du territoire.",
      href: "/partner-leads",
    },
    {
      id: "inactive",
      label: "Consulter les partenaires inactifs",
      description:
        inactive > 0
          ? `${formatAdminMetric(inactive)} partenaire${inactive > 1 ? "s" : ""} à relancer`
          : "Aucun partenaire inactif pour le moment.",
      href: "/partners?status=inactive",
    },
    {
      id: "activation",
      label: "Gérer les activations",
      description:
        activationReady > 0
          ? `${formatAdminMetric(activationReady)} activation${activationReady > 1 ? "s" : ""} prête${activationReady > 1 ? "s" : ""}`
          : "Prêt pour les prochaines mises en service.",
      href: "/partners?tab=activation",
    },
  ];
}

function partnerTerrainKpiHint(
  cardId: PartnerTerrainKpiCard["id"],
  summary: AdminPartnersWorkspaceSummary,
  totals: { total: number; active: number; pending: number; verified: number },
): string {
  const { total, active, pending, verified } = totals;

  switch (cardId) {
    case "total":
      if (total === 0) return "Pilote prêt à démarrer";
      if (summary.partners_new_this_month > 0) {
        return `+${formatAdminMetric(summary.partners_new_this_month)} ce mois-ci`;
      }
      return "Réseau territorial";
    case "active":
      if (active === 0) return "À développer";
      if (total > 0) {
        return `${((active / total) * 100).toFixed(1).replace(".", ",")}% du réseau`;
      }
      return "Réseau territorial";
    case "pending":
      return pending === 0 ? "Aucune candidature" : "À valider";
    case "city":
      return "Territoire pilote";
    case "verified":
      if (verified === 0) return "Confiance à bâtir";
      if (total > 0) {
        return `${((verified / total) * 100).toFixed(1).replace(".", ",")}% du total`;
      }
      return "Confiance à bâtir";
    default:
      return "";
  }
}

export function partnerTerrainKpiCards(summary: AdminPartnersWorkspaceSummary): PartnerTerrainKpiCard[] {
  const total = partnerTerrainNetworkTotal(summary);
  const active = partnerNetworkActiveTotal(summary);
  const pending = summary.organizations_pending_review + summary.leads_open;
  const verified = summary.partners_verified;
  const totals = { total, active, pending, verified };

  return [
    {
      id: "total",
      label: "Partenaires totaux",
      value: formatAdminMetric(total),
      hint: partnerTerrainKpiHint("total", summary, totals),
      href: "/partners",
      tone: "primary",
    },
    {
      id: "active",
      label: "Actifs",
      value: formatAdminMetric(active),
      hint: partnerTerrainKpiHint("active", summary, totals),
      href: "/partners?status=active",
      tone: "success",
    },
    {
      id: "pending",
      label: "En attente",
      value: formatAdminMetric(pending),
      hint: partnerTerrainKpiHint("pending", summary, totals),
      href: "/partners?status=pending",
      tone: "warning",
    },
    {
      id: "city",
      label: "Par ville",
      value: summary.city,
      hint: partnerTerrainKpiHint("city", summary, totals),
      href: "/partners",
      tone: "info",
    },
    {
      id: "verified",
      label: "Partenaires vérifiés",
      value: formatAdminMetric(verified),
      hint: partnerTerrainKpiHint("verified", summary, totals),
      href: "/partners?status=verified",
      tone: "danger",
    },
  ];
}

export function resolveTerrainPartnerUiStatus(
  item: Pick<AdminPartnersTerrainListItem, "verification_status" | "partner_status">,
): TerrainPartnerUiStatus {
  if (item.partner_status === "paused") {
    return "inactive";
  }
  if (
    item.verification_status === "pending" ||
    item.verification_status === "under_review" ||
    item.partner_status === "signed"
  ) {
    return "pending";
  }
  if (item.verification_status === "verified") {
    return "verified";
  }
  if (
    item.partner_status === "active" ||
    item.partner_status === "premium" ||
    item.partner_status === "founding_partner"
  ) {
    return "active";
  }
  return "inactive";
}

export const TERRAIN_STATUS_LABELS: Record<TerrainPartnerUiStatus, string> = {
  active: "Actif",
  pending: "En attente",
  verified: "Vérifié",
  inactive: "Inactif",
};

export function terrainPartnerCategoryLabel(
  item: Pick<AdminPartnersTerrainListItem, "partnership_type" | "organization_type" | "category">,
): string {
  if (item.category?.trim()) {
    return item.category.trim();
  }
  if (item.partnership_type) {
    return partnerTypeLabel(item.partnership_type as Parameters<typeof partnerTypeLabel>[0]);
  }
  return organizationTypeLabel(item.organization_type as Parameters<typeof organizationTypeLabel>[0]);
}

export function terrainPartnerSubtitle(
  item: Pick<AdminPartnersTerrainListItem, "partnership_type" | "organization_type" | "category">,
): string {
  if (item.partnership_type) {
    return partnerTypeLabel(item.partnership_type as Parameters<typeof partnerTypeLabel>[0]);
  }
  return organizationTypeLabel(item.organization_type as Parameters<typeof organizationTypeLabel>[0]);
}

export function formatTerrainRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `Il y a ${days} jour${days > 1 ? "s" : ""}`;
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(iso));
}

export function categoryBreakdownWithPercent(
  breakdown: AdminPartnersWorkspaceSummary["category_breakdown"],
): { key: string; count: number; percent: number }[] {
  const total = breakdown.reduce((sum, item) => sum + item.count, 0);
  if (total <= 0) return [];
  return breakdown.map((item) => ({
    key: item.key,
    count: item.count,
    percent: Math.round((item.count / total) * 100),
  }));
}

export function partnerNetworkActiveTotal(summary: AdminPartnersWorkspaceSummary): number {
  return summary.partners_active + summary.partners_premium + summary.partners_founding;
}

export function partnerNetworkHasTerritorialActivity(
  summary: AdminPartnersWorkspaceSummary,
): boolean {
  return (
    summary.leads_total > 0 ||
    summary.partners_total > 0 ||
    summary.organizations_pending_review > 0 ||
    summary.activation_items_total > 0
  );
}

export function partnerNetworkPendingActionsTotal(
  summary: AdminPartnersWorkspaceSummary,
): number {
  return (
    summary.leads_open +
    summary.organizations_pending_review +
    summary.activation_items_ready
  );
}

export function buildPartnerNetworkSignal(
  summary: AdminPartnersWorkspaceSummary,
): PartnerNetworkSignal {
  const city = summary.city;
  const activeTotal = partnerNetworkActiveTotal(summary);
  const pending = partnerNetworkPendingActionsTotal(summary);

  if (!partnerNetworkHasTerritorialActivity(summary)) {
    return {
      level: "preparing",
      title: "Réseau en préparation",
      message: `Aucun partenaire ou prospect actif pour ${city}. Ajoutez des leads pilotes pour commencer le développement local.`,
    };
  }

  if (pending > 0) {
    return {
      level: "action",
      title: "Actions partenaires à traiter",
      message: `${pending} vérification${pending > 1 ? "s" : ""} ou activation${pending > 1 ? "s" : ""} attendent une intervention.`,
    };
  }

  return {
    level: "active",
    title: "Réseau partenaire actif",
    message: `${activeTotal} partenaire${activeTotal > 1 ? "s" : ""} actif${activeTotal > 1 ? "s" : ""} sur le territoire.`,
  };
}

export function partnerPipelineSteps(
  summary: AdminPartnersWorkspaceSummary,
): PartnerPipelineStep[] {
  const activeTotal = partnerNetworkActiveTotal(summary);

  return [
    {
      id: "prospection",
      label: "Prospection",
      count: summary.leads_open,
      hint:
        summary.leads_total > summary.leads_open
          ? `${summary.leads_total} au total`
          : undefined,
    },
    {
      id: "verification",
      label: "Vérification",
      count: summary.organizations_pending_review,
    },
    {
      id: "activation",
      label: "Activation",
      count: summary.activation_items_ready,
      hint:
        summary.activation_items_total > 0
          ? `${summary.activation_items_activated} activé${summary.activation_items_activated > 1 ? "s" : ""}`
          : undefined,
    },
    {
      id: "active_network",
      label: "Réseau actif",
      count: activeTotal,
      hint:
        summary.partners_verified > 0
          ? `${summary.partners_verified} vérifié${summary.partners_verified > 1 ? "s" : ""}`
          : undefined,
    },
  ];
}

export function partnerPriorityActions(
  summary: AdminPartnersWorkspaceSummary,
): PartnerPriorityAction[] {
  const actions: PartnerPriorityAction[] = [];

  if (summary.leads_open > 0) {
    actions.push({
      id: "leads-open",
      label: "Prospects à relancer",
      count: summary.leads_open,
      href: "/partners?tab=leads",
    });
  }
  if (summary.organizations_pending_review > 0) {
    actions.push({
      id: "orgs-review",
      label: "Organisations à vérifier",
      count: summary.organizations_pending_review,
      href: "/partners?tab=verification",
    });
  }
  if (summary.activation_items_ready > 0) {
    actions.push({
      id: "activation-ready",
      label: "Activations prêtes",
      count: summary.activation_items_ready,
      href: "/partners?tab=activation",
    });
  }

  return actions;
}

export type PartnerEmptyStateCopy = PartnerStorytellingCopy;

export function partnerEmptyStateCopy(
  tab: PartnersNetworkTabId,
  city: string,
  filtered?: boolean,
): PartnerEmptyStateCopy {
  if (filtered) {
    return {
      title: "Aucun résultat pour ces filtres.",
      message: "Affinez la recherche ou changez les critères pour élargir la liste.",
    };
  }

  switch (tab) {
    case "leads":
      return {
        title: "Aucun prospect pour le moment.",
        message: `Ajoutez vos premiers contacts terrain pour démarrer le réseau Yunicity à ${city}.`,
      };
    case "partners":
      return {
        title: "Aucun partenaire actif pour le moment.",
        message: "Les partenaires validés apparaîtront ici.",
      };
    case "verification":
      return {
        title: "Aucune vérification en attente.",
        message: "Les nouvelles organisations à contrôler apparaîtront ici.",
      };
    case "activation":
      return {
        title: "Aucune activation en attente.",
        message: "Les partenaires prêts à rejoindre le pilote apparaîtront ici.",
      };
  }
}
