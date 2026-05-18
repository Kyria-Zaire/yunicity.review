export interface TokenStorage {
  getAccessToken(): string | null | Promise<string | null>;
  setAccessToken(token: string | null): void | Promise<void>;
  getRefreshToken?(): string | null | Promise<string | null>;
  setRefreshToken?(token: string | null): void | Promise<void>;
  clear?(): void | Promise<void>;
}
