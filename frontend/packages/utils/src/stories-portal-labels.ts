/** Stories portal micro-copy (WEB-STORIES-01). */

export const STORIES_PAGE_TITLE = "Stories";
export const STORIES_PAGE_SUBTITLE =
  "Découvrez les moments partagés par la communauté en temps réel.";

export const STORIES_TAB_FOR_YOU = "Pour vous";
export const STORIES_TAB_SUBSCRIPTIONS = "Abonnements";
export const STORIES_TAB_RECENT = "Récentes";
export const STORIES_FILTER = "Filtrer";

export const STORIES_CTA_TITLE = "Partagez votre story ✨";
export const STORIES_CTA_BODY = "Montrez ce que vous vivez dans votre ville !";
export const STORIES_CTA_BUTTON = "Créer une story";

export const STORIES_LEFT_HOME = "Accueil";
export const STORIES_LEFT_SUBSCRIPTIONS = "Abonnements";
export const STORIES_LEFT_POPULAR = "Populaires";
export const STORIES_LEFT_NEARBY = "Près de moi";
export const STORIES_LEFT_DISCUSSIONS = "Discussions";
export const STORIES_LEFT_STORIES = "Stories";
export const STORIES_LEFT_CONTRIBUTIONS = "Contributions";
export const STORIES_LEFT_SAVED = "Enregistrés";

export const STORIES_TRIBES_TITLE = "Vos tribus";
export const STORIES_TRIBES_CTA = "Voir tout";
export const STORIES_TRIBES_MORE = (count: number) =>
  `+ ${count} autre${count > 1 ? "s" : ""} tribu${count > 1 ? "s" : ""}`;
export const STORIES_TRIBES_EMPTY = "Rejoignez une tribu pour enrichir votre fil stories.";

export const STORIES_FEATURED_TITLE = "Story à la une";
export const STORIES_FEATURED_CTA = "Voir la sélection";

export const STORIES_LIVE_TITLE = "Stories en direct";
export const STORIES_LIVE_CTA = "Voir tout";
export const STORIES_LIVE_EMPTY = "Aucune story récente pour le moment.";
export const STORIES_LIVE_BADGE = "Récent";

export const STORIES_CATEGORIES_TITLE = "Catégories";
export const STORIES_CATEGORIES_CTA = "Voir tout";

export const STORIES_CONTRIBUTORS_TITLE = "Top contributeurs";
export const STORIES_CONTRIBUTORS_CTA = "Voir tout";
export const STORIES_CONTRIBUTORS_EMPTY = "Les contributeurs apparaîtront au fil des publications.";
export const STORIES_CONTRIBUTOR_COUNT = (count: number) =>
  `${count} story${count > 1 ? "s" : ""}`;

export const STORIES_TIP_TITLE = "Conseil";
export const STORIES_TIP_BODY =
  "Utilisez les stories pour partager des moments éphémères avec votre communauté.";
export const STORIES_TIP_CTA = "En savoir plus";

export const STORIES_LOAD_MORE = "Charger plus de stories";
export const STORIES_LOADING = "Chargement des stories…";
export const STORIES_ERROR = "Impossible de charger les stories.";
export const STORIES_RETRY = "Réessayer";
export const STORIES_EMPTY =
  "Aucune story pour l'instant. Soyez le premier à partager un moment local.";

export const STORIES_RING_YOURS = "Votre story";

export const STORIES_NEW_TITLE = "Nouvelle story";
export const STORIES_NEW_SUBTITLE =
  "Partagez un moment éphémère avec votre communauté.";

export const STORIES_NEW_STEP1_TITLE = "Ajoutez votre contenu";
export const STORIES_NEW_STEP1_HINT = "Photo ou vidéo (max. 15 s pour la vidéo)";
export const STORIES_NEW_UPLOAD_TITLE = "Cliquez pour ajouter une photo ou une vidéo";
export const STORIES_NEW_UPLOAD_SUBTITLE = "ou glissez-déposez ici";
export const STORIES_NEW_UPLOAD_BUTTON = "Parcourir mes fichiers";
export const STORIES_NEW_UPLOAD_TIP_FORMAT = "Format vertical recommandé";
export const STORIES_NEW_UPLOAD_TIP_IMAGE = "Photo : JPG, PNG, WEBP";
export const STORIES_NEW_UPLOAD_TIP_VIDEO = "Vidéo : MP4 (max. 15 s)";
export const STORIES_NEW_UPLOAD_TIP_SIZE = "Taille max. 20 Mo";

export const STORIES_NEW_STEP2_TITLE = "Ajoutez du texte";
export const STORIES_NEW_STEP2_OPTIONAL = "(optionnel)";
export const STORIES_NEW_STEP2_HINT = "Décrivez votre moment en quelques mots…";
export const STORIES_NEW_CAPTION_PLACEHOLDER = "Écrivez quelque chose…";
export const STORIES_NEW_PROMPT_WHERE = "Où êtes-vous ?";
export const STORIES_NEW_PROMPT_WHAT = "Que faites-vous ?";
export const STORIES_NEW_PROMPT_WHO = "Avec qui ?";
export const STORIES_NEW_PROMPT_HASHTAG = "Ajoutez un hashtag";

