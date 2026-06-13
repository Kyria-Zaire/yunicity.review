import type {
  NeighborhoodContributionIdentityType,
  NeighborhoodDetailContributionItem,
} from "@yunicity/types";

import { AuthError, isAuthError } from "./auth/auth-errors";

export const NEIGHBORHOOD_V2_CONTRIBUTIONS_SECTION_TITLE = "Ce que les Rémois transmettent";
export const NEIGHBORHOOD_V2_CONTRIBUTIONS_SECTION_SUBTITLE =
  "Des fragments de mémoire partagés par celles et ceux qui vivent ce quartier.";

export const NEIGHBORHOOD_V2_CONTRIBUTION_EMPTY_LINE_1 =
  "Aucun souvenir n'a encore été partagé sur ce quartier.";
export const NEIGHBORHOOD_V2_CONTRIBUTION_EMPTY_LINE_2 =
  "Soyez la première voix à transmettre ce qui le rend unique.";

export const NEIGHBORHOOD_V2_CONTRIBUTION_MODAL_TITLE =
  "Quel souvenir de ce quartier aimeriez-vous transmettre ?";
export const NEIGHBORHOOD_V2_CONTRIBUTION_IDENTITY_HINT =
  "Choisissez la manière dont votre souvenir apparaîtra publiquement.";
export const NEIGHBORHOOD_V2_CONTRIBUTION_TITLE_LABEL = "Titre (optionnel)";
export const NEIGHBORHOOD_V2_CONTRIBUTION_BODY_LABEL = "Souvenir";
export const NEIGHBORHOOD_V2_CONTRIBUTION_EDITORIAL_REMINDER =
  "Les souvenirs sont relus avant publication afin de préserver la qualité de la mémoire collective.";
export const NEIGHBORHOOD_V2_CONTRIBUTION_TRANSMISSION_HINT =
  "Les meilleurs souvenirs sont ceux qui resteront vrais dans plusieurs années.";

export const NEIGHBORHOOD_V2_CONTRIBUTION_SUBMIT_LABEL = "Transmettre";
export const NEIGHBORHOOD_V2_CONTRIBUTION_SUBMITTING_LABEL = "Transmission…";
export const NEIGHBORHOOD_V2_CONTRIBUTION_SUCCESS_MESSAGE =
  "Merci. Votre souvenir sera relu avant publication.";
export const NEIGHBORHOOD_V2_CONTRIBUTION_SEE_MORE_LABEL = "Voir plus";

export const NEIGHBORHOOD_CONTRIBUTION_BODY_MIN_LENGTH = 40;
export const NEIGHBORHOOD_CONTRIBUTION_BODY_MAX_LENGTH = 800;
export const NEIGHBORHOOD_CONTRIBUTION_TITLE_MAX_LENGTH = 120;

export const NEIGHBORHOOD_CONTRIBUTION_IDENTITY_PSEUDO_LABEL = "Pseudo";
export const NEIGHBORHOOD_CONTRIBUTION_IDENTITY_ANONYMOUS_REMOIS_LABEL = "Un Rémois";
export const NEIGHBORHOOD_CONTRIBUTION_IDENTITY_VERIFIED_LABEL = "Citoyen vérifié";

export const NEIGHBORHOOD_CONTRIBUTION_ERROR_PENDING =
  "Vous avez déjà un souvenir en attente de relecture.";
export const NEIGHBORHOOD_CONTRIBUTION_ERROR_QUOTA =
  "Vous avez récemment partagé un souvenir pour ce quartier. Revenez un peu plus tard.";
export const NEIGHBORHOOD_CONTRIBUTION_ERROR_VERIFIED =
  "Un Passport actif est nécessaire pour utiliser cette identité.";
export const NEIGHBORHOOD_CONTRIBUTION_ERROR_AUTH =
  "Connectez-vous pour transmettre un souvenir.";
