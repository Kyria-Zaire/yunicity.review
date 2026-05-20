/** Tribe UI micro-copy (TICKET-A.3) — calme, territorial, anti-Discord. */

import type { Tribe, TribeMemberRole, TribeVisibility } from "@yunicity/types";

export const TRIBES_PAGE_TITLE = "Tribus";
export const TRIBES_PAGE_SUBTITLE =
  "Petits cercles d’intérêt à Reims — coordination légère, sans bruit social.";
export const TRIBES_EMPTY =
  "Aucune tribu n’est ouverte ici pour l’instant. Le fil local reste votre point d’entrée.";
export const TRIBES_ERROR = "Impossible de charger les tribus.";
export const TRIBES_RETRY = "Réessayer";
export const TRIBES_LOADING = "Chargement des tribus…";

export const TRIBE_DETAIL_LOADING = "Chargement de la tribu…";
export const TRIBE_NOT_FOUND = "Cette tribu n’est pas disponible.";
export const TRIBE_ARCHIVED_TITLE = "Tribu en pause";
export const TRIBE_ARCHIVED_BODY =
  "Cet espace est archivé. Les publications restent accessibles aux anciens membres selon la modération.";
export const TRIBE_PRIVATE_TITLE = "Accès sur invitation";
export const TRIBE_PRIVATE_BODY =
  "Cette tribu n’est pas ouverte au grand public. Demandez une invitation à un membre.";
export const TRIBE_WALL_TITLE = "Mur de la tribu";
export const TRIBE_WALL_EMPTY =
  "Aucune publication pour l’instant. Un premier message suffit pour lancer la conversation.";
export const TRIBE_WALL_MEMBERS_ONLY = "Rejoignez la tribu pour lire et publier sur le mur.";
export const TRIBE_MEMBERS_TITLE = "Membres";
export const TRIBE_MEMBERS_EMPTY = "Aucun membre actif pour le moment.";

export const TRIBE_JOIN_CTA = "Rejoindre";
export const TRIBE_LEAVE_CTA = "Quitter";
export const TRIBE_LEAVE_CONFIRM = "Quitter sans annoncer";
export const TRIBE_CHARTER_LABEL = "J’accepte la charte de cette tribu (espace calme, pas de spam).";
export const TRIBE_PUBLISH_CTA = "Publier";
export const TRIBE_COMPOSER_PLACEHOLDER = "Un message pour la tribu…";
export const TRIBE_DISCOVER_CTA = "Voir la tribu";
export const TRIBE_FEED_LINK = "Retour au fil local";

export const TRIBE_MEMBER_COUNT = (count: number, limit: number): string =>
  `${count} participant${count > 1 ? "s" : ""} · max ${limit}`;

export const TRIBE_VISIBILITY_LABELS: Record<TribeVisibility, string> = {
  public: "Ouverte",
  private_invite: "Sur invitation",
};

export const TRIBE_CATEGORY_LABELS: Record<string, string> = {
  sport_local: "Sport local",
  photography: "Photo urbaine",
  volunteering: "Bénévolat",
  cafe_culture: "Cafés & culture",
  students: "Étudiants",
  music: "Musique locale",
  association: "Associations",
  other: "Autre",
};

export const TRIBE_ROLE_LABELS: Record<TribeMemberRole, string> = {
  member: "Membre",
  moderator: "Modérateur",
  owner: "Responsable",
};

export function tribeCategoryLabel(category: string): string {
  return TRIBE_CATEGORY_LABELS[category] ?? category;
}

export function tribeVisibilityLabel(visibility: TribeVisibility): string {
  return TRIBE_VISIBILITY_LABELS[visibility] ?? visibility;
}

export function tribeHref(slug: string, city: string): string {
  return `/tribes/${encodeURIComponent(slug)}?city=${encodeURIComponent(city)}`;
}

export function tribeInvitationHref(token: string, slug?: string, city?: string): string {
  const params = new URLSearchParams({ token });
  if (slug) {
    params.set("slug", slug);
  }
  if (city) {
    params.set("city", city);
  }
  return `/tribes/invitation?${params.toString()}`;
}

export const TRIBE_INVITATIONS_SECTION_TITLE = "Invitations tribus";
export const TRIBE_INVITATIONS_SECTION_BODY =
  "Invitations personnelles — sans pression ni relance automatique.";
export const TRIBE_INVITATIONS_EMPTY = "Aucune invitation en attente.";
export const TRIBE_INVITATIONS_ACCEPT = "Accepter";
export const TRIBE_INVITATIONS_DECLINE = "Ignorer";
export const TRIBE_INVITATIONS_LINK_HINT =
  "Vous avez reçu un lien ? Ouvrez-le depuis votre messagerie ou collez-le ci-dessous.";

export const TRIBE_MOD_DELETE_POST = "Retirer cette publication";
export const TRIBE_MOD_EXCLUDE_MEMBER = "Exclure ce membre";
export const TRIBE_MOD_PROMOTE_MOD = "Nommer modérateur";
export const TRIBE_MOD_DEMOTE_MOD = "Retirer modération";

export function tribeTerritorialLine(tribe: Tribe): string {
  return `${tribe.name} · ${tribe.city}`;
}

/** Mur tribu distinct du fil — badge contextuel discret. */
export const TRIBE_WALL_CONTEXT_BADGE = "Espace tribu";
