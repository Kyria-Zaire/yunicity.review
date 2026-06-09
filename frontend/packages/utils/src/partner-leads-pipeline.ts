/** Territorial prospect pipeline helpers (ADMIN-LEADS-V2-01). */

import type { OrganizationType, PartnerLead, PartnerLeadSource, PartnerLeadStatus } from "@yunicity/types";

import { formatAdminMetric } from "./admin-cockpit";
import { PARTNER_LEAD_SOURCE_LABELS, PARTNER_LEAD_STATUS_LABELS } from "./domain-labels";

export const PARTNER_LEAD_PIPELINE_STATUSES = [
  "new",
  "contacted",
  "interested",
  "meeting_scheduled",
  "signed",
  "converted",
] as const;

export type PartnerLeadPipelineStatus = (typeof PARTNER_LEAD_PIPELINE_STATUSES)[number];

export type PartnerLeadSignalType = "empty" | "active" | "followup" | "conversion";

export interface PartnerLeadSignalResult {
  type: PartnerLeadSignalType;
  title: string;
  description: string;
}

export interface PartnerLeadPipelineColumn {
  status: PartnerLeadPipelineStatus;
  label: string;
  shortLabel: string;
  hint: string;
  count: number;
  preview: PartnerLead[];
  filterHref: string;
}

export interface PartnerLeadPipelineResult {
  columns: PartnerLeadPipelineColumn[];
  total: number;
}

export interface PartnerLeadKpiCard {
  id: string;
  label: string;
  value: string;
  hint: string;
  href: string;
  tone: "primary" | "success" | "warning" | "info" | "neutral";
}

export interface PartnerLeadRecommendedAction {
  id: string;
  title: string;
  description: string;
  href: string;
  ctaLabel: string;
}

export interface PartnerLeadEmptyStateCopy {
  title: string;
  message: string;
  badge?: string;
}

export interface PartnerLeadInsightsResult {
  topSources: { source: PartnerLeadSource; label: string; count: number }[];
  hotProspects: PartnerLead[];
  upcomingFollowups: PartnerLead[];
  recentConversions: PartnerLead[];
  byOrganizationType: { type: OrganizationType; count: number }[];
  hasData: boolean;
}

const OPEN_STATUSES: PartnerLeadStatus[] = [
  "new",
  "contacted",
  "interested",
  "meeting_scheduled",
  "signed",
];

const HOT_CONVERSION_STATUSES: PartnerLeadStatus[] = [
  "interested",
  "meeting_scheduled",
  "signed",
];

const PIPELINE_FUNNEL_LABELS: Record<PartnerLeadPipelineStatus, string> = {
  new: "Nouveau",
  contacted: "Contacté",
  interested: "Intéressé",
  meeting_scheduled: "RDV",
  signed: "Signé",
  converted: "Converti",
};

const PIPELINE_COLUMN_HINTS: Record<PartnerLeadPipelineStatus, string> = {
  new: "Premiers contacts terrain",
  contacted: "Échanges engagés",
  interested: "Intérêt confirmé",
  meeting_scheduled: "Rendez-vous fixés",
  signed: "Accords obtenus",
  converted: "Intégrés au réseau",
};

export function partnerLeadStatusLabel(status: PartnerLeadStatus): string {
  return PARTNER_LEAD_STATUS_LABELS[status];
}

export function partnerLeadPipelineStatusLabel(status: PartnerLeadPipelineStatus): string {
  return PARTNER_LEAD_STATUS_LABELS[status];
}

function countByStatus(leads: PartnerLead[]): Record<PartnerLeadStatus, number> {
  const counts: Record<PartnerLeadStatus, number> = {
    new: 0,
    contacted: 0,
    interested: 0,
    meeting_scheduled: 0,
    signed: 0,
    converted: 0,
    rejected: 0,
    archived: 0,
  };
  for (const lead of leads) {
    counts[lead.status] += 1;
  }
  return counts;
}

export function partnerLeadDueFollowups(
  leads: PartnerLead[],
  now: Date = new Date(),
): PartnerLead[] {
  return leads.filter((lead) => {
    if (!OPEN_STATUSES.includes(lead.status)) {
      return false;
    }
    if (!lead.next_followup_at) {
      return false;
    }
    return new Date(lead.next_followup_at) <= now;
  });
}

export function partnerLeadHotProspects(leads: PartnerLead[]): PartnerLead[] {
  return leads.filter((lead) => HOT_CONVERSION_STATUSES.includes(lead.status));
}

export function partnerLeadConversionOpportunityCount(leads: PartnerLead[]): number {
  return leads.filter((lead) => HOT_CONVERSION_STATUSES.includes(lead.status)).length;
}