export const STORIES_NEW_STEP3_TITLE = "Ajoutez des éléments";
export const STORIES_NEW_STEP3_HINT = "Rendez votre story encore plus vivante !";
export const STORIES_NEW_ELEMENT_LOCATION = "Localisation";
export const STORIES_NEW_ELEMENT_MENTION = "Mention";
export const STORIES_NEW_ELEMENT_HASHTAG = "Hashtag";
export const STORIES_NEW_ELEMENT_MUSIC = "Musique";
export const STORIES_NEW_ELEMENT_POLL = "Sondage";
export const STORIES_NEW_ELEMENT_SOON = "Bientôt disponible sur Yunicity.";

export const STORIES_NEW_STEP4_TITLE = "Choisissez votre audience";
export const STORIES_NEW_STEP4_HINT = "Qui peut voir votre story ?";
export const STORIES_NEW_AUDIENCE_PUBLIC_TITLE = "Tout le monde";
export const STORIES_NEW_AUDIENCE_PUBLIC_BODY = "Visible par tous les utilisateurs de votre ville.";
export const STORIES_NEW_AUDIENCE_COMMUNITY_TITLE = "Ma communauté";
export const STORIES_NEW_AUDIENCE_COMMUNITY_BODY =
  "Visible par les membres de vos tribus.";
export const STORIES_NEW_VISIBILITY_NOTICE =
  "Votre story restera visible pendant 24 heures.";

export const STORIES_NEW_PREVIEW_TITLE = "Aperçu de votre story";
export const STORIES_NEW_PREVIEW_CAPTION_PLACEHOLDER = "Décrivez votre moment…";
export const STORIES_NEW_PREVIEW_VISIBILITY_PUBLIC = "Visible par tous";
export const STORIES_NEW_PREVIEW_VISIBILITY_COMMUNITY = "Visible par votre communauté";

export const STORIES_NEW_IDEAS_TITLE = "Idées de stories";
export const STORIES_NEW_IDEAS = [
  {
    id: "sunset",
    title: "Un beau coucher de soleil",
    body: "Partagez la beauté de votre ville",
  },
  {
    id: "cafe",
    title: "Votre café préféré",
    body: "Montrez vos bonnes adresses",
  },
  {
    id: "friends",
    title: "Une sortie entre amis",
    body: "Capturez vos meilleurs moments",
  },
  {
    id: "event",
    title: "Un événement local",
    body: "Faites vivre l'actualité locale",
  },
  {
    id: "nature",
    title: "Un coin de nature",
    body: "Montrez votre coin de paradis",
  },
] as const;

export const STORIES_NEW_RULES_TITLE = "Règles de la communauté";
export const STORIES_NEW_RULES_LINK = "Voir toutes les règles";
export const STORIES_NEW_RULES = [
  { id: "authentic", label: "Soyez authentique" },
  { id: "appropriate", label: "Pas de contenu inapproprié" },
  { id: "respect", label: "Respectez les autres membres" },
  { id: "privacy", label: "Protégez la vie privée" },
] as const;

export const STORIES_LEFT_TIP_TITLE = "Conseil";
export const STORIES_LEFT_TIP_BODY =
  "Les stories disparaissent après 24 h. Soyez authentique et partagez l'instant !";
export const STORIES_LEFT_TIP_LINK = "En savoir plus";

export const STORIES_NEW_PUBLISH = "Publier ma story";
export const STORIES_NEW_PUBLISHING = "Publication…";
export const STORIES_NEW_CANCEL = "Annuler";
export const STORIES_NEW_ERROR = "Impossible de publier la story.";
export const STORIES_NEW_UPLOAD_ERROR = "Impossible d'envoyer le fichier.";
export const STORIES_NEW_VIDEO_TOO_LONG = "La vidéo ne doit pas dépasser 15 secondes.";
export const STORIES_NEW_MEDIA_REQUIRED = "Ajoutez une photo ou une vidéo.";

export const STORIES_CAPTION_MAX = 100;
export const STORIES_VIDEO_MAX_SECONDS = 15;
export const STORIES_MEDIA_MAX_MB = 20;

// Legacy keys kept for simple form fallback
export const STORIES_NEW_MEDIA_LABEL = "URL de l'image";
export const STORIES_NEW_MEDIA_PLACEHOLDER = "https://…";
export const STORIES_NEW_CAPTION_LABEL = "Légende";
export const STORIES_NEW_LOCATION_LABEL = "Lieu (optionnel)";
export const STORIES_NEW_LOCATION_PLACEHOLDER = "Ex : Cathédrale de Reims";

export const STORIES_CATEGORY_ALL = "Tous";
export const STORIES_CATEGORY_CAFES = "Cafés & Bars";
export const STORIES_CATEGORY_CONCERTS = "Concerts";
export const STORIES_CATEGORY_NATURE = "Nature";
export const STORIES_CATEGORY_CULTURE = "Culture";
export const STORIES_CATEGORY_SPORT = "Sport";
export const STORIES_CATEGORY_LOCAL = "Vie locale";
export const STORIES_CATEGORY_EVENTS = "Événements";
