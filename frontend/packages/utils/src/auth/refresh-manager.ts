import { AuthError } from "./auth-errors";

export const DEFAULT_MAX_REFRESH_ATTEMPTS = 1;

/**
 * Limits concurrent refresh calls and prevents infinite refresh loops.
 */
export class RefreshManager {
  private inFlight: Promise<string> | null = null;
  private attempts = 0;

  constructor(private readonly maxAttempts: number = DEFAULT_MAX_REFRESH_ATTEMPTS) {}

  async refresh(refreshFn: () => Promise<string>): Promise<string> {
    if (this.inFlight) {
      return this.inFlight;
    }

    if (this.attempts >= this.maxAttempts) {
      throw new AuthError(
        "REFRESH_LIMIT",
        "Session expirée. Veuillez vous reconnecter.",
        401,
      );
    }

    this.attempts += 1;
    this.inFlight = refreshFn()
      .then((token) => {
        this.attempts = 0;
        return token;
      })
      .finally(() => {
        this.inFlight = null;
      });

    return this.inFlight;
  }

  reset(): void {
    this.attempts = 0;
    this.inFlight = null;
  }
}
