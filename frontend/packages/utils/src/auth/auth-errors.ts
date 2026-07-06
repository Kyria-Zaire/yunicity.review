import type { ApiErrorBody } from "@yunicity/types";

export class AuthError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number = 401) {
    super(message);
    this.name = "AuthError";
    this.code = code;
    this.status = status;
  }
}

function formatApiErrorDetail(detail: unknown, status: number): string {
  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (item && typeof item === "object" && "msg" in item) {
          return String((item as { msg?: unknown }).msg ?? "");
        }
        return typeof item === "string" ? item : "";
      })
      .filter(Boolean);
    if (messages.length > 0) {
      return messages.join(" ");
    }
  }
  if (detail && typeof detail === "object" && "msg" in detail) {
    return String((detail as { msg?: unknown }).msg);
  }
  return `Erreur API (${status})`;
}

export async function parseApiError(response: Response): Promise<AuthError> {
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (body && typeof body === "object" && "error" in body) {
    const nested = (body as { error?: { code?: string; message?: string } }).error;
    if (nested && typeof nested === "object") {
      const code = nested.code ?? "UNKNOWN_ERROR";
      const message =
        typeof nested.message === "string" && nested.message.trim()
          ? nested.message
          : `Erreur API (${response.status})`;
      return new AuthError(code, message, response.status);
    }
  }

  const flat = body as ApiErrorBody | null;
  const code = flat?.code ?? "UNKNOWN_ERROR";
  const detail = formatApiErrorDetail(flat?.detail, response.status);
  return new AuthError(code, detail, response.status);
}

export function isAuthError(error: unknown): error is AuthError {
  return error instanceof AuthError;
}

/** Messages UI pour erreurs auth attendues (login/register). */
export function humanizeAuthFailure(err: unknown, fallback: string): string {
  if (!isAuthError(err)) {
    return fallback;
  }
  if (err.code === "INVALID_CREDENTIALS") {
    return "Email ou mot de passe incorrect. Vérifiez vos identifiants ou créez un compte.";
  }
  if (err.code === "RATE_LIMITED") {
    return "Trop de tentatives. Réessayez dans quelques minutes.";
  }
  if (err.code === "EMAIL_ALREADY_EXISTS") {
    return "Un compte existe déjà avec cet email. Connectez-vous ou utilisez un autre email.";
  }
  if (err.code === "PROFILE_MEDIA_INVALID_TYPE") {
    return "Format non supporté. Utilisez JPG, PNG ou WEBP.";
  }
  if (err.code === "PROFILE_MEDIA_TOO_LARGE") {
    return err.message;
  }
  if (err.code === "PROFILE_MEDIA_INVALID_CONTENT") {
    return err.message;
  }
  if (err.code === "PROFILE_MEDIA_EMPTY") {
    return "Fichier vide. Choisissez une autre image.";
  }
  if (err.code === "STORY_MEDIA_INVALID_TYPE") {
    return "Format non supporté. Utilisez JPG, PNG, WEBP ou MP4.";
  }
  if (err.code === "STORY_MEDIA_TOO_LARGE") {
    return err.message;
  }
  if (err.code === "STORY_MEDIA_INVALID_CONTENT") {
    return err.message;
  }
  if (err.code === "STORY_MEDIA_EMPTY") {
    return "Fichier vide. Choisissez une autre photo ou vidéo.";
  }
  if (err.code === "UNKNOWN_ERROR" && err.status === 422) {
    return err.message || fallback;
  }
  return err.message || fallback;
}
