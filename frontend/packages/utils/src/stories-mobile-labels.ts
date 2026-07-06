/** Story creation mobile copy (MOBILE-NEW-STORY-01). */

export const STORIES_MOBILE_NEW_TITLE = "Partager une story";
export const STORIES_MOBILE_NEW_BACK = "Retour";
export const STORIES_MOBILE_NEW_PUBLISH = "Publier";
export const STORIES_MOBILE_NEW_NEXT = "Continuer";

export const STORIES_MOBILE_STEPS = [
  { id: "content", label: "Contenu" },
  { id: "details", label: "Détails" },
  { id: "share", label: "Partager" },
] as const;

export type StoryMobileStepId = (typeof STORIES_MOBILE_STEPS)[number]["id"];

export const STORIES_MOBILE_MODE_PHOTO = "Photo";
export const STORIES_MOBILE_MODE_VIDEO = "Vidéo";
export const STORIES_MOBILE_MODE_STORY = "Story";
export const STORIES_MOBILE_MODE_LIVE = "Live";
export const STORIES_MOBILE_MODE_LIVE_SOON = "Live — bientôt disponible";

export const STORIES_MOBILE_GALLERY = "Galerie";
export const STORIES_MOBILE_FLIP = "Retourner";
export const STORIES_MOBILE_TEMPLATES = "Templates";
export const STORIES_MOBILE_IDEAS = "Boîte à idées";

export const STORIES_MOBILE_TOOL_TEXT = "Texte";
export const STORIES_MOBILE_TOOL_DRAW = "Dessiner";
export const STORIES_MOBILE_TOOL_STICKER = "Sticker";
export const STORIES_MOBILE_TOOL_FILTER = "Filtre";
export const STORIES_MOBILE_TOOL_MUSIC = "Musique";
export const STORIES_MOBILE_TOOL_LINK = "Lien";

export const STORIES_MOBILE_ADD_MEDIA = "Ajouter";
export const STORIES_MOBILE_DESCRIPTION_LABEL = "Ajouter une description…";
export const STORIES_MOBILE_LOCATION_LABEL = "Ajouter un lieu";
export const STORIES_MOBILE_LOCATION_ADD_ANOTHER = "Ajouter un autre lieu";

export const STORIES_MOBILE_AUDIENCE_TITLE = "Audience";
export const STORIES_MOBILE_AUDIENCE_PUBLIC = "Tout le monde";
export const STORIES_MOBILE_AUDIENCE_PUBLIC_BODY = "Visible par tous les utilisateurs";
export const STORIES_MOBILE_AUDIENCE_FOLLOWERS = "Abonnés";
export const STORIES_MOBILE_AUDIENCE_FOLLOWERS_BODY = "Visible uniquement par vos abonnés";
export const STORIES_MOBILE_AUDIENCE_CLOSE_FRIENDS = "Amis proches";
export const STORIES_MOBILE_AUDIENCE_CLOSE_FRIENDS_BODY =
  "Visible uniquement par vos amis proches";
export const STORIES_MOBILE_AUDIENCE_CUSTOM = "Personnalisée";
export const STORIES_MOBILE_AUDIENCE_CUSTOM_BODY = "Choisir qui peut voir cette story";
export const STORIES_MOBILE_AUDIENCE_COMMUNITY = "Ma communauté";
export const STORIES_MOBILE_AUDIENCE_COMMUNITY_BODY = "Visible par les membres de vos tribus";
export const STORIES_MOBILE_AUDIENCE_SOON = "Bientôt disponible";

export const STORIES_MOBILE_OPTIONS_TITLE = "Options";
export const STORIES_MOBILE_OPTION_REPLIES = "Autoriser les réponses";
export const STORIES_MOBILE_OPTION_MESSAGES = "Autoriser les messages";
export const STORIES_MOBILE_OPTION_SAVE = "Autoriser l'enregistrement";
export const STORIES_MOBILE_OPTION_SOON = "Bientôt disponible";

export const STORIES_MOBILE_CROSSPOST_TITLE = "Partager aussi sur";
export const STORIES_MOBILE_CROSSPOST_SOON = "Connexion réseaux — bientôt disponible";

export const STORIES_MOBILE_EPHEMERAL_TITLE = "Story éphémère";
export const STORIES_MOBILE_EPHEMERAL_BODY =
  "Votre story sera visible pendant 24h puis disparaîtra automatiquement.";

export const STORIES_MOBILE_CAPTURE_HINT =
  "Choisissez une photo ou une vidéo verticale pour votre story.";
export const STORIES_MOBILE_CAMERA_DENIED =
  "Impossible d'accéder à la caméra. Autorisez l'accès ou utilisez la galerie.";
export const STORIES_MOBILE_RECORDING = "Enregistrement…";
export const STORIES_MOBILE_TAP_TO_STOP = "Appuyez pour arrêter";

export const STORIES_MOBILE_TEXT_PLACEHOLDER = "Votre texte sur la story…";
export const STORIES_MOBILE_TEXT_APPLY = "OK";
export const STORIES_MOBILE_TEXT_STYLE_CLASSIC = "Classique";
export const STORIES_MOBILE_TEXT_STYLE_LARGE = "Grand";
