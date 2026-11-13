/** Event create portal micro-copy (WEB-EVENT-CREATE-01). */

export const EVENT_CREATE_TITLE = "Créer un événement";
export const EVENT_CREATE_SUBTITLE =
  "Partagez un moment local clair, utile et facile à rejoindre.";

export const EVENT_CREATE_BACK_SORTIR = "Retour à Sortir";
export const EVENT_CREATE_SAVE_EXIT = "Enregistrer et quitter";
export const EVENT_CREATE_SAVE_DRAFT = "Enregistrer le brouillon";
export const EVENT_CREATE_CANCEL = "Annuler";
export const EVENT_CREATE_BACK = "Retour";
export const EVENT_CREATE_DRAFT_SAVED = "Brouillon enregistré.";

export const EVENT_CREATE_STEP_PROGRESS = (current: number, total: number): string =>
  `Étape ${current} sur ${total}`;

export const EVENT_CREATE_STEP_ESSENTIALS = "Informations essentielles";
export const EVENT_CREATE_STEP_SCHEDULE = "Date et lieu";
export const EVENT_CREATE_STEP_VISUALS = "Visuels";
export const EVENT_CREATE_STEP_PRACTICAL = "Détails pratiques";
export const EVENT_CREATE_STEP_REVIEW = "Vérification";

/** Labels compacts stepper medium (WEB-EVENT-CREATE-MEDIUM-01). */
export const EVENT_CREATE_MEDIUM_STEP_ESSENTIALS = "Essentiel";
export const EVENT_CREATE_MEDIUM_STEP_SCHEDULE = "Date et lieu";
export const EVENT_CREATE_MEDIUM_STEP_VISUALS = "Visuels";
export const EVENT_CREATE_MEDIUM_STEP_PRACTICAL = "Pratique";
export const EVENT_CREATE_MEDIUM_STEP_REVIEW = "Vérification";

export const EVENT_CREATE_STEP_ESSENTIALS_HINT = "Titre, catégorie et organisateur";

export const EVENT_CREATE_ESSENTIALS_TITLE = "Informations essentielles";
export const EVENT_CREATE_ESSENTIALS_BODY =
  "Commençons par ce que les habitants verront en premier.";

export const EVENT_CREATE_FIELD_ORGANIZER = "Qui organise cet événement ?";
export const EVENT_CREATE_CHANGE_ORGANIZATION = "Changer d'organisation";
export const EVENT_CREATE_FIELD_TITLE = "Titre de l'événement";
export const EVENT_CREATE_FIELD_CATEGORY = "Catégorie principale";
export const EVENT_CREATE_FIELD_DESCRIPTION = "Description courte";
export const EVENT_CREATE_FIELD_VISIBILITY = "Visibilité";
export const EVENT_CREATE_FIELD_RECURRING = "Événement récurrent";

export const EVENT_CREATE_TITLE_HINT = "Un titre court et précis fonctionne mieux.";
export const EVENT_CREATE_DESC_HINT = "Elle apparaîtra dans les cartes de découverte.";
export const EVENT_CREATE_RECURRING_HINT =
  "Vous pourrez définir la fréquence à l'étape Date et lieu.";

/** Mobile (WEB-EVENT-CREATE-MOBILE-01). */
export const EVENT_CREATE_MOBILE_BACK = "Retour à Sortir";
export const EVENT_CREATE_MOBILE_DESC_HINT = "Visible dans les cartes de découverte.";
export const EVENT_CREATE_MOBILE_RECURRING_HINT =
  "La fréquence sera définie à l'étape suivante.";
export const EVENT_CREATE_MOBILE_VISIBILITY_PRIVATE = "Privé";
export const EVENT_CREATE_MOBILE_SAVE_DRAFT = "Brouillon";
export const EVENT_CREATE_MOBILE_CONTINUE = "Continuer";
export const EVENT_CREATE_MOBILE_PROGRESS_PERCENT = (percent: number): string => `${percent} %`;
export const EVENT_CREATE_MOBILE_CHECKLIST_PROGRESS = (completed: number, total: number): string =>
  `${completed} sur ${total} complété`;

export const EVENT_CREATE_VISIBILITY_PUBLIC = "Public";
export const EVENT_CREATE_VISIBILITY_PUBLIC_DESC =
  "Visible par tous les habitants et visiteurs de Reims.";
export const EVENT_CREATE_VISIBILITY_PRIVATE = "Privé / sur invitation";
export const EVENT_CREATE_VISIBILITY_PRIVATE_DESC =
  "Visible uniquement par les personnes invitées.";

