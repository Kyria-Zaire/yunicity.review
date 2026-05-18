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

export interface ApiErrorBody {
  detail: string;
  code: string;
  errors?: unknown[];
}
