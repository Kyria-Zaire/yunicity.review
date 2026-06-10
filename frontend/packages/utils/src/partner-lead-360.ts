/** Prospect 360° helpers (LEADS-V3-02) — UX pure, no business rules. */

import type { PartnerLead, PartnerLeadStatus } from "@yunicity/types";

import {
  partnerLeadGuidedCanConvert,
  partnerLeadGuidedConvertDisabledReason,
} from "./partner-lead-guided-conversion";

export type PartnerLeadRelationSignalType =
  | "info"
  | "active"
  | "success"
  | "warning"
  | "neutral"
  | "blocked";

export interface PartnerLeadRelationSignal {
  type: PartnerLeadRelationSignalType;
  title: string;
  description: string;
}

export interface PartnerLead360Action {
  id: string;
  title: string;
  description: string;
  ctaLabel: string;
  href?: string;
  action?: "edit" | "convert";
}

export interface PartnerLeadTimelineEvent {
  id: string;
  label: string;
  detail: string;
  at: string | null;
  kind: "creation" | "contact" | "followup" | "conversion" | "update" | "notes";
}

export interface PartnerLeadReadiness {
  percent: number;
  label: string;
  hint: string;
}

const READINESS_BY_STATUS: Record<PartnerLeadStatus, PartnerLeadReadiness> = {
  new: {
    percent: 10,
    label: "Premier contact",
    hint: "La relation démarre à peine.",
  },
  contacted: {
    percent: 25,
    label: "Qualification en cours",
    hint: "Le premier échange est engagé.",
  },
  interested: {
    percent: 50,
    label: "Intérêt confirmé",
    hint: "Le prospect manifeste de l'intérêt.",
  },
  meeting_scheduled: {
    percent: 75,
    label: "Conversion en préparation",
    hint: "Un rendez-vous est planifié.",
  },
  signed: {
    percent: 100,
    label: "Parcours complété",
    hint: "Le dossier est prêt pour son activation.",
  },
  converted: {
    percent: 100,
    label: "Activation réussie",
    hint: "Le partenaire est désormais intégré.",
  },
  rejected: {
    percent: 0,
    label: "Prospection interrompue",
    hint: "Ce contact n'est plus actif.",
  },
  archived: {
    percent: 0,
    label: "Prospect archivé",
    hint: "Ce dossier est en sommeil.",
  },
};

const RELATION_SIGNAL_BY_STATUS: Record<PartnerLeadStatus, PartnerLeadRelationSignal> = {
  new: {
    type: "info",
    title: "Nouveau contact",
    description: "Première qualification à effectuer.",
  },
  contacted: {
    type: "active",
    title: "Relation engagée",
    description: "Le premier échange a eu lieu.",
  },
  interested: {
    type: "active",
    title: "Intérêt confirmé",
    description: "Le prospect manifeste un intérêt.",
  },
  meeting_scheduled: {
    type: "warning",
    title: "Conversion en préparation",
    description: "Un rendez-vous est prévu.",
  },
  signed: {
    type: "success",
    title: "Accord obtenu",
    description: "Le partenaire a validé son entrée dans le réseau Yunicity.",
  },
  converted: {
    type: "success",
    title: "Partenaire activé",
    description: "Ce partenaire contribue désormais au réseau Yunicity.",
  },
  rejected: {
    type: "blocked",
    title: "Prospection interrompue",
    description: "Ce contact n'est plus suivi activement.",
  },
  archived: {
    type: "neutral",
    title: "Prospect archivé",
    description: "Ce dossier est conservé sans action immédiate.",
  },
};

const TERMINAL_STATUSES: PartnerLeadStatus[] = ["converted", "rejected", "archived"];

export function partnerLeadIsConverted(lead: PartnerLead): boolean {
  return lead.status === "converted" || lead.converted_organization_id !== null;
}

export function buildPartnerLeadRelationSignal(lead: PartnerLead): PartnerLeadRelationSignal {
  return RELATION_SIGNAL_BY_STATUS[lead.status];
}

export function partnerLeadReadiness(lead: PartnerLead): PartnerLeadReadiness {
  return READINESS_BY_STATUS[lead.status];
}

export function partnerLeadConvertDisabledReason(lead: PartnerLead): string | null {
  return partnerLeadGuidedConvertDisabledReason(lead);
}

export function partnerLeadCanConvert(lead: PartnerLead): boolean {
  return partnerLeadGuidedCanConvert(lead);
}

function isFollowupDue(lead: PartnerLead, now: Date = new Date()): boolean {
  if (!lead.next_followup_at || TERMINAL_STATUSES.includes(lead.status)) {
    return false;
  }
  return new Date(lead.next_followup_at) <= now;
}