export const NEIGHBORHOOD_CONTRIBUTION_ERROR_GENERIC =
  "Une erreur est survenue. Veuillez réessayer.";

const MS_PER_DAY = 86_400_000;

export type NeighborhoodContributionFormState = {
  identityType: NeighborhoodContributionIdentityType;
  title: string;
  body: string;
};

export function createInitialContributionFormState(): NeighborhoodContributionFormState {
  return {
    identityType: "PSEUDO",
    title: "",
    body: "",
  };
}

export function formatContributionCharacterCount(current: number, max: number): string {
  return `${current} / ${max}`;
}

export function validateContributionTitle(title: string): boolean {
  return title.trim().length <= NEIGHBORHOOD_CONTRIBUTION_TITLE_MAX_LENGTH;
}

export function validateContributionBody(body: string): boolean {
  const length = body.trim().length;
  return (
    length >= NEIGHBORHOOD_CONTRIBUTION_BODY_MIN_LENGTH &&
    length <= NEIGHBORHOOD_CONTRIBUTION_BODY_MAX_LENGTH
  );
}

export function isContributionFormValid(state: NeighborhoodContributionFormState): boolean {
  return validateContributionTitle(state.title) && validateContributionBody(state.body);
}

export function mapContributionSubmitError(error: unknown): string {
  if (isAuthError(error)) {
    if (error.status === 401) {
      return NEIGHBORHOOD_CONTRIBUTION_ERROR_AUTH;
    }
    if (error.code === "CONTRIBUTION_PENDING_EXISTS") {
      return NEIGHBORHOOD_CONTRIBUTION_ERROR_PENDING;
    }
    if (error.code === "CONTRIBUTION_QUOTA_EXCEEDED") {
      return NEIGHBORHOOD_CONTRIBUTION_ERROR_QUOTA;
    }
    if (error.code === "CONTRIBUTION_VERIFIED_IDENTITY_UNAVAILABLE") {
      return NEIGHBORHOOD_CONTRIBUTION_ERROR_VERIFIED;
    }
    if (error.message?.trim()) {
      return error.message.trim();
    }
  }
  return NEIGHBORHOOD_CONTRIBUTION_ERROR_GENERIC;
}

export function selectApprovedContributionsForDisplay(
  contributions: NeighborhoodDetailContributionItem[],
  limit = 3,
): NeighborhoodDetailContributionItem[] {
  return contributions.slice(0, limit);
}

export function shouldShowContributionSeeMore(contributionsCount: number): boolean {
  return contributionsCount > 3;
}

export function contributionHasVisibleTitle(title: string | null | undefined): boolean {
  return Boolean(title?.trim());
}

export function buildContributionCardSections(
  item: NeighborhoodDetailContributionItem,
  now: Date = new Date(),
): {
  identity: string;
  title: string | null;
  body: string;
  dateLabel: string;
} {
  return {
    identity: item.author_label,
    title: contributionHasVisibleTitle(item.title) ? item.title!.trim() : null,
    body: item.body,
    dateLabel: formatNeighborhoodContributionDate(item.approved_at ?? item.created_at, now),
  };
}

export function formatNeighborhoodContributionDate(
  iso: string | null | undefined,
  now: Date = new Date(),
): string {
  if (!iso) {
    return "";
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const diffMs = now.getTime() - date.getTime();
  if (diffMs < MS_PER_DAY) {
    return "Aujourd'hui";
  }
  if (diffMs < 2 * MS_PER_DAY) {
    return "Hier";
  }
  if (diffMs < 7 * MS_PER_DAY) {
    const days = Math.floor(diffMs / MS_PER_DAY);
    return days === 1 ? "Il y a 1 jour" : `Il y a ${days} jours`;
  }

  const sameYear = date.getFullYear() === now.getFullYear();
  if (sameYear) {
    const month = date.toLocaleDateString("fr-FR", { month: "long" });
    return month.charAt(0).toUpperCase() + month.slice(1);
  }

  const formatted = date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}
