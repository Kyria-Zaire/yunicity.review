/** Labels UI — création de post fil (FEED-POST-COMPOSER-01). */

export const POST_COMPOSER_BODY_MAX = 2200;
export const POST_MEDIA_MAX_COUNT = 10;

// « Nouveau poste » était un faux ami : « poste » désigne un emploi. L'écran
// crée une PUBLICATION (FEED-NEW-UX-01).
export const POST_NEW_TITLE = "Créer une publication";
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
/** Échec de la CRÉATION — aucun fichier en cause (I4 de la revue finale). */
export const POST_NEW_CREATE_FAILED_TITLE = "La publication n'a pas pu être créée.";
export const POST_NEW_UPLOAD_ERROR = "Envoi du média impossible.";
export const POST_NEW_BODY_REQUIRED = "Ajoutez un texte ou un média pour publier.";
export const POST_NEW_POLL_MIN_OPTIONS = "Ajoutez au moins deux options au sondage.";

// ─────────── FEED-NEW-UX-01 — reconstruction de `/feed/new`
//
// Libellés de la couche logique reconstruite : identité et statut par média,
// rejets nommés un par un, réordonnancement annoncé, reprise d'envoi.

export const POST_NEW_PUBLIC_MENTION = "Publication publique";
export const POST_NEW_MEDIA_ADD = "Ajouter des photos ou vidéos";
export const POST_NEW_MEDIA_DROP_HINT = "Glissez vos fichiers ici";
export const POST_NEW_MEDIA_EMPTY_DROP_HINT = "Glissez-déposer vos fichiers ici";
export const POST_NEW_MEDIA_LIMIT_HINT = (max: number) => `Jusqu'à ${max} médias`;
/** Nom accessible du raccourci de retrait d'une vignette (pastille ✕). */
export const POST_NEW_MEDIA_REMOVE_ONE = (index: number) => `Retirer le média ${index}`;
/** État par vignette pendant et après un envoi (planche « Échec partiel »). */
export const POST_NEW_MEDIA_STATUS_UPLOADED = "Envoyée";
export const POST_NEW_MEDIA_STATUS_UPLOADING = "Envoi…";
export const POST_NEW_MEDIA_STATUS_PENDING = "En attente";
export const POST_NEW_MEDIA_STATUS_FAILED = "Échec";
export const POST_NEW_MEDIA_COUNT = (count: number, max: number) =>
  `${count} ${count > 1 ? "médias" : "média"} sur ${max}`;
export const POST_NEW_MEDIA_FIRST_HINT = "La première photo ouvrira la publication";
export const POST_NEW_MEDIA_MOVE_FORWARD = "Avancer";
export const POST_NEW_MEDIA_MOVE_BACKWARD = "Reculer";
export const POST_NEW_MEDIA_MAKE_FIRST = "Mettre en premier";
export const POST_NEW_MEDIA_REMOVE = "Retirer";
export const POST_NEW_MEDIA_POSITION = (index: number, total: number) =>
  `Média ${index} sur ${total}`;
export const POST_NEW_MEDIA_MOVED = (index: number) => `Média déplacé en position ${index}`;
export const POST_NEW_REJECTED_TITLE = (count: number) =>
  count > 1 ? `${count} fichiers n'ont pas été ajoutés` : "1 fichier n'a pas été ajouté";
export const POST_NEW_REJECTED_CHOOSE_OTHERS = "Choisir d'autres fichiers";
/**
 * Le sélecteur a rendu la main SANS aucun fichier. Annulation volontaire ou
 * sélection perdue en route (perte signalée sur Safari iPhone, jamais
 * reproduite) : les deux sont indiscernables, le message couvre les deux sans
 * rien affirmer.
 */
export const POST_NEW_SELECTION_EMPTY =
  "Aucun fichier n'a été reçu. Si vous en aviez choisi, réessayez : votre texte et vos médias sont conservés.";
export const POST_NEW_REJECTED_CONTINUE = "Continuer sans eux";
export const POST_NEW_REJECTED_KEEP_HINT =
  "Les médias déjà sélectionnés restent attachés. Rien n'a été retiré de votre brouillon.";
/**
 * Le média en échec est désigné par son RANG, celui de la pastille visible sur
 * sa vignette — un nom de fichier (« IMG_2034.HEIC ») ne se retrouve pas à
 * l'écran. Le nom reste disponible en complément (`POST_NEW_UPLOAD_FAILED_FILE`).
 */
export const POST_NEW_UPLOAD_FAILED_TITLE = (kind: "photo" | "vidéo", rank: number) =>
  `L'envoi de la ${kind} ${rank} a échoué.`;
export const POST_NEW_UPLOAD_FAILED_FILE = (name: string) => `Fichier : ${name}`;
export const POST_NEW_UPLOAD_KEPT = (count: number) => {
  if (count === 0) return "Votre texte est conservé.";
  return count > 1
    ? `Vos ${count} médias et votre texte sont conservés.`
    : "Votre média et votre texte sont conservés.";
};
export const POST_NEW_UPLOAD_SESSION_SCOPE =
  "Les médias déjà envoyés ne seront pas renvoyés, tant que cet écran reste ouvert.";
