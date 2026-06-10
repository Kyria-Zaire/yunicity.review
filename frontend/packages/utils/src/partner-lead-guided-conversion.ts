/** Guided conversion helpers (LEADS-V3-04) — UX pure, POST /convert unchanged. */

import type { PartnerLead, PartnerLeadStatus } from "@yunicity/types";

import { isAuthError } from "./auth/auth-errors";
import { partnerLeadIsConverted } from "./partner-lead-360";

export type PartnerLeadConversionStepId =
  | "qualification"
  | "interest"
  | "meeting"
  | "agreement";

export interface PartnerLeadConversionStep {
  id: PartnerLeadConversionStepId;
  label: string;
  reached: boolean;
}

export interface PartnerLeadConversionReadiness {
  title: string;
  microcopy: string;
  footer: string | null;
  steps: PartnerLeadConversionStep[];
  showChecklist: boolean;
  isNetworkReady: boolean;
}

export interface PartnerLeadConversionSummaryField {
  label: string;
  value: string;
}

export const PARTNER_LEAD_CONVERSION_READINESS_TITLE = "Checklist d'intégration";

const CONVERSION_CHECKLIST_DESCRIPTION =
  "Tous les prérequis nécessaires à l'activation sont réunis.";

export const PARTNER_LEAD_CONVERSION_DEFAULT_ERROR =
  "Impossible d'intégrer ce partenaire. Réessayez ou contactez un administrateur.";

const CONVERSION_STEP_LABELS: Record<PartnerLeadConversionStepId, string> = {
  qualification: "Qualification",
  interest: "Intérêt confirmé",
  meeting: "Rendez-vous effectué",
  agreement: "Accord obtenu",
};

const READINESS_MICROCOPY: Partial<Record<PartnerLeadStatus, string>> = {
  new: "Le prospect est encore en découverte.",
  contacted: "La relation débute.",
  interested: "L'intérêt est confirmé.",
  meeting_scheduled: "Le partenariat se construit.",
  signed: CONVERSION_CHECKLIST_DESCRIPTION,
  converted: CONVERSION_CHECKLIST_DESCRIPTION,
};

const CHECKLIST_VISIBLE_STATUSES: PartnerLeadStatus[] = [
  "meeting_scheduled",
  "signed",
  "converted",
];

const QUALIFICATION_REACHED: PartnerLeadStatus[] = [
  "contacted",
  "interested",
  "meeting_scheduled",
  "signed",
  "converted",
];

const INTEREST_REACHED: PartnerLeadStatus[] = [
  "interested",
  "meeting_scheduled",
  "signed",
  "converted",
];

const MEETING_REACHED: PartnerLeadStatus[] = ["meeting_scheduled", "signed", "converted"];

const AGREEMENT_REACHED: PartnerLeadStatus[] = ["signed", "converted"];

export function partnerLeadConversionReadinessMicrocopy(status: PartnerLeadStatus): string {
  return READINESS_MICROCOPY[status] ?? "Le parcours d'intégration progresse.";
}

export function partnerLeadConversionSteps(status: PartnerLeadStatus): PartnerLeadConversionStep[] {
  return [
    {
      id: "qualification",
      label: CONVERSION_STEP_LABELS.qualification,
      reached: QUALIFICATION_REACHED.includes(status),
    },
    {
      id: "interest",
      label: CONVERSION_STEP_LABELS.interest,
      reached: INTEREST_REACHED.includes(status),
    },
    {
      id: "meeting",
      label: CONVERSION_STEP_LABELS.meeting,
      reached: MEETING_REACHED.includes(status),
    },
    {
      id: "agreement",
      label: CONVERSION_STEP_LABELS.agreement,
      reached: AGREEMENT_REACHED.includes(status),
    },
  ];
}

function partnerLeadConversionReadinessFooter(status: PartnerLeadStatus): string | null {
  if (status === "signed") {
    return "Le dossier peut désormais être activé.";
  }
  if (status === "converted") {
    return "Le partenaire est désormais actif dans le réseau.";
  }
  return null;
}

