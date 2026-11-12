import type { TribeCreateDraft, TribeCreateStepId } from "./tribe-create-portal";
import {
  TRIBE_CREATE_STEPS,
  isTribeCreateCharterAccepted,
  isTribeCreateIdentityComplete,
  isTribeCreateVisibilityValid,
  validateTribeCreateStep,
} from "./tribe-create-portal";
import { TRIBE_CREATE_CATEGORY_OPTIONS } from "./tribe-create-portal";
import {
  TRIBE_CREATE_DESKTOP_CHECKLIST_OPTIONAL,
  TRIBE_CREATE_DESKTOP_CHECKLIST_STATE_DONE,
  TRIBE_CREATE_DESKTOP_CHECKLIST_STATE_TODO,
  TRIBE_CREATE_DESKTOP_STEP_ACCESS,
  TRIBE_CREATE_DESKTOP_STEP_ACCESS_HINT,
  TRIBE_CREATE_DESKTOP_STEP_IDENTITY,
  TRIBE_CREATE_DESKTOP_STEP_IDENTITY_HINT,
  TRIBE_CREATE_DESKTOP_STEP_REVIEW,
  TRIBE_CREATE_DESKTOP_STEP_REVIEW_HINT,
  TRIBE_CREATE_DESKTOP_STEP_VISUALS,
  TRIBE_CREATE_DESKTOP_STEP_VISUALS_HINT,
  TRIBE_CREATE_DESKTOP_NEXT_ACCESS,
  TRIBE_CREATE_DESKTOP_NEXT_REVIEW,
  TRIBE_CREATE_DESKTOP_NEXT_VISUALS,
} from "./tribe-create-desktop-labels";

export type TribeCreateDesktopStep = {
  id: TribeCreateStepId;
  label: string;
  order: number;
  hint: string;
};

export type TribeCreateDesktopCategoryIcon =
  | "culture"
  | "sport"
  | "heart"
  | "students"
  | "music"
  | "photo"
  | "users"
  | "other";

export type TribeCreateDesktopCategoryOption = {
  value: string;
  label: string;
  icon: TribeCreateDesktopCategoryIcon;
};

export const TRIBE_CREATE_DESKTOP_STEPS: TribeCreateDesktopStep[] = [
  {
    id: "identity",
    label: TRIBE_CREATE_DESKTOP_STEP_IDENTITY,
    order: 1,
    hint: TRIBE_CREATE_DESKTOP_STEP_IDENTITY_HINT,
  },
  {
    id: "access",
    label: TRIBE_CREATE_DESKTOP_STEP_ACCESS,
    order: 2,
    hint: TRIBE_CREATE_DESKTOP_STEP_ACCESS_HINT,
  },
  {
    id: "visuals",
    label: TRIBE_CREATE_DESKTOP_STEP_VISUALS,
    order: 3,
    hint: TRIBE_CREATE_DESKTOP_STEP_VISUALS_HINT,
  },
  {
    id: "review",
    label: TRIBE_CREATE_DESKTOP_STEP_REVIEW,
    order: 4,
    hint: TRIBE_CREATE_DESKTOP_STEP_REVIEW_HINT,
  },
];

const CATEGORY_ICON_BY_VALUE: Record<string, TribeCreateDesktopCategoryIcon> = {
  cafe_culture: "culture",
  sport_local: "sport",
  volunteering: "heart",
  students: "students",
  music: "music",
  photography: "photo",
  association: "users",
  other: "other",
};

export const TRIBE_CREATE_DESKTOP_CATEGORY_GRID: TribeCreateDesktopCategoryOption[] =
  TRIBE_CREATE_CATEGORY_OPTIONS.map((option) => ({
    ...option,
    icon: CATEGORY_ICON_BY_VALUE[option.value] ?? "other",
  }));

export type TribeCreateChecklistKey = "identity" | "access" | "charter" | "visuals";

export type TribeCreateChecklistRule = {
  /** Obligatoire : non satisfaite, elle compte comme erreur bloquante. Facultative : jamais bloquante. */
  required: boolean;
  isMet: (draft: TribeCreateDraft) => boolean;
};

