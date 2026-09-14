import { resolveWebApiBaseUrl } from "./api-base-url";
import { resolveApiMediaUrl } from "./api-media-url";

/**
 * Garde d'URL pour un GET média authentifié (MEDIA-01B).
 *
 * L'URL persistée est relative à l'API (`/api/v1/story-media/...`). Avant tout
 * fetch Bearer, on la résout vers l'origine API publique et on refuse tout ce
 * qui n'y appartient pas : origines externes, protocoles embarqués, chemins
 * hors `/api/v1/`. Aucun jeton n'est jamais ajouté à l'URL.
 */

export type AuthorizedMediaUrlErrorCode =
  | "EMPTY"
  | "PROTOCOL"
  | "EXTERNAL_ORIGIN"
  | "NOT_API_PATH";

export class AuthorizedMediaUrlError extends Error {
  readonly code: AuthorizedMediaUrlErrorCode;

  constructor(code: AuthorizedMediaUrlErrorCode, message: string) {
    super(message);
    this.name = "AuthorizedMediaUrlError";
    this.code = code;
  }
}

const EMBEDDED_OR_UNSAFE = /^(javascript|data|blob|file|about|vbscript):/i;

function publicApiBase(explicit?: string): string {
  return resolveWebApiBaseUrl({
    publicApiUrl:
      explicit ??
      (typeof process !== "undefined" ? process.env.NEXT_PUBLIC_API_URL : undefined),
    proxyTarget: undefined,
    runtime: "browser",
  });
}

/**
 * Résout et valide une URL média pour un fetch authentifié vers l'API.
 *
 * @returns URL absolue (origines séparées) ou chemin racine `/api/v1/...` (même origine).
 */
export function resolveAuthorizedApiMediaUrl(
  src: string,
  options?: { publicApiUrl?: string },
): string {
  const trimmed = src.trim();
  if (!trimmed) {
    throw new AuthorizedMediaUrlError("EMPTY", "URL média absente.");
  }

  if (EMBEDDED_OR_UNSAFE.test(trimmed) || trimmed.startsWith("//")) {
    throw new AuthorizedMediaUrlError(
      "PROTOCOL",
      "Protocole média non autorisé pour un chargement distant.",
    );
  }

  const resolved = resolveApiMediaUrl(trimmed);
  if (!resolved) {
    throw new AuthorizedMediaUrlError("EMPTY", "URL média absente.");
  }

  if (EMBEDDED_OR_UNSAFE.test(resolved)) {
    throw new AuthorizedMediaUrlError(
      "PROTOCOL",
      "Protocole média non autorisé pour un chargement distant.",
    );
  }

  const apiBase = publicApiBase(options?.publicApiUrl);

  if (apiBase) {
    let absolute: URL;
    try {
      absolute = new URL(resolved, `${apiBase}/`);
    } catch {
      throw new AuthorizedMediaUrlError("PROTOCOL", "URL média illisible.");
    }

    const expected = new URL(apiBase);
    if (absolute.origin !== expected.origin) {
      throw new AuthorizedMediaUrlError(
        "EXTERNAL_ORIGIN",
        "Origine média refusée : hors API autorisée.",
      );
    }
    if (!absolute.pathname.startsWith("/api/v1/")) {
      throw new AuthorizedMediaUrlError(
        "NOT_API_PATH",
        "Chemin média hors surface API /api/v1/.",
      );
    }
    return absolute.href;
  }

  // Même origine (dev local / proxy) : uniquement un chemin API racine.
  if (/^[a-z][a-z0-9+.-]*:/i.test(resolved)) {
    throw new AuthorizedMediaUrlError(
      "EXTERNAL_ORIGIN",
      "Origine média refusée : hors API autorisée.",
    );
  }
  if (!resolved.startsWith("/api/v1/")) {
    throw new AuthorizedMediaUrlError(
      "NOT_API_PATH",
      "Chemin média hors surface API /api/v1/.",
    );
  }
  return resolved;
}