export function buildPartnerLeadConversionReadiness(
  lead: PartnerLead,
): PartnerLeadConversionReadiness {
  const showChecklist = CHECKLIST_VISIBLE_STATUSES.includes(lead.status);

  return {
    title: PARTNER_LEAD_CONVERSION_READINESS_TITLE,
    microcopy: showChecklist
      ? CONVERSION_CHECKLIST_DESCRIPTION
      : partnerLeadConversionReadinessMicrocopy(lead.status),
    footer: partnerLeadConversionReadinessFooter(lead.status),
    steps: partnerLeadConversionSteps(lead.status),
    showChecklist,
    isNetworkReady: lead.status === "signed" || lead.status === "converted",
  };
}

export function partnerLeadGuidedConvertDisabledReason(lead: PartnerLead): string | null {
  if (partnerLeadIsConverted(lead)) {
    return "Ce prospect est déjà intégré au réseau.";
  }
  if (lead.status === "rejected") {
    return "Un prospect refusé ne peut pas être intégré depuis cette fiche.";
  }
  if (lead.status === "archived") {
    return "Un prospect archivé doit être réactivé avant intégration.";
  }
  if (!lead.city?.trim()) {
    return "Ajoutez une ville au prospect avant de l'intégrer au réseau.";
  }
  if (lead.status !== "signed") {
    return "Le prospect doit être signé avant son intégration.";
  }
  return null;
}

export function partnerLeadGuidedCanConvert(lead: PartnerLead): boolean {
  return partnerLeadGuidedConvertDisabledReason(lead) === null;
}

export function partnerLeadConvertErrorMessage(error: unknown): string {
  if (isAuthError(error)) {
    switch (error.code) {
      case "PARTNER_LEAD_ALREADY_CONVERTED":
        return "Ce prospect a déjà rejoint le réseau.";
      case "OWNER_USER_NOT_FOUND":
        return "Le responsable indiqué est introuvable. Vérifiez la référence ou choisissez un autre compte.";
      case "ORGANIZATION_NOT_FOUND":
        return "L'organisation cible est introuvable. Réessayez ou contactez un administrateur.";
      case "PARTNER_LEAD_MISSING_CITY":
        return "La ville du prospect est requise pour créer le partenaire.";
      default:
        if (error.message?.trim()) {
          return error.message;
        }
    }
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return PARTNER_LEAD_CONVERSION_DEFAULT_ERROR;
}

export interface PartnerLeadConversionSuccessCopy {
  title: string;
  subtitle: string;
  body: string;
  partnersCta: string;
  passportCta: string;
  pipelineCta: string;
}

export function buildPartnerLeadConversionSuccessCopy(
  lead: PartnerLead,
): PartnerLeadConversionSuccessCopy {
  const city = lead.city?.trim() || "votre territoire";

  return {
    title: "Bienvenue dans le réseau Yunicity",
    subtitle: `${lead.name} rejoint officiellement les acteurs engagés de ${city}.`,
    body: "Vous pouvez désormais poursuivre son activation via Passport Ops ou revenir au réseau partenaires.",
    partnersCta: "Voir le réseau partenaires",
    passportCta: "Continuer dans Passport Ops",
    pipelineCta: "Retour au pipeline",
  };
}

/** @deprecated Use buildPartnerLeadConversionSuccessCopy(lead) */
export function partnerLeadConversionSuccessCopy(): {
  title: string;
  description: string;
  passportHint: string;
  passportCta: string;
} {
  return {
    title: "Bienvenue dans le réseau Yunicity",
    description: "Le prospect a rejoint le réseau Yunicity.",
    passportHint: "Configurez ses avantages et ses opérations Passport.",
    passportCta: "Passport Ops",
  };
}

export function partnerLeadConversionPanelCopy(): {
  title: string;
  passportTitle: string;
  passportDescription: string;
  passportCta: string;
  networkTitle: string;
  networkDescription: string;
  networkCta: string;
} {
  return {
    title: "Prochaines étapes",
    passportTitle: "Passeport Yunicity",
    passportDescription: "Configurez ses avantages et ses opérations Passport.",
    passportCta: "Ouvrir Passport Ops",
    networkTitle: "Réseau partenaires",
    networkDescription: "Retrouvez ce partenaire parmi les acteurs actifs.",
    networkCta: "Voir les partenaires",
  };
}
