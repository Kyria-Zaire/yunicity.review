import type { PartnerOfferCreatePayload, PartnerOfferType } from "@yunicity/types";

import { fromDatetimeLocalValue } from "./datetime-local";
import {
  PASSPORT_OFFER_CREATE_CHECKLIST_CONDITIONS,
  PASSPORT_OFFER_CREATE_CHECKLIST_IMAGE,
  PASSPORT_OFFER_CREATE_CHECKLIST_PARTNER,
  PASSPORT_OFFER_CREATE_CHECKLIST_PERIOD,
  PASSPORT_OFFER_CREATE_CHECKLIST_VALUE,
  PASSPORT_OFFER_CREATE_STEP_BENEFIT,
  PASSPORT_OFFER_CREATE_STEP_ELIGIBILITY,
  PASSPORT_OFFER_CREATE_STEP_GENERAL,
  PASSPORT_OFFER_CREATE_STEP_REVIEW,
  PASSPORT_OFFER_CREATE_STEP_VALIDITY,
  PASSPORT_OFFER_CREATE_VALIDATION_CONDITIONS,
  PASSPORT_OFFER_CREATE_VALIDATION_DATES,
  PASSPORT_OFFER_CREATE_VALIDATION_DESCRIPTION,
  PASSPORT_OFFER_CREATE_VALIDATION_END_AFTER_START,
  PASSPORT_OFFER_CREATE_VALIDATION_TITLE,
  PASSPORT_OFFER_CREATE_VALIDATION_VALUE,
} from "./passport-offer-create-portal-labels";

export type PassportOfferCreateStepId =
  | "general"
  | "benefit"
  | "validity"
  | "eligibility"
  | "review";

export type PassportOfferCreateTierScope = "all" | "basic" | "silver";

export type PassportOfferCreateDraft = {
  organizationId: string;
  offerId: string | null;
  coverImageUrl: string;
  title: string;
  valueLabel: string;
  description: string;
  offerType: PartnerOfferType;
  conditions: string;
  singleUsePerHolder: boolean;
  nonCumulative: boolean;
  validFrom: string;
  validUntil: string;
  timezone: string;
  tierScope: PassportOfferCreateTierScope;
  passportRequired: boolean;
};

export type PassportOfferCreateValidation = {
  valid: boolean;
  message: string | null;
  step: PassportOfferCreateStepId | null;
};

export type PassportOfferCreateStep = {
  id: PassportOfferCreateStepId;
  label: string;
  order: number;
  sectionId: string;
};

export const PASSPORT_OFFER_CREATE_TITLE_MAX = 160;
export const PASSPORT_OFFER_CREATE_VALUE_MAX = 120;
export const PASSPORT_OFFER_CREATE_DESC_MAX = 2000;
export const PASSPORT_OFFER_CREATE_DESC_RECOMMENDED_MAX = 160;
export const PASSPORT_OFFER_CREATE_CONDITIONS_MAX = 500;
export const PASSPORT_OFFER_CREATE_DRAFT_STORAGE_KEY = "yunicity-passport-offer-create-draft-v1";
export const PASSPORT_OFFER_CREATE_FLASH_MAX_HOURS = 72;

export const PASSPORT_OFFER_CREATE_STEPS: PassportOfferCreateStep[] = [
  {
    id: "general",
    label: PASSPORT_OFFER_CREATE_STEP_GENERAL,
    order: 1,
    sectionId: "passport-offer-create-general",
  },
  {
    id: "benefit",
    label: PASSPORT_OFFER_CREATE_STEP_BENEFIT,
    order: 2,
    sectionId: "passport-offer-create-benefit",
  },
  {
    id: "validity",
    label: PASSPORT_OFFER_CREATE_STEP_VALIDITY,
    order: 3,
    sectionId: "passport-offer-create-validity",
  },
  {
    id: "eligibility",
    label: PASSPORT_OFFER_CREATE_STEP_ELIGIBILITY,
    order: 4,
    sectionId: "passport-offer-create-eligibility",
  },
  {
    id: "review",
    label: PASSPORT_OFFER_CREATE_STEP_REVIEW,
    order: 5,
    sectionId: "passport-offer-create-review",
  },
];

export function createEmptyPassportOfferCreateDraft(
  organizationId = "",
  coverImageUrl = "",
): PassportOfferCreateDraft {
  return {
    organizationId,
    offerId: null,
    coverImageUrl,
    title: "",
    valueLabel: "",
    description: "",
    offerType: "gift",
    conditions: "",
    singleUsePerHolder: true,
    nonCumulative: true,
    validFrom: "",
    validUntil: "",
    timezone: "Europe/Paris",
    tierScope: "all",
    passportRequired: true,
  };
}

export function buildPassportOfferCreateDescription(draft: PassportOfferCreateDraft): string {
  const value = draft.valueLabel.trim();
  const body = draft.description.trim();
  const conditions = draft.conditions.trim();
  const parts = [body];
  if (value && !body.toLowerCase().includes(value.toLowerCase())) {
    parts.unshift(value);
  }
  if (conditions && !body.includes(conditions)) {
    parts.push(conditions);
  }
  return parts.filter(Boolean).join("\n\n").trim();
}