/**
 * Source unique des coches de la checklist « Avant de publier » ET du comptage des erreurs
 * bloquantes (TRIBE-CREATE-CHECKLIST-ACCESS-01). Ensemble, les règles obligatoires
 * recouvrent exactement la validation des étapes Identité (champs + visibilité) et Accès
 * (charte) vérifiée avant publication.
 */
export const TRIBE_CREATE_CHECKLIST_RULES: Readonly<Record<TribeCreateChecklistKey, TribeCreateChecklistRule>> = {
  identity: { required: true, isMet: isTribeCreateIdentityComplete },
  access: { required: true, isMet: (draft) => isTribeCreateVisibilityValid(draft.visibility) },
  charter: { required: true, isMet: isTribeCreateCharterAccepted },
  visuals: { required: false, isMet: (draft) => draft.coverImageUrl.trim().length > 0 },
};

const TRIBE_CREATE_CHECKLIST_KEYS: readonly TribeCreateChecklistKey[] = ["identity", "access", "charter", "visuals"];

export function tribeCreateChecklistState(draft: TribeCreateDraft): Record<TribeCreateChecklistKey, boolean> {
  return {
    identity: TRIBE_CREATE_CHECKLIST_RULES.identity.isMet(draft),
    access: TRIBE_CREATE_CHECKLIST_RULES.access.isMet(draft),
    charter: TRIBE_CREATE_CHECKLIST_RULES.charter.isMet(draft),
    visuals: TRIBE_CREATE_CHECKLIST_RULES.visuals.isMet(draft),
  };
}

/**
 * Texte d'état d'un élément de la checklist, masqué visuellement et restitué aux technologies
 * d'assistance : « complété » / « à compléter », suivi de « facultatif » pour une règle non
 * obligatoire (TRIBE-CREATE-CHECKLIST-A11Y-01). À l'écran, l'état reste porté par l'icône.
 */
export function tribeCreateChecklistItemStatusText(key: TribeCreateChecklistKey, done: boolean): string {
  const state = done ? TRIBE_CREATE_DESKTOP_CHECKLIST_STATE_DONE : TRIBE_CREATE_DESKTOP_CHECKLIST_STATE_TODO;
  return TRIBE_CREATE_CHECKLIST_RULES[key].required ? state : `${state}, ${TRIBE_CREATE_DESKTOP_CHECKLIST_OPTIONAL}`;
}

export function tribeCreateBlockingErrorCount(draft: TribeCreateDraft): number {
  return TRIBE_CREATE_CHECKLIST_KEYS.filter((key) => {
    const rule = TRIBE_CREATE_CHECKLIST_RULES[key];
    return rule.required && !rule.isMet(draft);
  }).length;
}

export function tribeCreateChecklistProgress(draft: TribeCreateDraft): {
  completed: number;
  total: number;
} {
  const state = tribeCreateChecklistState(draft);
  const reviewReady = TRIBE_CREATE_STEPS.every((step) => validateTribeCreateStep(step.id, draft).valid);
  const flags = [state.identity, state.access, state.charter, state.visuals, reviewReady];
  return { completed: flags.filter(Boolean).length, total: flags.length };
}

export function tribeCreateStepProgressPercent(stepId: TribeCreateStepId): number {
  const index = TRIBE_CREATE_STEPS.findIndex((step) => step.id === stepId);
  if (index < 0) return 0;
  return Math.round(((index + 1) / TRIBE_CREATE_STEPS.length) * 100);
}

export function tribeCreateDesktopNextLabel(stepId: TribeCreateStepId): string {
  switch (stepId) {
    case "identity":
      return TRIBE_CREATE_DESKTOP_NEXT_ACCESS;
    case "access":
      return TRIBE_CREATE_DESKTOP_NEXT_VISUALS;
    case "visuals":
      return TRIBE_CREATE_DESKTOP_NEXT_REVIEW;
    default:
      return TRIBE_CREATE_DESKTOP_NEXT_REVIEW;
  }
}

export { tribeCreateDesktopStepProgress } from "./tribe-create-desktop-labels";

export const TRIBE_CREATE_DRAFT_STORAGE_KEY = "yunicity.tribe-create.draft.v2";
