import type { LocalVideoReportReason } from "@yunicity/types";
import { LOCAL_VIDEO_MAX_DURATION_SECONDS } from "@yunicity/types";

/** VIDEO-04B — écran upload web */
export const LOCAL_VIDEO_UPLOAD_PAGE_TITLE = "Publier une vidéo locale";
export const LOCAL_VIDEO_UPLOAD_PAGE_SUBTITLE = `Partagez un moment de votre quartier en vidéo courte (MP4 ou MOV, max. 50 Mo, ${LOCAL_VIDEO_MAX_DURATION_SECONDS} s).`;
export const LOCAL_VIDEO_UPLOAD_VIDEO_LABEL = "Vidéo";
export const LOCAL_VIDEO_UPLOAD_VIDEO_HINT = `MP4 ou MOV · max. 50 Mo · max. ${LOCAL_VIDEO_MAX_DURATION_SECONDS} s`;
export const LOCAL_VIDEO_UPLOAD_CHOOSE_FILE = "Choisir une vidéo";
export const LOCAL_VIDEO_UPLOAD_CHANGE_FILE = "Changer de fichier";
export const LOCAL_VIDEO_UPLOAD_TITLE_LABEL = "Titre";
export const LOCAL_VIDEO_UPLOAD_TITLE_PLACEHOLDER = "Donnez un titre à votre vidéo";
export const LOCAL_VIDEO_UPLOAD_DESCRIPTION_LABEL = "Description";
export const LOCAL_VIDEO_UPLOAD_DESCRIPTION_PLACEHOLDER =
  "Décrivez brièvement ce moment local (optionnel)";
export const LOCAL_VIDEO_UPLOAD_NEIGHBORHOOD_LABEL = "Quartier";
export const LOCAL_VIDEO_UPLOAD_NEIGHBORHOOD_PLACEHOLDER = "Sélectionnez un quartier";
export const LOCAL_VIDEO_UPLOAD_NEIGHBORHOODS_LOADING = "Chargement des quartiers…";
export const LOCAL_VIDEO_UPLOAD_NEIGHBORHOODS_EMPTY =
  "Aucun quartier disponible pour votre ville.";
export const LOCAL_VIDEO_UPLOAD_PUBLISH = "Publier";
export const LOCAL_VIDEO_UPLOAD_CANCEL = "Annuler";
export const LOCAL_VIDEO_UPLOAD_PHASE_UPLOAD = "Envoi de la vidéo…";
export const LOCAL_VIDEO_UPLOAD_PHASE_PUBLISH = "Publication…";
export const LOCAL_VIDEO_UPLOAD_PHASE_PROCESSING =
  "Votre vidéo est en cours de traitement.";
export const LOCAL_VIDEO_UPLOAD_SUCCESS_BODY =
  "Votre vidéo a été envoyée. Elle apparaîtra dans le fil une fois le traitement terminé.";
export const LOCAL_VIDEO_UPLOAD_SUCCESS_CTA = "Retour aux vidéos";
export const LOCAL_VIDEO_UPLOAD_ERROR_GENERIC =
  "Impossible de publier la vidéo pour le moment.";
export const LOCAL_VIDEO_UPLOAD_VIDEO_REQUIRED = "Sélectionnez une vidéo à publier.";
export const LOCAL_VIDEO_UPLOAD_TITLE_REQUIRED = "Le titre est obligatoire.";
export const LOCAL_VIDEO_UPLOAD_NEIGHBORHOOD_REQUIRED = "Sélectionnez un quartier.";
export const LOCAL_VIDEO_UPLOAD_FILE_TOO_LARGE = "Fichier trop volumineux (max. 50 Mo).";
export const LOCAL_VIDEO_UPLOAD_FILE_TOO_LONG = `Vidéo trop longue (max. ${LOCAL_VIDEO_MAX_DURATION_SECONDS} s).`;
export const LOCAL_VIDEO_UPLOAD_FILE_INVALID_TYPE =
  "Format non supporté. Utilisez un fichier MP4 ou MOV.";
export const LOCAL_VIDEO_UPLOAD_DURATION_UNKNOWN = "Durée non disponible";
export const LOCAL_VIDEO_UPLOAD_FILE_SIZE_LABEL = "Taille";
export const LOCAL_VIDEO_UPLOAD_DURATION_LABEL = "Durée";
export const LOCAL_VIDEO_UPLOAD_BACK_TO_FEED = "Retour au fil vidéo";
export const LOCAL_VIDEO_UPLOAD_PUBLISH_CTA = "Publier une vidéo";

/** VIDEO-04C — suivi traitement feed */
export const LOCAL_VIDEO_PROCESSING_FEED_TITLE =
  "Votre vidéo est en cours de traitement.";
export const LOCAL_VIDEO_PROCESSING_FEED_HINT =
  "Vous pouvez quitter cette page. Nous préparons votre vidéo en arrière-plan.";
export const LOCAL_VIDEO_PROCESSING_PUBLISHED_TITLE = "Votre vidéo est publiée.";
export const LOCAL_VIDEO_PROCESSING_PUBLISHED_HINT =
  "Elle apparaît dans le fil local dès que la liste se met à jour.";
export const LOCAL_VIDEO_PROCESSING_FAILED_TITLE = "Le traitement a échoué.";
export const LOCAL_VIDEO_PROCESSING_RETRY_CTA = "Publier une autre vidéo";
export const LOCAL_VIDEO_UPLOAD_SUBMITTED_BODY =
  "Publication acceptée. Redirection vers votre vidéo…";

export const LOCAL_VIDEO_TITLE_MAX_LENGTH = 80;
export const LOCAL_VIDEO_DESCRIPTION_MAX_LENGTH = 300;

export const LOCAL_VIDEO_SHARE_COPIED = "Lien copié";
export const LOCAL_VIDEO_REPORT_LABEL = "Signaler";
export const LOCAL_VIDEO_REPORT_SUCCESS = "Signalement envoyé. Merci pour votre vigilance.";
export const LOCAL_VIDEO_REPORT_ERROR = "Impossible d'envoyer le signalement pour le moment.";
export const LOCAL_VIDEO_COMMENT_PLACEHOLDER = "Écrire un commentaire…";
export const LOCAL_VIDEO_COMMENT_SUBMIT_LABEL = "Publier";
export const LOCAL_VIDEO_COMMENT_LOAD_ERROR = "Impossible de charger les commentaires.";
export const LOCAL_VIDEO_COMMENT_SEND_ERROR = "Impossible de publier le commentaire.";

export const LOCAL_VIDEO_REPORT_REASON_LABELS: Record<LocalVideoReportReason, string> = {
  spam: "Spam",
  harassment: "Harcèlement",
  hate: "Discours haineux",
  violence: "Violence",
  sexual: "Contenu sexuel",
  copyright: "Droit d'auteur",
  other: "Autre",
};

export const LOCAL_VIDEO_REPORT_REASONS: LocalVideoReportReason[] = [
  "spam",
  "harassment",
  "hate",
  "violence",
  "sexual",
  "copyright",
  "other",
];
