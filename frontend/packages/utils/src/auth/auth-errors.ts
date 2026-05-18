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
