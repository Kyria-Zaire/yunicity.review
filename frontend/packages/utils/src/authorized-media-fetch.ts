import type { AuthClient } from "./auth/auth-client";
import { AuthError } from "./auth/auth-errors";
import { COMPOSER_MEDIA_MAX_BYTES } from "./composer-media";
import {
  AuthorizedMediaUrlError,
  resolveAuthorizedApiMediaUrl,
} from "./authorized-media-url";

/**
 * GET authentifié d'un média image via le client existant (MEDIA-01B).
 *
 * Types acceptés : JPEG / PNG / WebP uniquement (contrat StoryMediaService).
 * Redirections refusées ; taille plafonnée à COMPOSER_MEDIA_MAX_BYTES.
 */

export type AuthorizedMediaFetchErrorCode =
  | "INVALID_CONTENT_TYPE"
  | "EMPTY_BODY"
  | "OVERSIZE"
  | "UNEXPECTED_STATUS"
  | "NETWORK"
  | "ABORTED";

export class AuthorizedMediaFetchError extends Error {
  readonly code: AuthorizedMediaFetchErrorCode;
  readonly status?: number;

  constructor(code: AuthorizedMediaFetchErrorCode, message: string, status?: number) {
    super(message);
    this.name = "AuthorizedMediaFetchError";
    this.code = code;
    if (status !== undefined) this.status = status;
  }
}

export type AuthorizedMediaBlob = {
  blob: Blob;
  contentType: "image/jpeg" | "image/png" | "image/webp";
};

const ALLOWED_CONTENT_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function parseAllowedContentType(
  value: string | null,
): "image/jpeg" | "image/png" | "image/webp" | null {
  if (!value) return null;
  // Un seul type MIME — pas de liste CSV.
  if (value.includes(",")) return null;
  const mime = value.split(";", 1)[0]?.trim().toLowerCase() ?? "";
  if (!ALLOWED_CONTENT_TYPES.has(mime)) return null;
  return mime as "image/jpeg" | "image/png" | "image/webp";
}

export async function fetchAuthorizedMediaBlob(
  client: AuthClient,
  mediaUrl: string,
  options?: { signal?: AbortSignal; publicApiUrl?: string; maxBytes?: number },
): Promise<AuthorizedMediaBlob> {
  const maxBytes = options?.maxBytes ?? COMPOSER_MEDIA_MAX_BYTES;
  // Validation d'origine/chemin AVANT tout appel authentifié (donc avant Bearer).
  const target = resolveAuthorizedApiMediaUrl(mediaUrl, {
    publicApiUrl: options?.publicApiUrl,
  });

  let response: Response;
  try {
    response = await client.fetch(target, {
      method: "GET",
      signal: options?.signal,
      redirect: "error",
    });
  } catch (error) {
    if (options?.signal?.aborted || (error instanceof DOMException && error.name === "AbortError")) {
      throw new AuthorizedMediaFetchError("ABORTED", "Chargement média annulé.");
    }
    if (error instanceof AuthorizedMediaUrlError || error instanceof AuthError) {
      throw error;
    }
    if (error instanceof AuthorizedMediaFetchError) {
      throw error;
    }
    throw new AuthorizedMediaFetchError(
      "NETWORK",
      "Impossible de charger l’image pour le moment.",
    );
  }

  if (response.status === 204 || response.status === 206) {
    try {
      await response.arrayBuffer();
    } catch {
      /* ignore */
    }
    throw new AuthorizedMediaFetchError(
      "UNEXPECTED_STATUS",
      "Réponse média inattendue.",
      response.status,
    );
  }

  const declared = response.headers.get("content-length");
  if (declared) {
    const length = Number(declared);
    if (Number.isFinite(length) && length > maxBytes) {
      try {
        await response.arrayBuffer();
      } catch {
        /* ignore */
      }
      throw new AuthorizedMediaFetchError("OVERSIZE", "Média trop volumineux.", response.status);
    }
  }

  const contentType = parseAllowedContentType(response.headers.get("content-type"));
  if (!contentType) {
    try {
      await response.arrayBuffer();
    } catch {
      /* ignore */
    }
    throw new AuthorizedMediaFetchError(
      "INVALID_CONTENT_TYPE",
      "Réponse média invalide.",
      response.status,
    );
  }

  const blob = await response.blob();
  if (blob.size === 0) {
    throw new AuthorizedMediaFetchError("EMPTY_BODY", "Réponse média vide.", response.status);
  }
  if (blob.size > maxBytes) {
    throw new AuthorizedMediaFetchError("OVERSIZE", "Média trop volumineux.", response.status);
  }

  return { blob, contentType };
}

/** Message utilisateur stable — jamais de statut, URL ou corps technique. */
export const AUTHORIZED_MEDIA_UNAVAILABLE = "Image momentanément indisponible";
export const AUTHORIZED_MEDIA_RETRY_LABEL = "Réessayer";
