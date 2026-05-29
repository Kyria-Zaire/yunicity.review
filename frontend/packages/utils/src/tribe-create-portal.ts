import type { TribeVisibility } from "@yunicity/types";

import { TRIBE_CATEGORY_LABELS } from "./tribe-labels";
import {
  TRIBE_CREATE_VALIDATION_CATEGORY,
  TRIBE_CREATE_VALIDATION_CHARTER,
  TRIBE_CREATE_VALIDATION_DESC,
  TRIBE_CREATE_VALIDATION_NAME,
  TRIBE_CREATE_STEP_CONFIRM,
  TRIBE_CREATE_STEP_INFO,
  TRIBE_CREATE_STEP_INVITE,
  TRIBE_CREATE_STEP_PERSONALIZE,
  TRIBE_CREATE_STEP_RULES,
} from "./tribe-create-portal-labels";

export type TribeCreateStepId = "info" | "personalize" | "rules" | "invite" | "confirm";

export type TribeCreateStep = {
  id: TribeCreateStepId;
  label: string;
  order: number;
};

export type TribeCreateDraft = {
  name: string;
  category: string;
  description: string;
  city: string;
  visibility: TribeVisibility;
  coverImageUrl: string;
  charterAccepted: boolean;
};

export type TribeCreateValidation = {
  valid: boolean;
  message: string | null;
};

export const TRIBE_CREATE_NAME_MAX = 50;
export const TRIBE_CREATE_DESC_MAX = 200;

export const TRIBE_CREATE_STEPS: TribeCreateStep[] = [
  { id: "info", label: TRIBE_CREATE_STEP_INFO, order: 1 },
  { id: "personalize", label: TRIBE_CREATE_STEP_PERSONALIZE, order: 2 },
  { id: "rules", label: TRIBE_CREATE_STEP_RULES, order: 3 },
  { id: "invite", label: TRIBE_CREATE_STEP_INVITE, order: 4 },
  { id: "confirm", label: TRIBE_CREATE_STEP_CONFIRM, order: 5 },
];

export const TRIBE_CREATE_CATEGORY_OPTIONS = Object.entries(TRIBE_CATEGORY_LABELS).map(
  ([value, label]) => ({ value, label }),
);

export function createEmptyTribeCreateDraft(city = "Reims"): TribeCreateDraft {
  return {
    name: "",
    category: "",
    description: "",
    city,
    visibility: "public",
    coverImageUrl: "",
    charterAccepted: false,
  };
}

export function validateTribeCreateStep(
  stepId: TribeCreateStepId,
  draft: TribeCreateDraft,
): TribeCreateValidation {
  if (stepId === "info") {
    if (draft.name.trim().length < 2) {
      return { valid: false, message: TRIBE_CREATE_VALIDATION_NAME };
    }
    if (draft.name.trim().length > TRIBE_CREATE_NAME_MAX) {
      return { valid: false, message: TRIBE_CREATE_VALIDATION_NAME };
    }
    if (!draft.category.trim()) {
      return { valid: false, message: TRIBE_CREATE_VALIDATION_CATEGORY };
    }
    const desc = draft.description.trim();
    if (desc.length < 10 || desc.length > TRIBE_CREATE_DESC_MAX) {
      return { valid: false, message: TRIBE_CREATE_VALIDATION_DESC };
    }
  }
  if (stepId === "rules" && !draft.charterAccepted) {
    return { valid: false, message: TRIBE_CREATE_VALIDATION_CHARTER };
  }
  return { valid: true, message: null };
}

export function nextTribeCreateStep(stepId: TribeCreateStepId): TribeCreateStepId | null {
  const index = TRIBE_CREATE_STEPS.findIndex((step) => step.id === stepId);
  return TRIBE_CREATE_STEPS[index + 1]?.id ?? null;
}

export function previousTribeCreateStep(stepId: TribeCreateStepId): TribeCreateStepId | null {
  const index = TRIBE_CREATE_STEPS.findIndex((step) => step.id === stepId);
  return TRIBE_CREATE_STEPS[index - 1]?.id ?? null;
}

export function buildTribeCreatePayload(draft: TribeCreateDraft) {
  return {
    name: draft.name.trim(),
    description: draft.description.trim(),
    city: draft.city.trim() || "Reims",
    category: draft.category,
    visibility: draft.visibility,
    cover_image_url: draft.coverImageUrl.trim() || undefined,
    charter_accepted: draft.charterAccepted,
  };
}

export function tribeCreateVisibilityLabel(visibility: TribeVisibility): string {
  return visibility === "private_invite" ? "Privée" : "Publique";
}
