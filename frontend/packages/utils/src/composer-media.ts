// Câblage upload média des composers (feed général + territorial). Aligné sur le backend
// StoryMediaService : ALLOWED_IMAGE_TYPES + STORY_MEDIA_MAX_BYTES (20 Mo). Image seulement
// pour ce bloc (le backend accepte aussi la vidéo — UX vidéo = bloc séparé).

import { AuthError } from "./auth/auth-errors";

export const COMPOSER_MEDIA_ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

/** Valeur de l'attribut `accept` du <input type="file">. */
export const COMPOSER_MEDIA_ACCEPT_ATTR = COMPOSER_MEDIA_ACCEPTED_TYPES.join(",");

/** Taille max = STORY_MEDIA_MAX_BYTES côté backend (20 Mo). */
export const COMPOSER_MEDIA_MAX_BYTES = 20 * 1024 * 1024;

export const COMPOSER_MEDIA_INVALID_TYPE = "Format non supporté — JPEG, PNG ou WebP uniquement.";
export const COMPOSER_MEDIA_HEIC_NOT_SUPPORTED =
  "Le format HEIC/HEIF n’est pas accepté. Convertissez l’image en JPEG, PNG ou WebP.";
export const COMPOSER_MEDIA_TOO_LARGE = "Image trop lourde — 20 Mo maximum.";
export const COMPOSER_MEDIA_UPLOAD_FAILED = "Échec de l’envoi de l’image. Réessayez.";
export const COMPOSER_MEDIA_NETWORK_FAILED =
  "Connexion interrompue pendant l’envoi. Vérifiez votre réseau puis réessayez.";
export const COMPOSER_MEDIA_TIMEOUT = "L’envoi a pris trop de temps. Réessayez.";
export const COMPOSER_MEDIA_UNAUTHORIZED =
  "Votre session n’est plus valide. Reconnectez-vous avant de réessayer.";
export const COMPOSER_MEDIA_SERVER_FAILED =
  "Le service d’envoi est momentanément indisponible. Réessayez plus tard.";
/** 429 — réessayer tout de suite échouera : le dire plutôt qu'inviter au retry. */
export const COMPOSER_MEDIA_RATE_LIMITED =
  "Vous avez envoyé beaucoup d’images récemment. Patientez quelques minutes.";
/** 403 — droit refusé, ce qui n'est pas une session expirée. */
export const COMPOSER_MEDIA_FORBIDDEN = "Vous n’avez pas l’autorisation d’envoyer cette image.";
export const COMPOSER_MEDIA_EMPTY_FILE = "Ce fichier est vide. Choisissez une autre image.";
/** Le backend a lu les magic bytes et ils contredisent le format annoncé. */
export const COMPOSER_MEDIA_INVALID_CONTENT =
  "Le contenu du fichier ne correspond pas à son format déclaré.";
export const COMPOSER_PUBLICATION_FAILED_AFTER_UPLOAD =
  "L’image est prête, mais la publication a échoué. Vous pouvez réessayer sans la renvoyer.";
/** Arbitrage d'un média refusé — actions explicites, jamais automatiques. */
/**
 * Parcours multi-médias : des médias VALIDES restent attachés. Le libellé doit
 * dire ce qui est réellement abandonné — le ou les fichiers refusés — et non
 * « sans image », qui annoncerait une publication sans média alors que les
 * valides partent bien.
 */
export const COMPOSER_MEDIA_IGNORE_REJECTED = "Ignorer les médias refusés";
export const COMPOSER_MEDIA_IGNORE_REJECTED_HINT =
  "Les autres médias valides et votre texte seront conservés.";
/** Parcours multi-médias, plus aucun média valide : « média » couvre la vidéo. */
export const COMPOSER_MEDIA_CONTINUE_WITHOUT_MEDIA = "Continuer sans média";
export const COMPOSER_MEDIA_CONTINUE_WITHOUT_MEDIA_HINT = "Votre texte sera conservé.";
/** Parcours multi-médias : on ne parle pas d'« image » là où une vidéo est possible. */
export const COMPOSER_MEDIA_CHOOSE_OTHERS = "Choisir d'autres médias";
export const COMPOSER_MEDIA_CHOOSE_ANOTHER = "Choisir une autre image";
export const COMPOSER_MEDIA_CONTINUE_WITHOUT = "Continuer sans image";
export const COMPOSER_MEDIA_RESOLUTION_HINT =
  "Votre texte est conservé. Choisissez une autre image, ou continuez sans image.";
export const COMPOSER_MEDIA_ADD_LABEL = "Ajouter une image";
export const COMPOSER_MEDIA_REMOVE_LABEL = "Retirer l’image";
export const COMPOSER_MEDIA_REMOVE_PHOTO_LABEL = "Retirer la photo";
export const COMPOSER_MEDIA_REPLACE_PHOTO_LABEL = "Remplacer la photo";
export const COMPOSER_MEDIA_UPLOADING_LABEL = "Envoi de l’image…";
/** Regle backend `PostCreateRequest.body min_length=1` (C3-FEED-M6). */
export const COMPOSER_TEXT_REQUIRED_HINT =
  "Ajoutez un texte pour publier : une photo seule ne suffit pas.";

