// Câblage upload média des composers (feed général + territorial). Aligné sur le backend
// StoryMediaService : ALLOWED_IMAGE_TYPES + STORY_MEDIA_MAX_BYTES (20 Mo). Image seulement
// pour ce bloc (le backend accepte aussi la vidéo — UX vidéo = bloc séparé).

export const COMPOSER_MEDIA_ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

/** Valeur de l'attribut `accept` du <input type="file">. */
export const COMPOSER_MEDIA_ACCEPT_ATTR = COMPOSER_MEDIA_ACCEPTED_TYPES.join(",");

/** Taille max = STORY_MEDIA_MAX_BYTES côté backend (20 Mo). */
export const COMPOSER_MEDIA_MAX_BYTES = 20 * 1024 * 1024;

export const COMPOSER_MEDIA_INVALID_TYPE = "Format non supporté — JPEG, PNG ou WebP uniquement.";
export const COMPOSER_MEDIA_TOO_LARGE = "Image trop lourde — 20 Mo maximum.";
export const COMPOSER_MEDIA_UPLOAD_FAILED = "Échec de l’envoi de l’image. Réessayez.";
export const COMPOSER_MEDIA_ADD_LABEL = "Ajouter une image";
export const COMPOSER_MEDIA_REMOVE_LABEL = "Retirer l’image";
export const COMPOSER_MEDIA_REMOVE_PHOTO_LABEL = "Retirer la photo";
export const COMPOSER_MEDIA_REPLACE_PHOTO_LABEL = "Remplacer la photo";
export const COMPOSER_MEDIA_UPLOADING_LABEL = "Envoi de l’image…";

export type ComposerMediaValidation = { ok: true } | { ok: false; error: string };

/**
 * Validation client (type + taille) avant l'appel R2. Pré-filtre uniquement : le backend
 * refait foi (type + taille + magic-bytes). Le type MIME est normalisé (casse + paramètre).
 */
export function validateComposerMediaFile(file: {
  type: string;
  size: number;
}): ComposerMediaValidation {
  const type = (file.type.split(";", 1)[0] ?? "").trim().toLowerCase();
  if (!(COMPOSER_MEDIA_ACCEPTED_TYPES as readonly string[]).includes(type)) {
    return { ok: false, error: COMPOSER_MEDIA_INVALID_TYPE };
  }
  if (file.size > COMPOSER_MEDIA_MAX_BYTES) {
    return { ok: false, error: COMPOSER_MEDIA_TOO_LARGE };
  }
  return { ok: true };
}
