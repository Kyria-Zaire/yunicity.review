/** Organization request mobile copy (MOBILE-ORG-REQUEST-01). */

export const ORG_REQUEST_MOBILE_BACK = "Retour aux lieux";
export const ORG_REQUEST_MOBILE_SAVE_DRAFT = "Brouillon";
export const ORG_REQUEST_MOBILE_CONTINUE = "Continuer";
export const ORG_REQUEST_MOBILE_PROGRESS_PERCENT = (percent: number): string => `${percent} %`;
export const ORG_REQUEST_MOBILE_CHECKLIST_PROGRESS = (completed: number, total: number): string =>
  `${completed} sur ${total} complété`;

/** Labels ultra-courts — pastilles stepper mobile. */
export const ORG_REQUEST_MOBILE_STEP_IDENTITY = "Identité";
export const ORG_REQUEST_MOBILE_STEP_ADDRESS = "Adresse";
export const ORG_REQUEST_MOBILE_STEP_PRACTICAL = "Infos";
export const ORG_REQUEST_MOBILE_STEP_VISUALS = "Visuels";
export const ORG_REQUEST_MOBILE_STEP_VERIFICATION = "Vérification";
