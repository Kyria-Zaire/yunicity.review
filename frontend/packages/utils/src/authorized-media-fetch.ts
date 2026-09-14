import type { AuthClient } from "./auth/auth-client";
import { AuthError } from "./auth/auth-errors";
import {
  AuthorizedMediaUrlError,
  resolveAuthorizedApiMediaUrl,
} from "./authorized-media-url";

/**
 * GET authentifié d'un média image via le client existant (MEDIA-01B).
 *
 * Le Bearer voyage uniquement dans `Authorization`, jamais dans l'URL ni le
 * `src` d'un `<img>`. Les redirections sont refusées pour qu'un hop externe ne
 * puisse pas recevoir le header. Le corps n'est exposé comme Blob que si le
 * Content-Type est `image/*`.
 */

export type AuthorizedMediaFetchErrorCode =
  | "INVALID_CONTENT_TYPE"
  | "EMPTY_BODY"
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
  contentType: string;
};

function isImageContentType(value: string | null): string | null {
  if (!value) return null;
  const mime = value.split(";", 1)[0]?.trim().toLowerCase() ?? "";
  return mime.startsWith("image/") ? mime : null;
}

export async function fetchAuthorizedMediaBlob(
  client: AuthClient,
  mediaUrl: string,
  options?: { signal?: AbortSignal; publicApiUrl?: string },
): Promise<AuthorizedMediaBlob> {
  const target = resolveAuthorizedApiMediaUrl(mediaUrl, {
    publicApiUrl: options?.publicApiUrl,
  });

  let response: Response;
  try {
    response = await client.fetch(target, {
      method: "GET",
      signal: options?.signal,
      // Refuse tout hop : un redirect cross-origin pourrait autrement emporter
      // Authorization. Pas de suivi manuel non plus — échec explicite.
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

  const contentType = isImageContentType(response.headers.get("content-type"));
  if (!contentType) {
    try {
      await response.arrayBuffer();
    } catch {
      // Corps déjà consommé ou coupé — ignorer.
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

  return { blob, contentType };
}

/** Message utilisateur stable — jamais de statut, URL ou corps technique. */
export const AUTHORIZED_MEDIA_UNAVAILABLE = "Image momentanément indisponible";
export const AUTHORIZED_MEDIA_RETRY_LABEL = "Réessayer";
