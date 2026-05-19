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

export type {
  PartnerOfferAdmin,
  PartnerOfferAdminCreatePayload,
  PartnerOfferAdminListParams,
  PartnerOfferAdminListResponse,
  PartnerOfferAdminStatus,
  PartnerOfferAdminUpdatePayload,
  PartnerOfferRejectPayload,
  VerifiedOrganizationListResponse,
  VerifiedOrganizationOption,
} from "./admin_partner_offer";

export type {
  PassportQr,
  ScanPassportPreview,
  ScanRedeemableOffer,
  ScanRedeemRequest,
  ScanRedeemResponse,
  ScanResolveRequest,
  ScanResolveResponse,
} from "./scan";

export type {
  PartnerOfferCreatePayload,
  PartnerOfferListParams,
  PartnerOfferManagement,
  PartnerOfferManagementListResponse,
  PartnerOfferStatus,
  PartnerOfferUpdatePayload,
} from "./partner_offer_management";

export type {
  OfferRedemptionStatus,
  PartnerOffer,
  PartnerOfferListResponse,
  PartnerOfferOrganization,
  PartnerOfferType,
  PassportActivateRequest,
  PassportMe,
  PassportStamp,
  PassportStampListResponse,
  PassportStampOrganization,
  PassportStampSource,
  PassportStats,
  PassportStatus,
  PassportTier,
  PassportTierCode,
  PassportTierListResponse,
  Redemption,
} from "./passport";

export type {
  ConvertLeadPayload,
  PartnerLead,
  PartnerLeadListParams,
  PartnerLeadListResponse,
  PartnerLeadSource,
  PartnerLeadStatus,
  PartnerLeadUpdatePayload,
} from "./partner_lead";

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
