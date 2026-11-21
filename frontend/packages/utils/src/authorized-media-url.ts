import { resolveWebApiBaseUrl } from "./api-base-url";
import { resolveApiMediaUrl } from "./api-media-url";

/**
 * Garde d'URL pour un GET média authentifié de publication (MEDIA-01B).
 *
 * Allowlist minimale : uniquement les formats servis par `StoryMediaService`.
 * Aucun jeton n'est jamais ajouté à l'URL ; la validation précède tout fetch.
 */

export type AuthorizedMediaUrlErrorCode =
  | "EMPTY"
  | "PROTOCOL"
  | "EXTERNAL_ORIGIN"
  | "NOT_API_PATH"
  | "USERINFO"
  | "INSECURE";

export class AuthorizedMediaUrlError extends Error {
  readonly code: AuthorizedMediaUrlErrorCode;

  constructor(code: AuthorizedMediaUrlErrorCode, message: string) {
    super(message);
    this.name = "AuthorizedMediaUrlError";
    this.code = code;
  }
}

const EMBEDDED_OR_UNSAFE = /^(javascript|data|blob|file|about|vbscript):/i;

/** Forme persistée par `story_media_api_url` — UUID utilisateur + UUID fichier. */
export const AUTHORIZED_STORY_MEDIA_PATH =
  /^\/api\/v1\/story-media\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp|mp4|webm)$/i;

/** Classe un candidat sans assouplir la validation d'origine ni de chemin. */
export function isAuthorizedStoryMediaUrl(src: string | null | undefined): boolean {
  if (!src?.trim()) return false;
  try {
    resolveAuthorizedApiMediaUrl(src);
    return true;
  } catch {
    return false;
  }
}

function publicApiBase(explicit?: string): string {
  return resolveWebApiBaseUrl({
    publicApiUrl:
      explicit ??
      (typeof process !== "undefined" ? process.env.NEXT_PUBLIC_API_URL : undefined),
    proxyTarget: undefined,
    runtime: "browser",
  });
}

function assertAllowedPath(pathname: string): void {
  // Normalise les segments encodés sans réintroduire `..`.
  let decoded = pathname;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    throw new AuthorizedMediaUrlError("NOT_API_PATH", "Chemin média illisible.");
  }
  if (decoded.includes("..") || decoded.includes("\\") || decoded.includes("//")) {
    throw new AuthorizedMediaUrlError("NOT_API_PATH", "Chemin média invalide.");
  }
  if (!AUTHORIZED_STORY_MEDIA_PATH.test(decoded)) {
    throw new AuthorizedMediaUrlError(
      "NOT_API_PATH",
      "Chemin média hors allowlist story-media.",
    );
  }
}

/**
 * Résout et valide une URL média pour un fetch authentifié vers l'API.
 *
 * @returns URL absolue (origines séparées) ou chemin racine allowlisté (même origine).
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

  // Identifiants dans l'URL brute (avant résolution).
  if (/^[a-z][a-z0-9+.-]*:\/\/[^/]*@/i.test(trimmed)) {
    throw new AuthorizedMediaUrlError("USERINFO", "Identifiants interdits dans l’URL média.");
  }

  const resolved = resolveApiMediaUrl(trimmed);
  if (!resolved) {
    throw new AuthorizedMediaUrlError("EMPTY", "URL média absente.");
  }

  if (EMBEDDED_OR_UNSAFE.test(resolved) || resolved.startsWith("//")) {
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

    if (absolute.username || absolute.password) {
      throw new AuthorizedMediaUrlError("USERINFO", "Identifiants interdits dans l’URL média.");
    }

    const expected = new URL(apiBase);
    if (absolute.origin !== expected.origin) {
      throw new AuthorizedMediaUrlError(
        "EXTERNAL_ORIGIN",
        "Origine média refusée : hors API autorisée.",
      );
    }
    if (expected.protocol === "https:" && absolute.protocol !== "https:") {
      throw new AuthorizedMediaUrlError("INSECURE", "HTTPS requis pour le média API.");
    }
    assertAllowedPath(absolute.pathname);
    // Reconstruire sans search/hash pour éviter toute injection de jeton.
    return `${absolute.origin}${absolute.pathname}`;
  }

  if (/^[a-z][a-z0-9+.-]*:/i.test(resolved)) {
    throw new AuthorizedMediaUrlError(
      "EXTERNAL_ORIGIN",
      "Origine média refusée : hors API autorisée.",
    );
  }
  const pathOnly = resolved.split(/[?#]/, 1)[0] ?? resolved;
  assertAllowedPath(pathOnly);
  return pathOnly;
}
