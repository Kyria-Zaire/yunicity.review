import type { TribeVisibility } from "@yunicity/types";

import { TRIBE_CATEGORY_LABELS } from "./tribe-labels";
import {
  TRIBE_CREATE_VALIDATION_CATEGORY,
  TRIBE_CREATE_VALIDATION_CHARTER,
  TRIBE_CREATE_VALIDATION_CITY,
  TRIBE_CREATE_VALIDATION_DESC,
  TRIBE_CREATE_VALIDATION_NAME,
  TRIBE_CREATE_STEP_ACCESS,
  TRIBE_CREATE_STEP_IDENTITY,
  TRIBE_CREATE_STEP_REVIEW,
  TRIBE_CREATE_STEP_VISUALS,
} from "./tribe-create-portal-labels";

export type TribeCreateStepId = "identity" | "access" | "visuals" | "review";

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

export const TRIBE_CREATE_NAME_MAX = 80;
export const TRIBE_CREATE_DESC_MAX = 140;

export const TRIBE_CREATE_STEPS: TribeCreateStep[] = [
  { id: "identity", label: TRIBE_CREATE_STEP_IDENTITY, order: 1 },
  { id: "access", label: TRIBE_CREATE_STEP_ACCESS, order: 2 },
  { id: "visuals", label: TRIBE_CREATE_STEP_VISUALS, order: 3 },
  { id: "review", label: TRIBE_CREATE_STEP_REVIEW, order: 4 },
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

/**
 * Draft amorce depuis les query params (CTA "Créer la tribu {label}" d'un tag communaute).
 * La ville amorcee l'emporte sur le fallback ; la categorie n'est pre-selectionnee QUE si
 * elle correspond a une categorie reelle (l'URL est un input non fiable).
 */
export function createTribeCreateDraftFromParams(
  params: { category?: string | null; city?: string | null },
  fallbackCity = "Reims",
): TribeCreateDraft {
  const city = params.city?.trim() || fallbackCity;
  const draft = createEmptyTribeCreateDraft(city);
  const category = params.category?.trim() ?? "";
  if (category && category in TRIBE_CATEGORY_LABELS) {
    draft.category = category;
  }
  return draft;
}

export function validateTribeCreateStep(
  stepId: TribeCreateStepId,
  draft: TribeCreateDraft,
): TribeCreateValidation {
  if (stepId === "identity") {
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
    if (!draft.city.trim()) {
      return { valid: false, message: TRIBE_CREATE_VALIDATION_CITY };
    }
  }
  if (stepId === "access" && !draft.charterAccepted) {
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
