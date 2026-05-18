/** In-memory access token only — never use for refresh (web/admin). */

export class MemoryTokenStorage {
  private accessToken: string | null = null;

  getAccessToken(): string | null {
    return this.accessToken;
  }

  setAccessToken(token: string | null): void {
    this.accessToken = token;
  }

  clear(): void {
    this.accessToken = null;
  }
}