export function partnerLeadNearConversionCount(leads: PartnerLead[]): number {
  return leads.filter((lead) =>
    (["meeting_scheduled", "signed"] as PartnerLeadStatus[]).includes(lead.status),
  ).length;
}

export function partnerLeadOpenCount(leads: PartnerLead[]): number {
  return leads.filter((lead) => OPEN_STATUSES.includes(lead.status)).length;
}

export function buildPartnerLeadSignal(
  leads: PartnerLead[],
  city: string,
  now: Date = new Date(),
): PartnerLeadSignalResult {
  const total = leads.length;
  const dueCount = partnerLeadDueFollowups(leads, now).length;
  const nearCount = partnerLeadNearConversionCount(leads);
  const openCount = partnerLeadOpenCount(leads);

  if (total === 0) {
    return {
      type: "empty",
      title: "Le pipeline est prêt.",
      description: `Aucun prospect n'est encore enregistré pour ${city}.`,
    };
  }

  if (dueCount > 0) {
    return {
      type: "followup",
      title: "Des prospects attendent une action.",
      description: `${formatAdminMetric(dueCount)} contact${dueCount > 1 ? "s" : ""} doivent être relancé${dueCount > 1 ? "s" : ""} ou qualifié${dueCount > 1 ? "s" : ""}.`,
    };
  }

  if (nearCount > 0) {
    return {
      type: "conversion",
      title: "Des prospects sont prêts à rejoindre le réseau.",
      description: `${formatAdminMetric(nearCount)} prospect${nearCount > 1 ? "s" : ""} ${nearCount > 1 ? "sont" : "est"} proche${nearCount > 1 ? "s" : ""} de la conversion.`,
    };
  }

  return {
    type: "active",
    title: "Le réseau se construit.",
    description: `${formatAdminMetric(openCount)} prospect${openCount > 1 ? "s" : ""} ${openCount > 1 ? "sont" : "est"} en cours de qualification.`,
  };
}

export function buildPartnerLeadPipeline(
  leads: PartnerLead[],
  city: string,
): PartnerLeadPipelineResult {
  const columns: PartnerLeadPipelineColumn[] = PARTNER_LEAD_PIPELINE_STATUSES.map((status) => {
    const inColumn = leads.filter((lead) => lead.status === status);
    const params = new URLSearchParams({ status, city });
    return {
      status,
      label: partnerLeadPipelineStatusLabel(status),
      shortLabel: PIPELINE_FUNNEL_LABELS[status],
      hint: PIPELINE_COLUMN_HINTS[status],
      count: inColumn.length,
      preview: inColumn.slice(0, 2),
      filterHref: `/partner-leads?${params.toString()}`,
    };
  });

  return { columns, total: leads.length };
}

export function partnerLeadFocusKpiCards(leads: PartnerLead[]): PartnerLeadKpiCard[] {
  const counts = countByStatus(leads);
  const dueCount = partnerLeadDueFollowups(leads).length;
  const total = leads.length;
  const hotCount = partnerLeadConversionOpportunityCount(leads);
  const convertedCount = counts.converted;

  return [
    {
      id: "total",
      label: "Prospects",
      value: formatAdminMetric(total),
      hint: total === 0 ? "Pipeline vide" : "En qualification",
      href: "/partner-leads",
      tone: "primary",
    },
    {
      id: "followup",
      label: "À relancer",
      value: formatAdminMetric(dueCount),
      hint: dueCount === 0 ? "Aucune relance" : "À traiter",
      href: "/partner-leads",
      tone: dueCount > 0 ? "warning" : "neutral",
    },
    {
      id: "hot",
      label: "Conversion proche",
      value: formatAdminMetric(hotCount),
      hint: hotCount === 0 ? "À révéler" : "Opportunités chaudes",
      href: "/partner-leads?status=interested",
      tone: hotCount > 0 ? "success" : "neutral",
    },
    {
      id: "converted",
      label: "Convertis",
      value: formatAdminMetric(convertedCount),
      hint: convertedCount === 0 ? "Impact à venir" : "Intégrés au réseau",
      href: "/partner-leads?status=converted",
      tone: convertedCount > 0 ? "success" : "neutral",
    },
  ];
}

/** @deprecated Prefer partnerLeadFocusKpiCards for focus-mode CRM layout. */
export function partnerLeadPipelineKpiCards(leads: PartnerLead[]): PartnerLeadKpiCard[] {
  return partnerLeadFocusKpiCards(leads);
}

