import type { TribeVisibility } from "@yunicity/types";

import { TRIBE_CATEGORY_LABELS } from "./tribe-labels";
import { TRIBE_CREATE_DESKTOP_STEP_ACCESS_HINT } from "./tribe-create-desktop-labels";
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

const TRIBE_CREATE_VALID: TribeCreateValidation = { valid: true, message: null };

/** Champs d'identité seuls (nom, catégorie, description, ville) — hors visibilité. */
function validateTribeCreateIdentityFields(draft: TribeCreateDraft): TribeCreateValidation {
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
  return TRIBE_CREATE_VALID;
}

/**
 * Validation d'une étape du parcours. Le choix de visibilité (« Communauté ») est un
 * champ de l'étape Identité : c'est là qu'une visibilité invalide est signalée et corrigeable.
 */
export function validateTribeCreateStep(
  stepId: TribeCreateStepId,
  draft: TribeCreateDraft,
): TribeCreateValidation {
  if (stepId === "identity") {
    const fields = validateTribeCreateIdentityFields(draft);
    if (!fields.valid) return fields;
    if (!isTribeCreateVisibilityValid(draft.visibility)) {
      return { valid: false, message: TRIBE_CREATE_DESKTOP_STEP_ACCESS_HINT };
    }
  }
  if (stepId === "access" && !isTribeCreateCharterAccepted(draft)) {
    return { valid: false, message: TRIBE_CREATE_VALIDATION_CHARTER };
  }
  return TRIBE_CREATE_VALID;
}

/** Coche « Identité complète » : champs d'identité valides, visibilité comptée à part. */
export function isTribeCreateIdentityComplete(draft: TribeCreateDraft): boolean {
  return validateTribeCreateIdentityFields(draft).valid;
}

const TRIBE_CREATE_VISIBILITIES: readonly TribeVisibility[] = ["public", "private_invite"];

/**
 * Visibilité acceptée par l'API. Le brouillon relu depuis `sessionStorage` n'est pas fiable :
 * la valeur par défaut (« Publique ») est valide, une valeur inconnue ou absente ne l'est pas.
 */
export function isTribeCreateVisibilityValid(visibility: unknown): visibility is TribeVisibility {
  return TRIBE_CREATE_VISIBILITIES.some((value) => value === visibility);
}

/** Les trois cas d'une visibilité de brouillon : les deux valeurs de l'API, ou invalide. */
export type TribeCreateVisibilityState = TribeVisibility | "invalid";

/** Point unique de distinction `public` / `private_invite` / valeur invalide. */
export function resolveTribeCreateVisibility(visibility: unknown): TribeCreateVisibilityState {
  return isTribeCreateVisibilityValid(visibility) ? visibility : "invalid";
}

/** Seule une acceptation explicite (`true`) compte : une charte non acceptée bloque toujours. */
export function isTribeCreateCharterAccepted(draft: TribeCreateDraft): boolean {
  return draft.charterAccepted === true;
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