export function inferPassportOfferCreateFlash(draft: PassportOfferCreateDraft): {
  isFlash: boolean;
  flashEndsAt: string | null;
} {
  const startIso = fromDatetimeLocalValue(draft.validFrom);
  const endIso = fromDatetimeLocalValue(draft.validUntil);
  if (!startIso || !endIso) {
    return { isFlash: false, flashEndsAt: null };
  }
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
    return { isFlash: false, flashEndsAt: null };
  }
  const hours = (end - start) / (1000 * 60 * 60);
  if (hours <= PASSPORT_OFFER_CREATE_FLASH_MAX_HOURS) {
    return { isFlash: true, flashEndsAt: endIso };
  }
  return { isFlash: false, flashEndsAt: null };
}

export function buildPassportOfferCreatePayload(
  draft: PassportOfferCreateDraft,
): PartnerOfferCreatePayload {
  const flash = inferPassportOfferCreateFlash(draft);
  return {
    organization_id: draft.organizationId,
    title: draft.title.trim(),
    description: buildPassportOfferCreateDescription(draft) || null,
    offer_type: draft.offerType,
    valid_from: fromDatetimeLocalValue(draft.validFrom),
    valid_until: fromDatetimeLocalValue(draft.validUntil),
    redemption_limit: draft.singleUsePerHolder ? 1 : 2,
    tier_code_required: draft.tierScope === "all" ? null : draft.tierScope,
    is_flash: flash.isFlash,
    flash_ends_at: flash.flashEndsAt,
  };
}

export function validatePassportOfferCreateDraft(
  draft: PassportOfferCreateDraft,
): PassportOfferCreateValidation {
  if (!draft.title.trim()) {
    return { valid: false, message: PASSPORT_OFFER_CREATE_VALIDATION_TITLE, step: "general" };
  }
  if (!draft.valueLabel.trim()) {
    return { valid: false, message: PASSPORT_OFFER_CREATE_VALIDATION_VALUE, step: "general" };
  }
  if (draft.description.trim().length < 20) {
    return {
      valid: false,
      message: PASSPORT_OFFER_CREATE_VALIDATION_DESCRIPTION,
      step: "general",
    };
  }
  if (draft.conditions.trim().length < 10) {
    return {
      valid: false,
      message: PASSPORT_OFFER_CREATE_VALIDATION_CONDITIONS,
      step: "benefit",
    };
  }
  if (!draft.validFrom.trim() || !draft.validUntil.trim()) {
    return { valid: false, message: PASSPORT_OFFER_CREATE_VALIDATION_DATES, step: "validity" };
  }
  const startIso = fromDatetimeLocalValue(draft.validFrom);
  const endIso = fromDatetimeLocalValue(draft.validUntil);
  if (!startIso || !endIso) {
    return { valid: false, message: PASSPORT_OFFER_CREATE_VALIDATION_DATES, step: "validity" };
  }
  if (new Date(endIso).getTime() <= new Date(startIso).getTime()) {
    return {
      valid: false,
      message: PASSPORT_OFFER_CREATE_VALIDATION_END_AFTER_START,
      step: "validity",
    };
  }
  return { valid: true, message: null, step: null };
}

export type PassportOfferCreateChecklistState = {
  partner: boolean;
  value: boolean;
  conditions: boolean;
  period: boolean;
  image: boolean;
};

export function passportOfferCreateChecklistState(
  draft: PassportOfferCreateDraft,
  hasPartner: boolean,
): PassportOfferCreateChecklistState {
  return {
    partner: hasPartner && Boolean(draft.organizationId),
    value: draft.valueLabel.trim().length >= 4,
    conditions: draft.conditions.trim().length >= 10,
    period: Boolean(draft.validFrom.trim() && draft.validUntil.trim()),
    image: Boolean(draft.coverImageUrl.trim()),
  };
}

export const PASSPORT_OFFER_CREATE_CHECKLIST_ITEMS = [
  { key: "partner" as const, label: PASSPORT_OFFER_CREATE_CHECKLIST_PARTNER },
  { key: "value" as const, label: PASSPORT_OFFER_CREATE_CHECKLIST_VALUE },
  { key: "conditions" as const, label: PASSPORT_OFFER_CREATE_CHECKLIST_CONDITIONS },
  { key: "period" as const, label: PASSPORT_OFFER_CREATE_CHECKLIST_PERIOD },
  { key: "image" as const, label: PASSPORT_OFFER_CREATE_CHECKLIST_IMAGE },
];

export function formatPassportOfferCreatePreviewDate(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function passportOfferCreateStepProgressPercent(step: PassportOfferCreateStepId): number {
  const index = PASSPORT_OFFER_CREATE_STEPS.findIndex((item) => item.id === step);
  const safeIndex = index >= 0 ? index : 0;
  return Math.round(((safeIndex + 1) / PASSPORT_OFFER_CREATE_STEPS.length) * 100);
}
