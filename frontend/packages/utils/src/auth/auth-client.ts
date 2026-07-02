import type {
  AuthResponse,
  AuthUser,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  LoginRequest,
  RefreshResponse,
  RegisterRequest,
  ResetPasswordRequest,
  ResetPasswordResponse,
} from "@yunicity/types";

import { AuthError, parseApiError } from "./auth-errors";
import { RefreshManager } from "./refresh-manager";
import type { TokenStorage } from "../storage/token-storage";

export type AuthPlatform = "web" | "admin" | "mobile";

export interface AuthClientConfig {
  apiBaseUrl: string;
  platform: AuthPlatform;
  storage: TokenStorage;
  maxRefreshAttempts?: number;
  onSessionCleared?: () => void;
}

export class AuthClient {
  private readonly apiPrefix: string;
  private readonly refreshManager: RefreshManager;
  private readonly storage: TokenStorage;
  private readonly platform: AuthPlatform;
  private readonly onSessionCleared?: () => void;

  constructor(config: AuthClientConfig) {
    const base = config.apiBaseUrl.replace(/\/$/, "");
    this.apiPrefix = `${base}/api/v1/auth`;
    this.storage = config.storage;
    this.platform = config.platform;
    this.onSessionCleared = config.onSessionCleared;
    this.refreshManager = new RefreshManager(config.maxRefreshAttempts);
  }

  async getAccessToken(): Promise<string | null> {
    const token = this.storage.getAccessToken();
    return token instanceof Promise ? token : token;
  }

  async register(payload: RegisterRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>("/register", {
      method: "POST",
      body: JSON.stringify(payload),
      skipAuth: true,
    });
    await this.applyAuthResponse(response);
    return response;
  }

  async login(payload: LoginRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>("/login", {
      method: "POST",
      body: JSON.stringify(payload),
      skipAuth: true,
    });
    await this.applyAuthResponse(response);
    return response;
  }

  async logout(): Promise<void> {
    try {
      const refreshBody = await this.buildRefreshBody();
      await this.request<void>("/logout", {
        method: "POST",
        body: refreshBody ? JSON.stringify(refreshBody) : undefined,
        skipAuth: true,
        allowEmpty: true,
      });
    } finally {
      await this.clearSession();
    }
  }

  async me(): Promise<AuthUser> {
    return this.request<AuthUser>("/me", { method: "GET" });
  }

  async forgotPassword(payload: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
    return this.request<ForgotPasswordResponse>("/forgot-password", {
      method: "POST",
      body: JSON.stringify(payload),
      skipAuth: true,
    });
  }

  async resetPassword(payload: ResetPasswordRequest): Promise<ResetPasswordResponse> {
    return this.request<ResetPasswordResponse>("/reset-password", {
      method: "POST",
      body: JSON.stringify(payload),
      skipAuth: true,
    });
  }

  async refreshAccessToken(): Promise<string> {
    return this.refreshManager.refresh(async () => {
      const refreshBody = await this.buildRefreshBody();
      const response = await this.rawFetch(`${this.apiPrefix}/refresh`, {
        method: "POST",
        headers: this.buildHeaders({ json: true, skipAuth: true }),
        body: refreshBody ? JSON.stringify(refreshBody) : undefined,
        credentials: this.useCookies() ? "include" : "same-origin",
      });

      if (!response.ok) {
        throw await parseApiError(response);
      }

      const data = (await response.json()) as RefreshResponse;
      await this.storage.setAccessToken(data.access_token);
      if (data.refresh_token && this.storage.setRefreshToken) {
        await this.storage.setRefreshToken(data.refresh_token);
      }
      return data.access_token;
    });
  }

  async fetch(input: string, init: RequestInit = {}): Promise<Response> {
    return this.authenticatedFetch(input, init);
  }

  async clearSession(): Promise<void> {
    this.refreshManager.reset();
    await this.storage.setAccessToken(null);
    if (this.storage.setRefreshToken) {
      await this.storage.setRefreshToken(null);
    }
    if (this.storage.clear) {
      await this.storage.clear();
    }
    this.onSessionCleared?.();
  }

  private async applyAuthResponse(response: AuthResponse): Promise<void> {
    await this.storage.setAccessToken(response.access_token);
    if (response.refresh_token && this.storage.setRefreshToken) {
      await this.storage.setRefreshToken(response.refresh_token);
    }
    this.refreshManager.reset();
  }

  private async buildRefreshBody(): Promise<{ refresh_token: string } | null> {
    if (this.platform === "mobile" && this.storage.getRefreshToken) {
      const refresh = await this.storage.getRefreshToken();
      if (refresh) {
        return { refresh_token: refresh };
      }
    }
    return null;
  }

  private useCookies(): boolean {
    return this.platform === "web" || this.platform === "admin";
  }

  private shouldUseJsonContentType(body: BodyInit | null | undefined): boolean {
    return typeof body === "string";
  }

  private buildHeaders(options: {
    json?: boolean;
    skipAuth?: boolean;
    accessToken?: string | null;
  }): Headers {
    const headers = new Headers();
    headers.set("Accept", "application/json");
    if (options.json) {
      headers.set("Content-Type", "application/json");
    }
    if (this.platform === "mobile") {
      headers.set("X-Client-Platform", "mobile");
    }
    if (!options.skipAuth && options.accessToken) {
      headers.set("Authorization", `Bearer ${options.accessToken}`);
    }
    return headers;
  }

  private async request<T>(
    path: string,
    init: RequestInit & { skipAuth?: boolean; allowEmpty?: boolean },
  ): Promise<T> {
    const response = await this.authenticatedFetch(`${this.apiPrefix}${path}`, init);
    if (init.allowEmpty || response.status === 204) {
      return undefined as T;
    }
    return (await response.json()) as T;
  }

  private async authenticatedFetch(
    input: string,
    init: RequestInit & { skipAuth?: boolean },
  ): Promise<Response> {
    const accessToken = init.skipAuth ? null : await this.getAccessToken();
    let response = await this.rawFetch(input, {
      ...init,
      headers: this.mergeHeaders(init.headers, this.buildHeaders({
        json: this.shouldUseJsonContentType(init.body),
        skipAuth: init.skipAuth,
        accessToken,
      })),
      credentials: this.useCookies() ? "include" : "same-origin",
    });

    if (response.status !== 401 || init.skipAuth) {
      if (!response.ok) {
        throw await parseApiError(response);
      }
      return response;
    }

    try {
      const newToken = await this.refreshAccessToken();
      response = await this.rawFetch(input, {
        ...init,
        headers: this.mergeHeaders(init.headers, this.buildHeaders({
          json: this.shouldUseJsonContentType(init.body),
          accessToken: newToken,
        })),
        credentials: this.useCookies() ? "include" : "same-origin",
      });
    } catch {
      await this.clearSession();
      throw new AuthError(
        "UNAUTHORIZED",
        "Session expirée. Veuillez vous reconnecter.",
        401,
      );
    }

    if (!response.ok) {
      if (response.status === 401) {
        await this.clearSession();
      }
      throw await parseApiError(response);
    }

    return response;
  }

  private mergeHeaders(
    initHeaders: HeadersInit | undefined,
    built: Headers,
  ): Headers {
    const merged = new Headers(initHeaders);
    built.forEach((value: string, key: string) => {
      merged.set(key, value);
    });
    return merged;
  }

  private async rawFetch(input: string, init: RequestInit): Promise<Response> {
    return fetch(input, init);
  }
}

export function createAuthClient(config: AuthClientConfig): AuthClient {
  return new AuthClient(config);
}
