import type {
  CreatorContentAuthor,
  CreatorContentType,
  CreatorPublicDirectoryItem,
  PartnershipType,
} from "@yunicity/types";

import { partnerStatusLabel, partnerTypeLabel } from "./partner-labels";

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

export const CREATOR_PROFILE_BACK = "Retour au Creator Hub";
export const CREATOR_PROFILE_ERROR = "Impossible de charger ce profil créateur.";
export const CREATOR_PROFILE_NOT_FOUND = "Ce profil créateur n'est plus disponible.";
export const CREATOR_PROFILE_RETRY = "Réessayer";
export const CREATOR_PROFILE_CONTENTS_TITLE = "Histoires publiées";
export const CREATOR_PROFILE_CONTENTS_EMPTY =
  "Aucune histoire publiée pour le moment. Revenez bientôt pour découvrir de nouveaux contenus.";
export const CREATOR_PROFILE_STATS_LABEL = "histoires publiées";

export const CREATOR_DIRECTORY_TITLE = "Créateurs";
export const CREATOR_DIRECTORY_HERO =
  "Découvrez les voix locales qui racontent Yunicity.";
export const CREATOR_DIRECTORY_SUBTITLE =
  "Ambassadeurs, partenaires et regards de terrain — un annuaire des créateurs publics sur votre territoire.";
export const CREATOR_DIRECTORY_EMPTY =
  "Aucun créateur public n'est encore disponible sur ce territoire.";
export const CREATOR_DIRECTORY_ERROR = "Impossible de charger l'annuaire des créateurs.";
export const CREATOR_DIRECTORY_RETRY = "Réessayer";
export const CREATOR_DIRECTORY_SEARCH_PLACEHOLDER = "Rechercher par nom ou quartier…";
export const CREATOR_DIRECTORY_VIEW_PROFILE = "Voir le profil";
export const CREATOR_DIRECTORY_DISCOVER_LINK = "Découvrir les créateurs";
export const CREATOR_DIRECTORY_HUB_LINK = "Voir les histoires";
export const CREATOR_DIRECTORY_BIO_MAX_LENGTH = 140;

export const CREATOR_CONTENT_TYPE_LABELS: Record<CreatorContentType, string> = {
  article: "Article",
  photo: "Photo",
};

const WORDS_PER_MINUTE = 200;
const CREATOR_HUB_PATH = "/creator-content";
const CREATORS_PATH = "/creators";

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

export function getCreatorProfileHref(creatorId: string): string {
  return `${CREATORS_PATH}/${encodeURIComponent(creatorId.trim())}`;
}

export function getCreatorProfileBackHref(): string {
  return CREATOR_HUB_PATH;
}

export function formatCreatorProfileTerritory(
  territory: { city: string; neighborhood_name: string | null },
): string {
  const city = territory.city.trim();
  const neighborhood = territory.neighborhood_name?.trim();
  if (neighborhood && city) {
    return `${neighborhood} · ${city}`;
  }
  return city || neighborhood || "";
}

export function formatCreatorProfileStats(count: number): string {
  return formatCreatorPublishedCountLabel(count);
}

export function formatCreatorPublishedCountLabel(count: number): string {
  const safe = Math.max(0, count);
  if (safe <= 1) {
    return `${safe} histoire publiée`;
  }
  return `${safe} ${CREATOR_PROFILE_STATS_LABEL}`;
}

export function formatCreatorTerritoryLabel(
  territory: { city: string; neighborhood_name: string | null },
): string {
  return formatCreatorProfileTerritory(territory);
}

export function buildCreatorProfileHref(creatorId: string): string {
  return getCreatorProfileHref(creatorId);
}

export function getCreatorDirectoryHref(): string {
  return CREATORS_PATH;
}

export type CreatorDirectoryCardView = {
  id: string;
  displayName: string;
  territoryLabel: string;
  bioExcerpt: string | null;
  publishedCountLabel: string;
  badgeLabel: string | null;
  profileHref: string;
  logoUrl: string | null;
};

export function formatCreatorDirectoryBadge(
  item: Pick<CreatorPublicDirectoryItem, "partnership_type" | "partner_status">,
): string | null {
  if (item.partner_status === "founding_partner") {
    return partnerStatusLabel("founding_partner");
  }
  if (item.partner_status === "premium") {
    return partnerStatusLabel("premium");
  }
  if (item.partnership_type) {
    return partnerTypeLabel(item.partnership_type as PartnershipType);
  }
  return null;
}

export function formatCreatorDirectoryBioExcerpt(
  description: string | null | undefined,
): string | null {
  const normalized = (description ?? "").replace(/\s+/g, " ").trim();
  if (!normalized) {
    return null;
  }
  if (normalized.length <= CREATOR_DIRECTORY_BIO_MAX_LENGTH) {
    return normalized;
  }
  return `${normalized.slice(0, CREATOR_DIRECTORY_BIO_MAX_LENGTH - 1).trimEnd()}…`;
}

export function formatCreatorDirectoryItem(
  item: CreatorPublicDirectoryItem,
): CreatorDirectoryCardView {
  return {
    id: item.id,
    displayName: item.display_name,
    territoryLabel: formatCreatorTerritoryLabel(item.territory),
    bioExcerpt: formatCreatorDirectoryBioExcerpt(item.description),
    publishedCountLabel: formatCreatorPublishedCountLabel(item.published_content_count),
    badgeLabel: formatCreatorDirectoryBadge(item),
    profileHref: buildCreatorProfileHref(item.id),
    logoUrl: item.logo_url,
  };
}
