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

export async function parseApiError(response: Response): Promise<AuthError> {
  let body: ApiErrorBody | null = null;
  try {
    body = (await response.json()) as ApiErrorBody;
  } catch {
    body = null;
  }
  const code = body?.code ?? "UNKNOWN_ERROR";
  const detail = body?.detail ?? `Erreur API (${response.status})`;
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
  return err.message;
}
