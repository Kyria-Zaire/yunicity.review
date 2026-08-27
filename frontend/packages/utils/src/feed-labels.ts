import type { FeedReportReason } from "@yunicity/types";

export const FEED_COMPOSER_PLACEHOLDER =
  "Partage quelque chose d’utile pour votre ville.";

export const FEED_EMPTY_TITLE = "Votre ville est encore calme.";

export const FEED_EMPTY_BODY =
  "Soyez le premier à partager une découverte locale. Les offres Passport de vos commerces apparaîtront ici au fil du temps.";

export const FEED_EMPTY_DISCOVERY_TITLE = "En ce moment à";

export const FEED_ERROR_TITLE = "Impossible de charger le fil";

export const FEED_ERROR_BODY =
  "Vérifiez votre connexion et réessayez dans un instant.";

export const FEED_DELETED_COMMENT_LABEL = "Commentaire supprimé";

export const FEED_REPORT_LABEL = "Signaler";

export const FEED_REPORT_REASON_LABELS: Record<FeedReportReason, string> = {
  spam: "Spam",
  inappropriate: "Contenu inapproprié",
  other: "Autre",
};

export const FEED_LOAD_MORE_LABEL = "Charger plus";

export const FEED_PASSPORT_BADGE = "Passport";

/** Barre d’actions sociales feed (WEB-HOME-01F). */
export const FEED_ACTION_REACT = "Réagir";
export const FEED_ACTION_COMMENT = "Discuter";
export const FEED_ACTION_SAVE = "Sauvegarder";
export const FEED_ACTION_SAVED = "Sauvegardé";
export const FEED_ACTION_SHARE = "Partager";
export const FEED_ACTION_MAP = "Carte";
export const FEED_ACTION_EVENT_INTEREST = "Je suis intéressé";
export const FEED_ACTION_EVENT_VIEW = "Voir l’événement";
export const FEED_ACTION_OFFER_VIEW = "Voir l'offre";
export const FEED_ACTION_NEIGHBORHOOD = "Quartier";
export const FEED_ACTION_MORE = "Plus d'actions";
export const FEED_SHARE_COPIED = "Lien copié";

export function formatFeedDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
}

export function formatOfferValidUntil(iso: string | null | undefined): string | null {
  if (!iso) {
    return null;
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const now = new Date();
  if (date < now) {
    return "Expirée";
  }
  return `Jusqu’au ${date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`;
}

export function authorInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}
