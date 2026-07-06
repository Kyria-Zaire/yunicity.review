/** Labels UI — création de post fil (FEED-POST-COMPOSER-01). */

export const POST_COMPOSER_BODY_MAX = 2200;
export const POST_MEDIA_MAX_COUNT = 10;

export const POST_NEW_TITLE = "Nouveau poste";
export const POST_NEW_CREATE_TITLE = "Créer un poste";
export const POST_NEW_PUBLISH = "Publier";
export const POST_NEW_NEXT = "Suivant";
export const POST_NEW_CLOSE = "Fermer";
export const POST_NEW_PLACEHOLDER = (city: string) => `Quoi de neuf à ${city} ?`;
export const POST_NEW_ADD_TO_POST = "Ajouter à votre publication";
export const POST_NEW_TAG_PEOPLE = "Identifier des personnes";
export const POST_NEW_TAG_LOCATION = "Identifier un lieu";
export const POST_NEW_ADD_ACTIVITY = "Ajouter une activité";
export const POST_NEW_SHARE_TRIBE = "Partager dans une tribu";
export const POST_NEW_SCHEDULE = "Programmer la publication";
export const POST_NEW_AUDIENCE_TITLE = "Audience";
export const POST_NEW_AUDIENCE_PUBLIC = "Public";
export const POST_NEW_AUDIENCE_PUBLIC_HINT = "Visible par tous les utilisateurs";
export const POST_NEW_AUDIENCE_FOLLOWERS = "Abonnés";
export const POST_NEW_AUDIENCE_FOLLOWERS_HINT = "Visible uniquement par vos abonnés";
export const POST_NEW_AUDIENCE_CLOSE_FRIENDS = "Amis proches";
export const POST_NEW_AUDIENCE_CLOSE_FRIENDS_HINT = "Visible uniquement par vos amis proches";
export const POST_NEW_AUDIENCE_CUSTOM = "Personnalisée";
export const POST_NEW_AUDIENCE_CUSTOM_HINT = "Choisir des personnes spécifiques";
export const POST_NEW_ALLOW_COMMENTS = "Autoriser les commentaires";
export const POST_NEW_ALLOW_SHARES = "Autoriser les partages";
export const POST_NEW_MEDIA_CAPTION = "Ajouter une légende à vos médias";
export const POST_NEW_PREVIEW_TITLE = "Aperçu de la publication";
export const POST_NEW_CROSS_POST_TITLE = "Partager aussi sur";
export const POST_NEW_SELECT_MEDIA = "Sélectionner des médias";
export const POST_NEW_GALLERY = "Galerie";
export const POST_NEW_TAB_PHOTO = "Photo";
export const POST_NEW_TAB_VIDEO = "Vidéo";
export const POST_NEW_TAB_TEXT = "Texte";
export const POST_NEW_TAB_POLL = "Sondage";
export const POST_NEW_TAB_LOCATION = "Lieu";
export const POST_NEW_ERROR = "Publication impossible pour le moment.";
export const POST_NEW_UPLOAD_ERROR = "Envoi du média impossible.";
export const POST_NEW_BODY_REQUIRED = "Ajoutez un texte ou un média pour publier.";
export const POST_NEW_POLL_MIN_OPTIONS = "Ajoutez au moins deux options au sondage.";

export const POST_VISIBILITY_OPTIONS = [
  { id: "public" as const, label: POST_NEW_AUDIENCE_PUBLIC, hint: POST_NEW_AUDIENCE_PUBLIC_HINT },
  {
    id: "followers" as const,
    label: POST_NEW_AUDIENCE_FOLLOWERS,
    hint: POST_NEW_AUDIENCE_FOLLOWERS_HINT,
  },
  {
    id: "close_friends" as const,
    label: POST_NEW_AUDIENCE_CLOSE_FRIENDS,
    hint: POST_NEW_AUDIENCE_CLOSE_FRIENDS_HINT,
  },
  {
    id: "custom" as const,
    label: POST_NEW_AUDIENCE_CUSTOM,
    hint: POST_NEW_AUDIENCE_CUSTOM_HINT,
  },
] as const;

export const POST_FORMAT_TABS = [
  { id: "photo" as const, label: POST_NEW_TAB_PHOTO },
  { id: "video" as const, label: POST_NEW_TAB_VIDEO },
  { id: "text" as const, label: POST_NEW_TAB_TEXT },
  { id: "poll" as const, label: POST_NEW_TAB_POLL },
  { id: "location" as const, label: POST_NEW_TAB_LOCATION },
] as const;

export const POST_CROSS_POST_PLATFORMS = [
  { id: "instagram" as const, label: "Instagram", handle: "@kyria.m" },
  { id: "tiktok" as const, label: "TikTok", handle: "@kyria.m" },
  { id: "facebook" as const, label: "Facebook", handle: "Kyria Mambu" },
  { id: "twitter" as const, label: "Twitter / X", handle: "@kyria_m" },
] as const;

export type PostComposerMobileStepId = "compose" | "media" | "options";

export const POST_COMPOSER_MOBILE_STEPS: readonly { id: PostComposerMobileStepId; label: string }[] =
  [
    { id: "compose", label: "Rédiger" },
    { id: "media", label: "Médias" },
    { id: "options", label: "Options" },
  ];
