import { isAuthError } from "@yunicity/utils";

/**
 * Map a React Query error to a user-facing French message (ADMIN-PERF-02A).
 * Auth errors keep their explicit message; anything else falls back to the
 * page-specific friendly copy.
 */
export function mapAdminError(error: unknown, fallback: string): string | null {
  if (error == null) {
    return null;
  }
  if (isAuthError(error)) {
    return error.message;
  }
  return fallback;
}
