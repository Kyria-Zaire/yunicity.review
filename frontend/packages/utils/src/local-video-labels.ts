import type { LocalVideoReportReason } from "@yunicity/types";

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
