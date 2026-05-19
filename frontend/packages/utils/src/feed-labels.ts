import type { FeedReportReason } from "@yunicity/types";

export const FEED_COMPOSER_PLACEHOLDER =
  "Partage quelque chose d’utile pour votre ville.";

export const FEED_EMPTY_TITLE = "Votre ville est encore calme.";

export const FEED_EMPTY_BODY =
  "Soyez le premier à partager une découverte locale. Les offres Passport de vos commerces apparaîtront ici au fil du temps.";

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
