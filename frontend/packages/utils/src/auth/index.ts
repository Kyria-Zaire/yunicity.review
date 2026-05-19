export { AuthClient, createAuthClient, type AuthClientConfig, type AuthPlatform } from "./auth-client";
export { AuthError, humanizeAuthFailure, isAuthError, parseApiError } from "./auth-errors";
export { emptyAuthSession, type AuthSessionState } from "./auth-session";
export { DEFAULT_MAX_REFRESH_ATTEMPTS, RefreshManager } from "./refresh-manager";