export const EVENT_CREATE_CATEGORY_CULTURE = "Culture";
export const EVENT_CREATE_CATEGORY_MUSIC = "Musique";
export const EVENT_CREATE_CATEGORY_FOOD = "Food";
export const EVENT_CREATE_CATEGORY_SPORT = "Sport";
export const EVENT_CREATE_CATEGORY_FAMILY = "Famille";
export const EVENT_CREATE_CATEGORY_LOCAL = "Vie locale";
export const EVENT_CREATE_CATEGORY_OTHER = "Autre";

export const EVENT_CREATE_PREVIEW_TITLE = "Aperçu en direct";
export const EVENT_CREATE_PREVIEW_MODE_CARD = "Carte";
export const EVENT_CREATE_PREVIEW_MODE_DETAIL = "Détail";
export const EVENT_CREATE_PREVIEW_VISUAL_PLACEHOLDER = "Ajoutez un visuel à l'étape 3";
export const EVENT_CREATE_PREVIEW_DATE_TBD = "Date à définir";
export const EVENT_CREATE_PREVIEW_PLACE_TBD = "Lieu à définir";
export const EVENT_CREATE_PREVIEW_CTA = "Voir l'événement";
export const EVENT_CREATE_PREVIEW_AUTO = "Cet aperçu se met à jour automatiquement.";

export const EVENT_CREATE_CHECKLIST_TITLE = "Avant de publier";
export const EVENT_CREATE_CHECKLIST_ESSENTIALS = "Informations essentielles";
export const EVENT_CREATE_CHECKLIST_SCHEDULE = "Date et lieu";
export const EVENT_CREATE_CHECKLIST_VISUAL = "Un visuel principal";
export const EVENT_CREATE_CHECKLIST_PRACTICAL = "Informations pratiques";
export const EVENT_CREATE_CHECKLIST_NO_ERRORS = "0 erreur bloquante";

export const EVENT_CREATE_HELP_TITLE = "Besoin d'aide ?";
export const EVENT_CREATE_HELP_LINK = "Conseils pour publier un événement";

export const EVENT_CREATE_NEXT_SCHEDULE = "Continuer vers la date et le lieu";
export const EVENT_CREATE_NEXT_VISUALS = "Continuer vers les visuels";
export const EVENT_CREATE_NEXT_PRACTICAL = "Continuer vers les détails pratiques";
export const EVENT_CREATE_NEXT_REVIEW = "Continuer vers la vérification";
export const EVENT_CREATE_SUBMIT = "Publier l'événement";
export const EVENT_CREATE_SUBMITTING = "Publication…";

export const EVENT_CREATE_SCHEDULE_TITLE = "Date et lieu";
export const EVENT_CREATE_SCHEDULE_BODY = "Indiquez quand et où se déroule l'événement.";
export const EVENT_CREATE_FIELD_STARTS = "Date et heure de début";
export const EVENT_CREATE_FIELD_LOCATION = "Nom du lieu";

export const EVENT_CREATE_VISUALS_TITLE = "Visuels";
export const EVENT_CREATE_VISUALS_BODY = "Ajoutez une image qui donne envie de venir.";
export const EVENT_CREATE_FIELD_COVER = "Image de couverture (URL)";

export const EVENT_CREATE_PRACTICAL_TITLE = "Détails pratiques";
export const EVENT_CREATE_PRACTICAL_BODY = "Tarifs, accès, réservation — à compléter prochainement.";

export const EVENT_CREATE_REVIEW_TITLE = "Vérification";
export const EVENT_CREATE_REVIEW_BODY =
  "Relisez votre événement avant de le soumettre à validation.";

export const EVENT_CREATE_LOADING = "Chargement…";
export const EVENT_CREATE_ERROR = "Impossible d'enregistrer l'événement.";
export const EVENT_CREATE_NO_ORG =
  "Vous devez être rattaché à une organisation pour publier un événement.";
export const EVENT_CREATE_NO_ORG_CTA = "Proposer une organisation";

export const EVENT_CREATE_VALIDATION_ORG = "Sélectionnez l'organisation organisatrice.";
export const EVENT_CREATE_VALIDATION_TITLE = "Indiquez un titre (2 à 80 caractères).";
export const EVENT_CREATE_VALIDATION_CATEGORY = "Choisissez une catégorie principale.";
export const EVENT_CREATE_VALIDATION_DESC =
  "Ajoutez une description courte (10 à 140 caractères).";
export const EVENT_CREATE_VALIDATION_STARTS = "Indiquez une date et heure de début.";
export const EVENT_CREATE_VALIDATION_LOCATION = "Indiquez le nom du lieu.";

export const EVENT_CREATE_DESKTOP_ONLY =
  "La création d'événement desktop est disponible à partir de 1024 px de largeur.";
