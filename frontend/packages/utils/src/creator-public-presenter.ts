import type { CreatorContentAuthor, CreatorContentType } from "@yunicity/types";

export const CREATOR_HUB_TITLE = "Créateurs";
export const CREATOR_HUB_SUBTITLE =
  "Récits, portraits et regards locaux sur Reims — une sélection éditoriale, sans filtre algorithmique.";
export const CREATOR_HUB_LOADING = "Chargement des contenus…";
export const CREATOR_HUB_EMPTY =
  "Aucun contenu publié pour le moment. Revenez bientôt pour découvrir de nouveaux regards locaux.";
export const CREATOR_HUB_ERROR = "Impossible de charger les contenus créateurs.";
export const CREATOR_HUB_RETRY = "Réessayer";

export const CREATOR_DETAIL_ERROR = "Impossible de charger cette histoire.";
export const CREATOR_DETAIL_NOT_FOUND = "Cette histoire n'est plus disponible.";
export const CREATOR_DETAIL_BACK = "Retour au Creator Hub";
export const CREATOR_DETAIL_RETRY = "Réessayer";
export const CREATOR_DETAIL_EMPTY_BODY =
  "Cette histoire ne contient pas encore de texte détaillé.";
export const CREATOR_DETAIL_RELATED_TITLE = "Découvrir d'autres histoires";

export const CREATOR_CONTENT_TYPE_LABELS: Record<CreatorContentType, string> = {
  article: "Article",
  photo: "Photo",
};

const WORDS_PER_MINUTE = 200;
const CREATOR_HUB_PATH = "/creator-content";

/** V1: partner label. Future: creator_profiles display name. */
export function formatContentAuthor(author: CreatorContentAuthor): string {
  const name = author.display_name.trim();
  if (author.kind === "creator_profile") {
    return name || "Créateur·rice";
  }
  return name || "Partenaire local";
}

export function formatReadingTime(body: string | null | undefined): string {
  const words = (body ?? "").trim().split(/\s+/).filter(Boolean).length;
  const minutes = words === 0 ? 1 : Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
  return `${minutes} min`;
}

export function formatCreatorPublishedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatCreatorContentDate(iso: string): string {
  return formatCreatorPublishedAt(iso);
}

export function formatCreatorContentTypeLabel(contentType: CreatorContentType): string {
  return CREATOR_CONTENT_TYPE_LABELS[contentType];
}

export function formatCreatorContentType(contentType: CreatorContentType): string {
  return formatCreatorContentTypeLabel(contentType);
}

export function hasCreatorCover(cover: string | null | undefined): boolean {
  return Boolean(cover?.trim());
}

export function formatCreatorContentBody(body: string | null | undefined): {
  paragraphs: string[];
  isEmpty: boolean;
} {
  const normalized = (body ?? "").replace(/\r\n/g, "\n").trim();
  if (!normalized) {
    return { paragraphs: [], isEmpty: true };
  }
  const paragraphs = normalized
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  if (paragraphs.length === 0) {
    return { paragraphs: [], isEmpty: true };
  }
  return { paragraphs, isEmpty: false };
}

export function getCreatorContentDetailBackHref(): string {
  return CREATOR_HUB_PATH;
}

export function getCreatorContentDetailHref(contentId: string): string {
  return `${CREATOR_HUB_PATH}/${encodeURIComponent(contentId.trim())}`;
}

export function formatCreatorContentNotFoundMessage(): string {
  return CREATOR_DETAIL_NOT_FOUND;
}

export function formatCreatorContentErrorMessage(): string {
  return CREATOR_DETAIL_ERROR;
}