export type ComposerMediaValidation = { ok: true } | { ok: false; error: string };

/** Extensions HEIC/HEIF — jamais acceptées, quel que soit le MIME déclaré. */
const HEIC_EXTENSIONS = ["heic", "heif"] as const;

/** Extensions correspondant aux trois types acceptés. */
const ACCEPTED_EXTENSIONS = ["jpg", "jpeg", "png", "webp"] as const;

/**
 * Types que les navigateurs mobiles produisent quand ils n'identifient pas le
 * fichier : chaîne vide (partage iOS, certains sélecteurs Android) ou type
 * générique de flux binaire.
 */
const UNDETERMINED_TYPES = ["", "application/octet-stream", "binary/octet-stream"] as const;

/** Extensions vidéo acceptées par le parcours multi-médias `/feed/new`. */
const VIDEO_EXTENSIONS = ["mp4", "webm"] as const;

/**
 * HEIC/HEIF détecté par le MIME **ou** par l'extension.
 *
 * Les deux indices comptent : iOS partage souvent le fichier sans type, et
 * renommer `.heic` en `.jpg` ne doit jamais ouvrir la porte.
 */
export function isHeicOrHeif(file: { type: string; name?: string }): boolean {
  const type = (file.type.split(";", 1)[0] ?? "").trim().toLowerCase();
  if (type === "image/heic" || type === "image/heif") return true;
  return (HEIC_EXTENSIONS as readonly string[]).includes(extensionOf(file.name));
}

/**
 * Nature d'un fichier telle que le navigateur la décrit, extension comprise.
 *
 * `File.type` est déclaratif et souvent vide sur mobile : s'y fier seul refusait
 * des fichiers parfaitement légitimes. Rien ici ne prétend connaître le contenu
 * réel — le backend reste l'autorité.
 */
export function composerMediaKindFromMetadata(file: {
  type: string;
  name?: string;
}): "image" | "video" | "heic" | "unknown" {
  if (isHeicOrHeif(file)) return "heic";
  const type = (file.type.split(";", 1)[0] ?? "").trim().toLowerCase();
  const extension = extensionOf(file.name);

  if (type.startsWith("image/")) return "image";
  if (type.startsWith("video/")) return "video";

  if ((UNDETERMINED_TYPES as readonly string[]).includes(type)) {
    if ((ACCEPTED_EXTENSIONS as readonly string[]).includes(extension)) return "image";
    if ((VIDEO_EXTENSIONS as readonly string[]).includes(extension)) return "video";
  }
  return "unknown";
}

function extensionOf(name: string | undefined): string {
  if (!name) return "";
  const dot = name.lastIndexOf(".");
  if (dot <= 0 || dot === name.length - 1) return "";
  return name.slice(dot + 1).trim().toLowerCase();
}

/**
 * Validation client (type + taille) avant l'appel R2. **Pré-filtre uniquement** :
 * le backend refait foi (type, taille et magic bytes) et reste l'autorité. Rien
 * ici n'affirme que le contenu du fichier est conforme à son extension.
 *
 * Le type MIME est normalisé (casse + paramètre). Le nom est consulté parce que
 * `File.type` est déclaratif et souvent vide sur mobile : s'y fier seul refusait
 * des images légitimes que l'utilisateur venait de choisir, ce qui est l'erreur
 * signalée sur téléphone.
 */
export function validateComposerMediaFile(file: {
  type: string;
  size: number;
  name?: string;
}): ComposerMediaValidation {
  const type = (file.type.split(";", 1)[0] ?? "").trim().toLowerCase();
  const extension = extensionOf(file.name);

  // HEIC/HEIF d'abord, et par l'un OU l'autre indice : renommer `.heic` en
  // `.jpg` ne doit pas ouvrir la porte, et un `.HEIC` sans MIME doit recevoir le
  // message explicite plutôt que le message générique.
  if (isHeicOrHeif(file)) {
    return { ok: false, error: COMPOSER_MEDIA_HEIC_NOT_SUPPORTED };
  }

  const typeAccepte = (COMPOSER_MEDIA_ACCEPTED_TYPES as readonly string[]).includes(type);
  // Type indéterminé par le navigateur : on se rabat sur l'extension et on
  // laisse le backend trancher sur le contenu réel.
  const typeIndetermine =
    (UNDETERMINED_TYPES as readonly string[]).includes(type) &&
    (ACCEPTED_EXTENSIONS as readonly string[]).includes(extension);

  if (!typeAccepte && !typeIndetermine) {
    return { ok: false, error: COMPOSER_MEDIA_INVALID_TYPE };
  }
  if (file.size > COMPOSER_MEDIA_MAX_BYTES) {
    return { ok: false, error: COMPOSER_MEDIA_TOO_LARGE };
  }
  return { ok: true };
}

/**
 * Marge fixe du budget d'envoi : poignée de main, TLS, authentification et
 * traitement serveur. Indépendante de la taille du fichier.
 */
export const COMPOSER_MEDIA_UPLOAD_TIMEOUT_BASE_MS = 15_000;

