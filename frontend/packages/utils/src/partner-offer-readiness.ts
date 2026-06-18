/** Partner offer value categories — RF-02A */

import type { PartnerOfferType } from "@yunicity/types";

export type PartnerOfferValueCategory =
  | "percent_discount"
  | "free_item"
  | "loyalty_reward"
  | "exclusive_access"
  | "event_benefit"
  | "welcome_bonus";

export type PartnerOfferReadinessLevel = "ready" | "partial" | "not_ready";

export type PartnerOfferReadinessCheckSeverity = "ok" | "warning" | "error";

export interface PartnerOfferReadinessCheck {
  key: string;
  label: string;
  passed: boolean;
  severity: PartnerOfferReadinessCheckSeverity;
}

export interface PartnerOfferReadinessFields {
  readiness: PartnerOfferReadinessLevel;
  is_passport_eligible: boolean;
  is_placeholder: boolean;
  value_category: PartnerOfferValueCategory;
  value_category_label: string;
  human_description: string;
  checks: PartnerOfferReadinessCheck[];
}

export const PARTNER_OFFER_VALUE_CATEGORY_LABELS: Record<PartnerOfferValueCategory, string> = {
  percent_discount: "Réduction",
  free_item: "Produit offert",
  loyalty_reward: "Récompense fidélité",
  exclusive_access: "Accès exclusif",
  event_benefit: "Avantage événement",
  welcome_bonus: "Bonus bienvenue",
};

export const PARTNER_OFFER_READINESS_LABELS: Record<PartnerOfferReadinessLevel, string> = {
  ready: "Prête",
  partial: "Partielle",
  not_ready: "Non prête",
};

const PLACEHOLDER_DESCRIPTION_SNIPPET = "présentez votre passport yunicity pour découvrir";
const PLACEHOLDER_CONDITIONS_SNIPPET = "offre pilote, modalités confirmées sur place";

const VAGUE_VALUE_LABELS = new Set([
  "avantage membre",
  "offre pilote",
  "découverte",
  "offre partenaire",
  "avantage passport",
]);

const DEFAULT_CATEGORY_BY_OFFER_TYPE: Record<PartnerOfferType, PartnerOfferValueCategory> = {
  drink: "free_item",
  discount: "percent_discount",
  vip: "exclusive_access",
  gift: "free_item",
  event_access: "event_benefit",
  custom: "exclusive_access",
};

export function partnerOfferValueCategoryLabel(category: PartnerOfferValueCategory): string {
  return PARTNER_OFFER_VALUE_CATEGORY_LABELS[category] ?? "Avantage";
}

export function partnerOfferReadinessLabel(level: PartnerOfferReadinessLevel): string {
  return PARTNER_OFFER_READINESS_LABELS[level];
}

export function inferPartnerOfferValueCategory(input: {
  offer_type: PartnerOfferType;
  value_label?: string | null;
  title?: string | null;
  metadata?: Record<string, unknown> | null;
}): PartnerOfferValueCategory {
  const raw = input.metadata?.value_category;
  if (typeof raw === "string" && raw in PARTNER_OFFER_VALUE_CATEGORY_LABELS) {
    return raw as PartnerOfferValueCategory;
  }

  const haystack = [input.value_label, input.title]
    .filter((part): part is string => Boolean(part?.trim()))
    .join(" ")
    .toLowerCase();

  if (haystack.includes("bienvenue") || haystack.includes("première visite")) {
    return "welcome_bonus";
  }
  if (haystack.includes("fidélité") || haystack.includes("fidelite")) {
    return "loyalty_reward";
  }
  if (haystack.includes("%") || haystack.includes("réduction") || haystack.includes("reduction")) {
    return "percent_discount";
  }

  return DEFAULT_CATEGORY_BY_OFFER_TYPE[input.offer_type] ?? "exclusive_access";
}

export function isPartnerOfferPlaceholder(input: {
  title: string;
  description?: string | null;
  value_label?: string | null;
  conditions?: string | null;
}): boolean {
  const description = (input.description ?? "").trim().toLowerCase();
  const conditions = (input.conditions ?? "").trim().toLowerCase();
  const valueLabel = (input.value_label ?? "").trim().toLowerCase();
  const title = (input.title ?? "").trim().toLowerCase();

  if (description.includes(PLACEHOLDER_DESCRIPTION_SNIPPET)) return true;
  if (conditions.includes(PLACEHOLDER_CONDITIONS_SNIPPET)) return true;
  if (
    VAGUE_VALUE_LABELS.has(valueLabel) &&
    (description.includes(PLACEHOLDER_DESCRIPTION_SNIPPET) || description.length < 25)
  ) {
    return true;
  }
  if (["accueil passport", "avantage passport", "avantage membre yunicity"].includes(title)) {
    return true;
  }
  return false;
}

export function partnerOfferHumanDescription(input: {
  title: string;
  value_label?: string | null;
  description?: string | null;
  conditions?: string | null;
  offer_type?: PartnerOfferType;
  value_category?: PartnerOfferValueCategory;
  metadata?: Record<string, unknown> | null;
}): string {
  const category =
    input.value_category ??
    (input.offer_type
      ? inferPartnerOfferValueCategory({
          offer_type: input.offer_type,
          value_label: input.value_label,
          title: input.title,
          metadata: input.metadata,
        })
      : "exclusive_access");
  const benefit =
    input.value_label?.trim() || input.description?.trim() || input.title.trim();
  const base = `${partnerOfferValueCategoryLabel(category)} — ${benefit}`;
  const conditions = input.conditions?.trim();
  return conditions ? `${base}. ${conditions}` : base;
}

