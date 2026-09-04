/** Tribe create mobile micro-copy (MOBILE-TRIBE-CREATE-01). */

export const TRIBE_CREATE_MOBILE_BACK = "Retour aux tribus";
export const TRIBE_CREATE_MOBILE_STEP_ACCESS = "Accès";
export const TRIBE_CREATE_MOBILE_STEP_IDENTITY = "Identité";
export const TRIBE_CREATE_MOBILE_STEP_REVIEW = "Vérification";
export const TRIBE_CREATE_MOBILE_STEP_VISUALS = "Visuels";
export const TRIBE_CREATE_MOBILE_SAVE_DRAFT = "Brouillon";
export const TRIBE_CREATE_MOBILE_CONTINUE = "Continuer";
export const TRIBE_CREATE_MOBILE_PROGRESS_PERCENT = (percent: number): string => `${percent} %`;
export const TRIBE_CREATE_MOBILE_CHECKLIST_PROGRESS = (completed: number, total: number): string =>
  `${completed} sur ${total} complété${completed > 1 ? "s" : ""}`;