export function buildPartnerLead360Action(
  lead: PartnerLead,
  now: Date = new Date(),
): PartnerLead360Action {
  if (isFollowupDue(lead, now)) {
    return {
      id: "followup",
      title: "Relance à effectuer",
      description: "La prochaine action planifiée est arrivée à échéance.",
      ctaLabel: "Mettre à jour le suivi",
      action: "edit",
    };
  }

  if (partnerLeadIsConverted(lead) && lead.converted_organization_id) {
    return {
      id: "partner",
      title: "Consulter le partenaire",
      description: "Ce prospect a rejoint le réseau Yunicity.",
      ctaLabel: "Ouvrir la fiche partenaire",
      href: `/partners/organizations/${lead.converted_organization_id}`,
    };
  }

  switch (lead.status) {
    case "new":
      return {
        id: "contact",
        title: "Engager le premier contact",
        description: "Qualifiez ce prospect après votre premier échange terrain.",
        ctaLabel: "Contacter",
        action: "edit",
      };
    case "contacted":
      return {
        id: "qualify",
        title: "Poursuivre la qualification",
        description: "Confirmez l'intérêt et précisez les attentes du prospect.",
        ctaLabel: "Qualifier",
        action: "edit",
      };
    case "interested":
      return {
        id: "meeting",
        title: "Organiser un rendez-vous",
        description: "Planifiez un échange pour finaliser l'intégration.",
        ctaLabel: "Organiser un RDV",
        action: "edit",
      };
    case "meeting_scheduled":
      return {
        id: "finalize",
        title: "Finaliser avant conversion",
        description: "Validez les derniers points avant l'intégration au réseau.",
        ctaLabel: "Finaliser",
        action: "edit",
      };
    case "signed":
      return {
        id: "convert",
        title: "Accueillir ce partenaire",
        description: "Le dossier est prêt : vous pouvez l'ajouter au réseau Yunicity.",
        ctaLabel: "Ajouter au réseau Yunicity",
        action: "convert",
      };
    case "rejected":
    case "archived":
      return {
        id: "pipeline",
        title: "Retour au pipeline",
        description: "Consultez les autres prospects actifs du territoire.",
        ctaLabel: "Voir le pipeline",
        href: "/partner-leads",
      };
    default:
      return {
        id: "edit",
        title: "Mettre à jour le suivi",
        description: "Enregistrez l'avancement de la relation.",
        ctaLabel: "Modifier",
        action: "edit",
      };
  }
}

export function buildPartnerLeadTimeline(lead: PartnerLead): PartnerLeadTimelineEvent[] {
  const events: PartnerLeadTimelineEvent[] = [
    {
      id: "creation",
      kind: "creation",
      label: "Création",
      detail: "Prospect enregistré dans le pipeline.",
      at: lead.created_at,
    },
  ];

  if (lead.last_contacted_at) {
    events.push({
      id: "last-contact",
      kind: "contact",
      label: "Dernier contact",
      detail: "Dernier échange terrain enregistré.",
      at: lead.last_contacted_at,
    });
  }

  if (lead.next_followup_at) {
    events.push({
      id: "followup",
      kind: "followup",
      label: "Relance prévue",
      detail: "Prochaine action planifiée.",
      at: lead.next_followup_at,
    });
  }

  if (lead.converted_at) {
    events.push({
      id: "conversion",
      kind: "conversion",
      label: "Partenaire intégré",
      detail: `${lead.name} rejoint officiellement le réseau Yunicity.`,
      at: lead.converted_at,
    });
  }

  if (lead.updated_at && lead.updated_at !== lead.created_at) {
    events.push({
      id: "update",
      kind: "update",
      label: "Dernière mise à jour",
      detail: "Modification du dossier prospect.",
      at: lead.updated_at,
    });
  }

  if (lead.notes?.trim()) {
    events.push({
      id: "notes",
      kind: "notes",
      label: "Note enregistrée",
      detail: lead.notes.trim(),
      at: lead.updated_at,
    });
  }

  return events.sort((a, b) => {
    const aTime = a.at ? new Date(a.at).getTime() : 0;
    const bTime = b.at ? new Date(b.at).getTime() : 0;
    return bTime - aTime;
  });
}

export function partnerLeadTimelineIsEmpty(lead: PartnerLead): boolean {
  return (
    !lead.last_contacted_at &&
    !lead.next_followup_at &&
    !lead.converted_at &&
    !lead.notes?.trim() &&
    lead.updated_at === lead.created_at
  );
}

export function partnerLeadTimelineEmptyCopy(): { title: string; message: string } {
  return {
    title: "Historique en construction",
    message: "L'historique apparaîtra au fil des échanges.",
  };
}

export function partnerLeadNotesEmptyCopy(): string {
  return "Aucune note enregistrée.";
}

export function partnerLeadTagsEmptyCopy(): string {
  return "Aucun tag associé.";
}

export function partnerLeadHeroConvertCtaLabel(lead: PartnerLead): string {
  if (lead.status === "converted" || partnerLeadIsConverted(lead)) {
    return "Partenaire activé";
  }
  if (lead.status === "signed") {
    return "Ajouter au réseau Yunicity";
  }
  return "Disponible après accord";
}