export interface PartnerOfferReadinessInput {
  title: string;
  description?: string | null;
  value_label?: string | null;
  conditions?: string | null;
  offer_type: PartnerOfferType;
  offer_status: string;
  is_active: boolean;
  valid_from?: string | null;
  valid_until?: string | null;
  partner_status?: string | null;
  org_visibility?: string | null;
  org_verified?: boolean;
  metadata?: Record<string, unknown> | null;
}

function datesValid(
  validFrom: string | null | undefined,
  validUntil: string | null | undefined,
  now: Date,
): boolean {
  if (validFrom) {
    const start = new Date(validFrom);
    if (!Number.isNaN(start.getTime()) && start.getTime() > now.getTime()) return false;
  }
  if (validUntil) {
    const end = new Date(validUntil);
    if (!Number.isNaN(end.getTime()) && end.getTime() < now.getTime()) return false;
  }
  return true;
}

function partnerIsActive(partnerStatus: string | null | undefined): boolean {
  if (!partnerStatus) return false;
  return ["active", "premium", "founding_partner"].includes(partnerStatus);
}

export function partnerOfferReadiness(
  input: PartnerOfferReadinessInput,
  now = new Date(),
): PartnerOfferReadinessFields {
  const placeholder = isPartnerOfferPlaceholder(input);
  const valueCategory = inferPartnerOfferValueCategory({
    offer_type: input.offer_type,
    value_label: input.value_label,
    title: input.title,
    metadata: input.metadata,
  });

  const titleOk = input.title.trim().length >= 3;
  const value = (input.value_label ?? "").trim();
  const description = (input.description ?? "").trim();
  const benefitOk =
    !placeholder &&
    ((value.length >= 4 && !VAGUE_VALUE_LABELS.has(value.toLowerCase())) ||
      (description.length >= 20 && !description.toLowerCase().includes(PLACEHOLDER_DESCRIPTION_SNIPPET)));
  const conditionsText = (input.conditions ?? "").trim();
  const conditionsOk =
    !placeholder &&
    conditionsText.length >= 10 &&
    !conditionsText.toLowerCase().includes(PLACEHOLDER_CONDITIONS_SNIPPET);
  const visibilityOk = input.offer_status === "published" && input.is_active;
  const partnerOk = partnerIsActive(input.partner_status) && Boolean(input.org_verified);
  const orgPublic = input.org_visibility === "public";
  const datesOk = datesValid(input.valid_from, input.valid_until, now);

  const checks: PartnerOfferReadinessCheck[] = [
    {
      key: "title_defined",
      label: "Titre défini",
      passed: titleOk,
      severity: titleOk ? "ok" : "error",
    },
    {
      key: "benefit_defined",
      label: "Avantage défini",
      passed: benefitOk,
      severity: benefitOk ? "ok" : "error",
    },
    {
      key: "conditions_defined",
      label: "Conditions définies",
      passed: conditionsOk,
      severity: conditionsOk ? "ok" : "warning",
    },
    {
      key: "visibility_enabled",
      label: "Visibilité activée",
      passed: visibilityOk,
      severity: visibilityOk ? "ok" : "warning",
    },
    {
      key: "partner_active",
      label: "Partenaire actif",
      passed: partnerOk,
      severity: partnerOk ? "ok" : "error",
    },
    {
      key: "dates_valid",
      label: "Dates de validité",
      passed: datesOk,
      severity: datesOk ? "ok" : "warning",
    },
    {
      key: "not_placeholder",
      label: "Contenu réel (non placeholder)",
      passed: !placeholder,
      severity: placeholder ? "error" : "ok",
    },
  ];

  const coreReady = titleOk && benefitOk && conditionsOk && !placeholder && partnerOk;
  let readiness: PartnerOfferReadinessLevel;
  if (coreReady && visibilityOk && datesOk && orgPublic) {
    readiness = "ready";
  } else if (placeholder || !titleOk || !partnerOk) {
    readiness = "not_ready";
  } else if (coreReady || (titleOk && benefitOk)) {
    readiness = "partial";
  } else {
    readiness = "not_ready";
  }

  const isPassportEligible =
    readiness === "ready" && visibilityOk && datesOk && orgPublic && !placeholder;

  return {
    readiness,
    is_passport_eligible: isPassportEligible,
    is_placeholder: placeholder,
    value_category: valueCategory,
    value_category_label: partnerOfferValueCategoryLabel(valueCategory),
    human_description: partnerOfferHumanDescription({
      title: input.title,
      value_label: input.value_label,
      description: input.description,
      conditions: input.conditions,
      offer_type: input.offer_type,
      value_category: valueCategory,
      metadata: input.metadata,
    }),
    checks,
  };
}

/** Re-export type label helper used by public catalog. */
export { partnerOfferTypeLabel, partnerOfferValueLabel } from "./partner-offer-public";
