export type RoleKey = "USER" | "MODERATOR" | "CITY_ADMIN" | "SUPER_ADMIN";

export type PermissionKey =
  | "auth.me.read"
  | "users.read.self"
  | "users.update.self"
  | "users.read.all"
  | "users.manage.status"
  | "moderation.read"
  | "moderation.manage"
  | "roles.assign"
  | "system.admin";

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  city: string | null;
  is_active: boolean;
  is_verified: boolean;
  roles: RoleKey[];
  permissions: PermissionKey[];
  created_at: string;
  updated_at: string;
}

export interface AuthTokens {
  access_token: string;
  token_type: "bearer";
  expires_in: number;
  refresh_token?: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  city?: string | null;
}

export interface AuthResponse extends AuthTokens {
  user: AuthUser;
}

export interface RefreshResponse extends AuthTokens {}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  /**
   * Réponse unique et générique (AUTH-03).
   *
   * Le lien de réinitialisation ne transite jamais par HTTP, dans aucun
   * environnement : seul l'e-mail le porte. Ne pas réintroduire de champ
   * optionnel ici — c'est exactement ce qui avait rouvert la fuite côté backend.
   */
  message: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}

export interface ResetPasswordResponse {
  message: string;
}

/**
 * Inscription acceptée, session différée jusqu'à la confirmation de l'adresse.
 *
 * Renvoyée en 202 par le backend, et uniquement pour les comptes soumis à
 * `EMAIL_VERIFICATION_ENFORCED_FROM`. `verification_required` en discrimine le
 * type sans dépendre du code HTTP côté client.
 */
export interface RegistrationPendingResponse {
  message: string;
  user: AuthUser;
  verification_required: true;
}

/** Les deux issues possibles d'une inscription. */
export type RegisterResult = AuthResponse | RegistrationPendingResponse;

export interface VerifyEmailRequest {
  token: string;
}

export interface VerifyEmailResponse {
  message: string;
}

export interface ResendVerificationRequest {
  email: string;
}

export interface ResendVerificationResponse {
  message: string;
}

export interface ApiErrorBody {
  detail: string;
  code: string;
  errors?: unknown[];
}