/**
 * Débit utile minimal toléré : 600 kbit/s, soit un lien mobile annoncé à
 * 1 Mbit/s rendu à 60 % une fois retirés TCP/TLS, en-têtes, multipart,
 * retransmissions et variabilité radio.
 */
export const COMPOSER_MEDIA_UPLOAD_MIN_THROUGHPUT_BPS = 600_000;

/** Garde-fou absolu contre une requête qui ne se termine jamais. */
export const COMPOSER_MEDIA_UPLOAD_TIMEOUT_CAP_MS = 300_000;

/**
 * Budget de temps accordé à l'envoi d'un fichier, en millisecondes.
 *
 * Un délai fixe est nécessairement faux : la limite acceptée est de 20 MiB, et
 * un tel fichier demande à lui seul plus de 4 minutes sur un lien mobile
 * médiocre. Un délai fixe de 30 s condamnait 11 des 32 combinaisons
 * taille × débit étudiées, dont la taille maximale **autorisée** dès que le
 * débit utile passait sous 5,6 Mbit/s.
 *
 * Le budget est donc proportionnel à la taille, et n'est qu'un garde-fou de
 * dernier recours : l'utilisateur peut annuler à tout moment en retirant
 * l'image, ce qui interrompt la requête immédiatement.
 */
/** Une annulation — volontaire ou provoquée par l'échéance — n'est pas une erreur. */
export function isComposerAbortError(error: unknown): boolean {
  return (
    (typeof DOMException !== "undefined" &&
      error instanceof DOMException &&
      error.name === "AbortError") ||
    (error instanceof Error && error.name === "AbortError")
  );
}

/**
 * Traduit une erreur d'envoi média en message affichable.
 *
 * Source unique, partagée par tous les parcours de publication : un mapping
 * dupliqué diverge, et c'est ainsi qu'un 403 finit par dire « reconnectez-vous »
 * à un endroit et autre chose ailleurs.
 *
 * Les codes métier sont lus AVANT les tranches de statut — un code précis dit
 * toujours mieux ce qui s'est passé. Seules des constantes sont renvoyées :
 * aucune réponse brute, aucune URL signée, aucune clé de stockage ne peut
 * ressortir d'ici.
 *
 * Contrat réel du backend (`StoryMediaService`, `enforce_rate_limit`) :
 * 400 `STORY_MEDIA_INVALID_TYPE` / `STORY_MEDIA_EMPTY` / `STORY_MEDIA_TOO_LARGE` /
 * `STORY_MEDIA_INVALID_CONTENT`, 429 `RATE_LIMITED`, 503 si Redis est indisponible.
 */
export function composerMediaErrorMessage(error: unknown): string {
  if (error instanceof AuthError) {
    switch (error.code) {
      case "STORY_MEDIA_INVALID_CONTENT":
        return COMPOSER_MEDIA_INVALID_CONTENT;
      case "STORY_MEDIA_TOO_LARGE":
        return COMPOSER_MEDIA_TOO_LARGE;
      case "STORY_MEDIA_INVALID_TYPE":
        return COMPOSER_MEDIA_INVALID_TYPE;
      case "STORY_MEDIA_EMPTY":
        return COMPOSER_MEDIA_EMPTY_FILE;
      case "RATE_LIMITED":
        return COMPOSER_MEDIA_RATE_LIMITED;
      default:
        break;
    }
    if (error.status === 429) return COMPOSER_MEDIA_RATE_LIMITED;
    // 413 ne vient pas du service, mais un intermédiaire réseau peut le rendre
    // avant que la requête n'atteigne l'application.
    if (error.status === 413) return COMPOSER_MEDIA_TOO_LARGE;
    if (error.status === 401) return COMPOSER_MEDIA_UNAUTHORIZED;
    // Un 403 est un droit refusé. L'assimiler à une session expirée envoyait
    // l'utilisateur se reconnecter pour rien.
    if (error.status === 403) return COMPOSER_MEDIA_FORBIDDEN;
    if (error.status >= 500) return COMPOSER_MEDIA_SERVER_FAILED;
  }
  if (typeof DOMException !== "undefined" && error instanceof DOMException && error.name === "TimeoutError") {
    return COMPOSER_MEDIA_TIMEOUT;
  }
  if (error instanceof TypeError || (error instanceof Error && /network|fetch/i.test(error.message))) {
    return COMPOSER_MEDIA_NETWORK_FAILED;
  }
  return COMPOSER_MEDIA_UPLOAD_FAILED;
}

export function composerMediaUploadTimeoutMs(sizeBytes: number): number {
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
    return COMPOSER_MEDIA_UPLOAD_TIMEOUT_BASE_MS;
  }
  const transfert = Math.round((sizeBytes * 8 * 1000) / COMPOSER_MEDIA_UPLOAD_MIN_THROUGHPUT_BPS);
  return Math.min(COMPOSER_MEDIA_UPLOAD_TIMEOUT_CAP_MS, COMPOSER_MEDIA_UPLOAD_TIMEOUT_BASE_MS + transfert);
}