export function buildPartnerLeadRecommendedAction(
  leads: PartnerLead[],
  city: string,
  now: Date = new Date(),
): PartnerLeadRecommendedAction {
  const due = partnerLeadDueFollowups(leads, now);
  if (due.length > 0) {
    const first = due[0]!;
    return {
      id: "followup",
      title: "Des prospects attendent une relance.",
      description:
        "Traitez les contacts dont la prochaine action est arrivée à échéance.",
      href: `/partner-leads/${first.id}`,
      ctaLabel: "Traiter la relance",
    };
  }

  const hot = leads.filter((lead) => HOT_CONVERSION_STATUSES.includes(lead.status));
  if (hot.length > 0) {
    const first =
      hot.find((lead) => lead.status === "signed") ??
      hot.find((lead) => lead.status === "meeting_scheduled") ??
      hot[0]!;
    return {
      id: "near-conversion",
      title: "Des prospects sont proches de rejoindre le réseau.",
      description: "Finalisez les échanges avec les contacts déjà qualifiés.",
      href: `/partner-leads/${first.id}`,
      ctaLabel: "Finaliser",
    };
  }

  if (leads.length === 0) {
    return {
      id: "add",
      title: "Le territoire attend son premier contact.",
      description: `Ajoutez le premier commerce, association ou lieu emblématique pour lancer le pilote Yunicity à ${city}.`,
      href: "/partner-leads",
      ctaLabel: "Ajouter un prospect",
    };
  }

  const early = leads.find((lead) => lead.status === "new" || lead.status === "contacted");
  if (early) {
    return {
      id: "qualify",
      title: "Continuez la qualification terrain.",
      description:
        "Faites avancer les prospects dans le pipeline jusqu'à leur intégration au réseau.",
      href: `/partner-leads/${early.id}`,
      ctaLabel: "Continuer",
    };
  }

  return {
    id: "pipeline",
    title: "Continuez la qualification terrain.",
    description:
      "Faites avancer les prospects dans le pipeline jusqu'à leur intégration au réseau.",
    href: "/partner-leads",
    ctaLabel: "Voir le pipeline",
  };
}

export function partnerLeadEmptyStateCopy(
  city: string,
  filtered: boolean,
): PartnerLeadEmptyStateCopy {
  if (filtered) {
    return {
      title: "Aucun prospect ne correspond à ces critères.",
      message: "Essayez d'élargir votre recherche.",
    };
  }
  return {
    badge: "Pipeline terrain",
    title: "Le terrain est prêt pour les premiers contacts.",
    message: `Ajoutez les commerces, associations et lieux qui pourraient rejoindre le réseau Yunicity à ${city}.`,
  };
}

export function buildPartnerLeadInsights(leads: PartnerLead[]): PartnerLeadInsightsResult {
  const sourceCounts = new Map<PartnerLeadSource, number>();
  const typeCounts = new Map<OrganizationType, number>();

  for (const lead of leads) {
    sourceCounts.set(lead.source, (sourceCounts.get(lead.source) ?? 0) + 1);
    if (lead.organization_type) {
      typeCounts.set(
        lead.organization_type,
        (typeCounts.get(lead.organization_type) ?? 0) + 1,
      );
    }
  }

  const topSources = [...sourceCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([source, count]) => ({
      source,
      label: PARTNER_LEAD_SOURCE_LABELS[source],
      count,
    }));

  const hotProspects = partnerLeadHotProspects(leads).slice(0, 5);

  const now = new Date();
  const upcomingFollowups = leads
    .filter((lead) => {
      if (!lead.next_followup_at || !OPEN_STATUSES.includes(lead.status)) {
        return false;
      }
      return new Date(lead.next_followup_at) > now;
    })
    .sort(
      (a, b) =>
        new Date(a.next_followup_at!).getTime() - new Date(b.next_followup_at!).getTime(),
    )
    .slice(0, 5);

  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentConversions = leads
    .filter((lead) => {
      if (!lead.converted_at) {
        return false;
      }
      return new Date(lead.converted_at) >= thirtyDaysAgo;
    })
    .sort((a, b) => new Date(b.converted_at!).getTime() - new Date(a.converted_at!).getTime())
    .slice(0, 5);

  const byOrganizationType = [...typeCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => ({ type, count }));

  const hasData =
    topSources.length > 0 ||
    hotProspects.length > 0 ||
    upcomingFollowups.length > 0 ||
    recentConversions.length > 0 ||
    byOrganizationType.length > 0;

  return {
    topSources,
    hotProspects,
    upcomingFollowups,
    recentConversions,
    byOrganizationType,
    hasData,
  };
}
