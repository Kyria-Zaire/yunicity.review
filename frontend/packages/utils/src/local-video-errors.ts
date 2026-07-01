/** Erreurs API Local Video — messages FR centralisés (VIDEO-04A). */

import type { LocalVideoErrorCode } from "@yunicity/types";
import { LOCAL_VIDEO_MAX_DURATION_SECONDS } from "@yunicity/types";

import { AuthError, isAuthError, parseApiError } from "./auth/auth-errors";

export class LocalVideoError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "LocalVideoError";
    this.code = code;
    this.status = status;
  }
}

export const LOCAL_VIDEO_ERROR_MESSAGES: Partial<Record<LocalVideoErrorCode, string>> = {
  LOCAL_VIDEO_INVALID_CONTENT:
    "Le fichier ne correspond pas au format vidéo attendu. Utilisez un MP4 ou MOV valide.",
  LOCAL_VIDEO_INVALID_TYPE: "Format vidéo non supporté. Utilisez MP4 ou MOV.",
  LOCAL_VIDEO_TOO_LARGE: "Fichier trop volumineux (max. 50 Mo).",
  LOCAL_VIDEO_SIZE_MISMATCH: "La taille du fichier ne correspond pas à la déclaration.",
  LOCAL_VIDEO_UPLOAD_EXPIRED: "Session d'upload expirée. Relancez l'envoi.",
  LOCAL_VIDEO_UPLOAD_MISSING: "Fichier vidéo introuvable. Terminez l'upload avant publication.",
  LOCAL_VIDEO_UPLOAD_NOT_AVAILABLE: "Session d'upload indisponible.",
  LOCAL_VIDEO_UPLOAD_ALREADY_USED: "Cette vidéo a déjà été publiée.",
  LOCAL_VIDEO_UPLOAD_NOT_FOUND: "Session d'upload introuvable.",
  LOCAL_VIDEO_FORBIDDEN: "Vous n'avez pas l'autorisation pour cette action.",
  LOCAL_VIDEO_NOT_FOUND: "Vidéo introuvable.",
  LOCAL_VIDEO_INVALID_NEIGHBORHOOD: "Quartier invalide.",
  LOCAL_VIDEO_CITY_MISMATCH: "Quartier incompatible avec la ville.",
  LOCAL_VIDEO_CITY_SLUG_MISMATCH: "Territoire incompatible avec la session d'upload.",
  LOCAL_VIDEO_INVALID_MEDIA: "Fichier vidéo illisible ou corrompu.",
  LOCAL_VIDEO_TOO_LONG: `Vidéo trop longue (max. ${LOCAL_VIDEO_MAX_DURATION_SECONDS} s).`,
  LOCAL_VIDEO_TRANSCODE_FAILED: "Impossible de préparer la vidéo.",
  LOCAL_VIDEO_THUMBNAIL_FAILED: "Impossible de générer la miniature.",
  LOCAL_VIDEO_BINARY_ENDPOINT_UNAVAILABLE:
    "Upload direct indisponible sur cet environnement.",
  LOCAL_VIDEO_PROCESSING_TIMEOUT: "Délai de traitement vidéo dépassé. Réessayez plus tard.",
  RATE_LIMITED: "Trop de tentatives. Réessayez dans quelques minutes.",
};

export function isLocalVideoError(error: unknown): error is LocalVideoError {
  return error instanceof LocalVideoError;
}

export function isKnownLocalVideoErrorCode(code: string): code is LocalVideoErrorCode {
  return code in LOCAL_VIDEO_ERROR_MESSAGES;
}

export async function parseLocalVideoApiError(response: Response): Promise<LocalVideoError> {
  const authError = await parseApiError(response);
  return new LocalVideoError(authError.code, authError.message, authError.status);
}

export function toLocalVideoError(error: unknown): LocalVideoError {
  if (error instanceof LocalVideoError) {
    return error;
  }
  if (isAuthError(error)) {
    return new LocalVideoError(error.code, error.message, error.status);
  }
  if (error instanceof Error) {
    return new LocalVideoError("UNKNOWN_ERROR", error.message, 0);
  }
  return new LocalVideoError("UNKNOWN_ERROR", "Erreur inattendue.", 0);
}

export function humanizeLocalVideoError(error: unknown, fallback: string): string {
  const normalized = toLocalVideoError(error);
  const mapped = LOCAL_VIDEO_ERROR_MESSAGES[normalized.code as LocalVideoErrorCode];
  if (mapped) {
    return mapped;
  }
  if (normalized.message) {
    return normalized.message;
  }
  return fallback;
}

/** Traitement worker terminé en échec (polling VIDEO-04C). */
export function isLocalVideoProcessingFailed(video: {
  status: string;
  processing_status: string;
}): boolean {
  return video.status === "failed" || video.processing_status === "failed";
}

/** Traitement worker terminé avec succès. */
export function isLocalVideoProcessingReady(video: {
  status: string;
  processing_status: string;
}): boolean {
  return video.status === "published" && video.processing_status === "ready";
}
