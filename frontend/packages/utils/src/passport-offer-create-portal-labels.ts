/** Création offre Passport — espace partenaire desktop (WEB-PASSPORT-OFFER-CREATE-01). */

export const PASSPORT_OFFER_CREATE_TITLE = "Créer une offre Passport";
export const PASSPORT_OFFER_CREATE_SUBTITLE =
  "Proposez un avantage clair, vérifiable et réservé aux détenteurs d'un Passport actif.";
export const PASSPORT_OFFER_CREATE_DRAFT_BADGE = "BROUILLON";
export const PASSPORT_OFFER_CREATE_BREADCRUMB_PASSPORT = "Passport";
export const PASSPORT_OFFER_CREATE_BREADCRUMB_OFFERS = "Mes offres";
export const PASSPORT_OFFER_CREATE_BREADCRUMB_NEW = "Nouvelle offre";
export const PASSPORT_OFFER_CREATE_CANCEL = "Annuler";
export const PASSPORT_OFFER_CREATE_SAVE_DRAFT = "Enregistrer le brouillon";
export const PASSPORT_OFFER_CREATE_SUBMIT = "Envoyer pour vérification";
export const PASSPORT_OFFER_CREATE_SUBMITTING = "Envoi…";
export const PASSPORT_OFFER_CREATE_SAVING = "Enregistrement…";
export const PASSPORT_OFFER_CREATE_BACK_OFFERS = "← Retour à mes offres";
export const PASSPORT_OFFER_CREATE_LOADING = "Chargement de l'espace partenaire…";
export const PASSPORT_OFFER_CREATE_ERROR = "Une erreur est survenue. Réessayez ou enregistrez le brouillon.";
export const PASSPORT_OFFER_CREATE_DRAFT_SAVED = "Brouillon enregistré.";
export const PASSPORT_OFFER_CREATE_PARTNER_BADGE = "PARTENAIRE YUNICITY";

export const PASSPORT_OFFER_CREATE_STEP_GENERAL = "Informations générales";
export const PASSPORT_OFFER_CREATE_STEP_BENEFIT = "Avantage et conditions";
export const PASSPORT_OFFER_CREATE_STEP_VALIDITY = "Période de validité";
export const PASSPORT_OFFER_CREATE_STEP_ELIGIBILITY = "Éligibilité et validation";
export const PASSPORT_OFFER_CREATE_STEP_REVIEW = "Aperçu et envoi";

export const PASSPORT_OFFER_CREATE_MEDIUM_STEP_GENERAL = "Informations";
export const PASSPORT_OFFER_CREATE_MEDIUM_STEP_BENEFIT = "Avantage";
export const PASSPORT_OFFER_CREATE_MEDIUM_STEP_VALIDITY = "Période";
export const PASSPORT_OFFER_CREATE_MEDIUM_STEP_ELIGIBILITY = "Éligibilité";
export const PASSPORT_OFFER_CREATE_MEDIUM_STEP_REVIEW = "Aperçu et envoi";
export const PASSPORT_OFFER_CREATE_MOBILE_STEP_REVIEW = "Aperçu";
export const PASSPORT_OFFER_CREATE_STEP_PROGRESS = (current: number, total: number) =>
  `Étape ${current} sur ${total}`;

export const PASSPORT_OFFER_CREATE_MOBILE_BACK = "Retour";
export const PASSPORT_OFFER_CREATE_MOBILE_MENU = "Actions";
export const PASSPORT_OFFER_CREATE_DESC_COUNTER = (current: number, max: number) =>
  `${current} / ${max}`;
export const PASSPORT_OFFER_CREATE_FIELD_RULE = "Règle requise";
export const PASSPORT_OFFER_CREATE_QR_HIDDEN_HINT =
  "Le QR reste masqué jusqu'à l'action du détenteur.";
export const PASSPORT_OFFER_CREATE_FLASH_INFO_LONG =
  "Le badge OFFRE FLASH sera attribué automatiquement à partir de la période réelle. Vous ne pouvez pas l'activer manuellement.";

export const PASSPORT_OFFER_CREATE_SECTION_GENERAL = "Informations générales";
export const PASSPORT_OFFER_CREATE_SECTION_BENEFIT = "Avantage et conditions";
export const PASSPORT_OFFER_CREATE_SECTION_VALIDITY = "Période de validité";
export const PASSPORT_OFFER_CREATE_SECTION_ELIGIBILITY = "Éligibilité et validation";

export const PASSPORT_OFFER_CREATE_FIELD_COVER = "Image de couverture";
export const PASSPORT_OFFER_CREATE_COVER_HINT = "JPG ou PNG · 5 Mo maximum";
export const PASSPORT_OFFER_CREATE_COVER_CHANGE = "Modifier l'image";
export const PASSPORT_OFFER_CREATE_FIELD_TITLE = "Titre de l'offre";
export const PASSPORT_OFFER_CREATE_FIELD_VALUE = "Avantage proposé";
export const PASSPORT_OFFER_CREATE_FIELD_DESCRIPTION = "Description";
export const PASSPORT_OFFER_CREATE_FIELD_CATEGORY = "Catégorie";
export const PASSPORT_OFFER_CREATE_FIELD_PARTNER = "Partenaire et lieu";
export const PASSPORT_OFFER_CREATE_PARTNER_LOCKED =
  "L'offre sera rattachée à ce partenaire vérifié.";
