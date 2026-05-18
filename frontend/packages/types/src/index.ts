export type {
  ApiErrorBody,
  AuthResponse,
  AuthTokens,
  AuthUser,
  LoginRequest,
  PermissionKey,
  RefreshResponse,
  RegisterRequest,
  RoleKey,
} from "./auth";

export type {
  OrganizationCreateRequest,
  OrganizationCreateResponse,
  OrganizationMeItem,
  OrganizationMeListResponse,
  OrganizationMemberRole,
  OrganizationMemberStatus,
  OrganizationPublic,
  OrganizationRequestPayload,
  OrganizationSummary,
  OrganizationType,
  OrganizationVisibility,
  VerificationStatus,
} from "./organization";

export type {
  ProfileCompleteRequest,
  ProfileMe,
  ProfilePublic,
  ProfileUpdateRequest,
  ProfileVisibility,
  UserProfile,
} from "./profile";

export type EnvironmentName = "dev" | "recette" | "preprod" | "prod";

export type ApiStatus = "ok" | "disabled" | "error";

export type CheckStatus = ApiStatus;

export type ReadinessStatus = "ready" | "degraded";

export interface HealthResponse {
  status: "ok";
  service: string;
  environment: EnvironmentName;
}

export interface ReadyChecks {
  database: CheckStatus;
  redis: CheckStatus;
}

export interface ReadinessResponse {
  status: ReadinessStatus;
  checks: ReadyChecks;
}