export const POST_NEW_UPLOAD_RETRY = "Réessayer l'envoi";
/**
 * Contenu figé pendant une tentative en cours ou à l'issue inconnue : le
 * modifier ferait partir, sous la même clé, autre chose que ce qui a peut-être
 * déjà été publié.
 */
export const POST_NEW_CONTENT_LOCKED =
  "Le contenu est figé tant que l'envoi n'est pas confirmé.";
export const POST_NEW_UPLOAD_PROGRESS = (done: number, total: number) =>
  `Envoi ${done} sur ${total}`;
/**
 * Sortie avec un brouillon modifié : la PERTE est annoncée en clair, dans le
 * titre comme dans le bouton. ⛔ « Abandonner » seul ne disait pas ce qui
 * disparaît.
 */
export const POST_NEW_DISCARD_TITLE = "Quitter sans publier ?";
export const POST_NEW_DISCARD_HINT = "Votre texte et vos médias seront perdus.";
export const POST_NEW_DISCARD_CONFIRM = "Quitter et perdre le brouillon";
export const POST_NEW_DISCARD_CANCEL = "Continuer la rédaction";
// Le message partagé des composers dit « JPEG, PNG ou WebP uniquement » : faux
// ici, où `/feed/new` accepte aussi MP4 et WebM.
export const POST_NEW_INVALID_TYPE =
  "Format non pris en charge — photo JPEG, PNG, WebP ou vidéo MP4, WebM.";
export const POST_NEW_TOO_LARGE = (maxMb: number) => `Fichier trop lourd — ${maxMb} Mo maximum.`;
export const POST_NEW_MAX_REACHED = (max: number) => `Limite de ${max} médias atteinte.`;

// Réponse 409 POST_REQUEST_CONFLICT : la publication est DÉJÀ partie, et son
// contenu diffère de ce qui est à l'écran. ⛔ Ce n'est pas un échec à réessayer.
export const POST_NEW_ALREADY_SENT_TITLE = "Cette publication a déjà été envoyée.";
export const POST_NEW_ALREADY_SENT_HINT =
  "Une version antérieure est partie avant la coupure. Ouvrez le fil pour la retrouver avant de la modifier.";
export const POST_NEW_ALREADY_SENT_ACTION = "Ouvrir le fil";

// ─────────── §3.4 bis du contrat — L'ISSUE INDÉTERMINÉE
//
// La requête de création est partie, aucune réponse n'est revenue. Personne ne
// sait si la publication existe. ⛔ N'annoncer NI échec NI succès : nommer
// l'incertitude, offrir le rejeu (même clé, donc sûr), renvoyer au fil.

export const POST_NEW_UNDETERMINED_TITLE = "Nous n'avons pas pu confirmer l'envoi.";
export const POST_NEW_UNDETERMINED_HINT =
  "La connexion s'est interrompue avant la réponse. Votre publication est peut-être déjà en ligne : réessayez sans risque de doublon, ou ouvrez le fil pour vérifier.";
/** Action PRIMAIRE : rejeu sous la même clé, donc sans doublon possible. */
export const POST_NEW_UNDETERMINED_RETRY = "Réessayer l'envoi";
export const POST_NEW_UNDETERMINED_CHECK_FEED = "Vérifier dans le fil";

// Quitter n'annule rien côté serveur. ⛔ « Abandonner » seul promettrait une
// annulation qui n'existe pas.
export const POST_NEW_LEAVE_NO_CANCEL_TITLE = "Quitter n'annule pas cet envoi.";
export const POST_NEW_LEAVE_NO_CANCEL_HINT =
  "Si la publication est déjà partie, elle restera en ligne. Ouvrez le fil pour vérifier avant de la réécrire.";
/** Ajouté au message : le brouillon à l'écran, lui, n'est pas conservé. */
export const POST_NEW_LEAVE_NO_CANCEL_DRAFT_LOST = "Le brouillon affiché ici sera perdu.";
export const POST_NEW_LEAVE_NO_CANCEL_CONFIRM = "Quitter sans vérifier";
export const POST_NEW_LEAVE_NO_CANCEL_CANCEL = "Rester sur cet écran";

/**
 * Clé retrouvée après un rechargement — une protection LIMITÉE, rien de plus.
 *
 * ⛔ Ne jamais écrire « brouillon restauré » ni « publication envoyée » : le
 * texte et les médias sont bel et bien perdus, et l'issue reste inconnue.
 */
export const POST_NEW_PENDING_KEY_NOTICE =
  "Un envoi précédent n'a pas reçu de réponse. Votre texte et vos médias n'ont pas été conservés, mais la prochaine tentative ne créera pas de doublon. Ouvrez le fil pour voir ce qui est déjà en ligne.";

/** Geste EXPLICITE qui libère la clé — jamais déclenché par le code. */
export const POST_NEW_START_NEW_PUBLICATION = "Créer une nouvelle publication";

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