export const PASSPORT_OFFER_CREATE_SINGLE_USE = "Une utilisation par détenteur pendant la période";
export const PASSPORT_OFFER_CREATE_NON_CUMULATIVE = "Non cumulable avec une autre offre en cours";
export const PASSPORT_OFFER_CREATE_FIELD_CONDITIONS = "Conditions complémentaires";
export const PASSPORT_OFFER_CREATE_FIELD_START = "Début";
export const PASSPORT_OFFER_CREATE_FIELD_END = "Fin";
export const PASSPORT_OFFER_CREATE_FIELD_TIMEZONE = "Fuseau horaire";
export const PASSPORT_OFFER_CREATE_FLASH_INFO =
  "Le badge OFFRE FLASH sera attribué automatiquement à partir de la période réelle.";
export const PASSPORT_OFFER_CREATE_PASSPORT_RULE = "Passport Yunicity actif";
export const PASSPORT_OFFER_CREATE_TIER_ALL = "Tous les niveaux actifs";
export const PASSPORT_OFFER_CREATE_TIER_EXPLORER = "Explorateur";
export const PASSPORT_OFFER_CREATE_TIER_AMBASSADOR = "Ambassadeur local";
export const PASSPORT_OFFER_CREATE_FIELD_TIERS = "Niveaux éligibles";
export const PASSPORT_OFFER_CREATE_FIELD_VALIDATION = "Mode de validation";
export const PASSPORT_OFFER_CREATE_VALIDATION_QR =
  "Validation par QR Passport chez le partenaire";

export const PASSPORT_OFFER_CREATE_PREVIEW_TITLE = "Aperçu citoyen";
export const PASSPORT_OFFER_CREATE_PREVIEW_BODY =
  "Voici comment l'offre apparaîtra aux détenteurs d'un Passport actif.";
export const PASSPORT_OFFER_CREATE_PREVIEW_UNPUBLISHED = "APERÇU · NON PUBLIÉ";
export const PASSPORT_OFFER_CREATE_PREVIEW_AVAILABLE = "Disponible jusqu'au";
export const PASSPORT_OFFER_CREATE_PREVIEW_ELIGIBLE = "Éligible avec votre Passport";
export const PASSPORT_OFFER_CREATE_PREVIEW_CTA = "Voir l'offre";

export const PASSPORT_OFFER_CREATE_CHECKLIST_TITLE = "Checklist avant envoi";
export const PASSPORT_OFFER_CREATE_CHECKLIST_PARTNER = "Partenaire identifié";
export const PASSPORT_OFFER_CREATE_CHECKLIST_VALUE = "Avantage explicite";
export const PASSPORT_OFFER_CREATE_CHECKLIST_CONDITIONS = "Conditions renseignées";
export const PASSPORT_OFFER_CREATE_CHECKLIST_PERIOD = "Période complète";
export const PASSPORT_OFFER_CREATE_CHECKLIST_IMAGE = "Image ajoutée";
export const PASSPORT_OFFER_CREATE_CHECKLIST_READY = (count: number) =>
  `${count} élément${count > 1 ? "s" : ""} prêt${count > 1 ? "s" : ""}`;

export const PASSPORT_OFFER_CREATE_WORKFLOW_TITLE = "Après l'envoi";
export const PASSPORT_OFFER_CREATE_WORKFLOW_BODY =
  "L'équipe Yunicity peut demander des corrections avant publication.";
export const PASSPORT_OFFER_CREATE_WORKFLOW_REVIEW = "En vérification";
export const PASSPORT_OFFER_CREATE_WORKFLOW_APPROVED = "Validée";
export const PASSPORT_OFFER_CREATE_WORKFLOW_PUBLISHED = "Publiée";

export const PASSPORT_OFFER_CREATE_TRUST_TITLE = "Confiance citoyenne";
export const PASSPORT_OFFER_CREATE_HONEST_OFFER_TITLE = "Une offre honnête";
export const PASSPORT_OFFER_CREATE_TRUST_BODY =
  "Les dates et conditions doivent être exactes et tenables sur place. Yunicity vérifie chaque offre avant publication.";

export const PASSPORT_OFFER_CREATE_VALIDATION_TITLE = "Complétez le titre de l'offre.";
export const PASSPORT_OFFER_CREATE_VALIDATION_VALUE = "Décrivez l'avantage proposé.";
export const PASSPORT_OFFER_CREATE_VALIDATION_DESCRIPTION = "Ajoutez une description claire.";
export const PASSPORT_OFFER_CREATE_VALIDATION_CONDITIONS = "Précisez les conditions complémentaires.";
export const PASSPORT_OFFER_CREATE_VALIDATION_DATES = "Indiquez une période de validité complète.";
export const PASSPORT_OFFER_CREATE_VALIDATION_END_AFTER_START =
  "La date de fin doit être postérieure à la date de début.";
export const PASSPORT_OFFER_CREATE_DESKTOP_ONLY =
  "La création guidée est disponible sur ordinateur. Utilisez le formulaire simplifié ou revenez sur un écran plus large.";
