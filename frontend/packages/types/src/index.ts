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
  AdminCockpitAttention,
  AdminCockpitExecutive,
  AdminCockpitPartners,
  AdminCockpitPassport,
  AdminCockpitSummaryParams,
  AdminCockpitSummaryResponse,
} from "./admin-cockpit";

export type {
  AdminOrganizationListItem,
  AdminOrganizationListParams,
  AdminOrganizationListResponse,
  OrganizationReviewPayload,
  OrganizationReviewResponse,
} from "./admin-organization";

export type {
  ActivationWaveItemStatus,
  ActivationWaveStatus,
  AdminActivationWaveChecklist,
  AdminActivationWaveDetail,
  AdminActivationWaveItem,
  AdminActivationWaveListItem,
  AdminActivationWaveSummary,
  AdminActivationWaveUpdatePayload,
} from "./admin-activation-wave";

export type {
  AdminPartnerActivatePayload,
  AdminPartnerCapabilities,
  AdminPartnerCounters,
  AdminPartnerCreateProfilePayload,
  AdminPartnerDetailResponse,
  AdminPartnerLinks,
  AdminPartnerOrganizationDetail,
  AdminPartnerPatchPayload,
  AdminPartnerPausePayload,
  AdminPartnerProfileDetail,
  AdminPartnerUpgradePremiumPayload,
} from "./admin-partner";

export type {
  AdminPassportListItem,
  AdminPassportListParams,
  AdminPassportListResponse,
  AdminPassportSearchMode,
  AdminPassportStatus,
  AdminPassportUserSummary,
} from "./admin-passport";

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
  PartnerOfferManagementListParams,
  PartnerOfferManagement,
  PartnerOfferManagementListResponse,
  PartnerOfferStatus,
  PartnerOfferUpdatePayload,
} from "./partner_offer_management";

export type {
  PartnerCreatorContentAdmin,
  PartnerCreatorContentAdminListParams,
  PartnerCreatorContentAdminListResponse,
  PartnerCreatorContentAuthorSummary,
  PartnerCreatorContentCreatePayload,
  PartnerCreatorContentManagement,
  PartnerCreatorContentManagementListParams,
  PartnerCreatorContentManagementListResponse,
  PartnerCreatorContentOrganizationSummary,
  PartnerCreatorContentRejectPayload,
  PartnerCreatorContentStatus,
  PartnerCreatorContentUpdatePayload,
  PartnerCreatorContentPublic,
  PartnerCreatorContentPublicListResponse,
  PartnerCreatorContentListParams,
} from "./partner-creator-content";

export type {
  PartnerOfferListParams,
  PartnerOfferPartnerSummary,
  PartnerOfferPublic,
  PartnerOfferPublicListResponse,
} from "./partner-offer-public";

export type {
  OfferRedemptionStatus,
  PartnerOffer,
  PartnerOfferListResponse,
  PartnerOfferOrganization,
  PartnerOfferType,
  PassportActivateRequest,
  PassportMe,
  PassportQrTokenResponse,
  StampQrGenerateRequest,
  StampQrGenerateResponse,
  PassportStamp,
  PassportStampClaimItem,
  PassportStampClaimOrganization,
  PassportStampClaimPassportSummary,
  PassportStampClaimResult,
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
  MembershipBillingInterval,
  MembershipPlanCode,
  MembershipStatus,
  SubscriptionCheckoutRequest,
  SubscriptionCheckoutResponse,
  SubscriptionCommunityStats,
  SubscriptionMe,
  SubscriptionPlan,
  SubscriptionPlanFeature,
  SubscriptionPlanPrice,
  SubscriptionPlansResponse,
  SubscriptionSupporterAvatar,
} from "./subscription";

export type {
  DiscussionActiveItem,
  DiscussionCategoryId,
  DiscussionCreatePayload,
  DiscussionInsightsResponse,
  DiscussionListParams,
  DiscussionListResponse,
  DiscussionParticipant,
  DiscussionThread,
  DiscussionTrendingTopic,
} from "./discussion";

export type {
  StoryCategoryId,
  StoryContributorItem,
  StoryAudienceId,
  StoryCreatePayload,
  StoryMediaUploadResponse,
  StoryFeaturedItem,
  StoryInsightsResponse,
  StoryItem,
  StoryListParams,
  StoryListResponse,
  StoryLiveItem,
  StoryRingItem,
  StoryRingsResponse,
  StoryTabId,
} from "./story";

export type {
  PushPlatform,
  PushSubscription,
  PushSubscriptionListResponse,
  RegisterPushDeviceRequest,
} from "./notifications";

export type {
  NotificationInboxTab,
  SocialNotificationType,
  UserNotificationItem,
  UserNotificationListResponse,
  UserNotificationPreferences,
  UserNotificationPreferencesUpdate,
  UserNotificationSummaryResponse,
} from "./notifications-inbox";

export type {
  CommentCreatePayload,
  CommentListResponse,
  FeedAuthor,
  FeedAuthorType,
  FeedComment,
  FeedListParams,
  FeedListResponse,
  FeedLocation,
  FeedEventMeta,
  FeedNeighborhoodSummary,
  FeedOfferMeta,
  FeedPost,
  FeedPostType,
  FeedReportReason,
  PostCreatePayload,
  ReportPostPayload,
} from "./feed";

export type {
  EventInterestToggleResponse,
  LocalEvent,
  LocalEventCreatePayload,
  LocalEventListResponse,
  LocalEventManagement,
  LocalEventManagementListParams,
  LocalEventManagementListResponse,
  LocalEventOrganization,
  LocalEventUpdatePayload,
  PartnerEventsParams,
} from "./local-event";

export type {
  Neighborhood,
  NeighborhoodContextEventItem,
  NeighborhoodContextOfferItem,
  NeighborhoodContextOrganizationItem,
  NeighborhoodContextPostItem,
  NeighborhoodContextResponse,
  NeighborhoodContextStats,
  NeighborhoodListResponse,
} from "./neighborhood";

export type {
  CulturalPlaceDetail,
  CulturalPlaceListItem,
  CulturalPlaceListResponse,
  CulturalPlaceNeighborhoodSummary,
  CulturalPlaceSort,
  CulturalPlaceStatsResponse,
  MapCulturalPlaceItem,
  MapCulturalPlaceListResponse,
  MapCulturalPlacesListParams,
  MapRouteGeometry,
  MapRouteSummary,
} from "./cultural-place";

export type {
  MapBbox,
  MapBboxResponse,
  MapEventItem,
  MapEventListResponse,
  MapEventsListParams,
  MapNeighborhoodSummary,
} from "./map";

export type {
  TransitDeparture,
  TransitMode,
  TransitNearbyParams,
  TransitNearbyResponse,
  TransitStopNearby,
} from "./transit";

export type {
  SearchEntityType,
  SearchGroupKey,
  SearchGroups,
  SearchListParams,
  SearchResponse,
  SearchResultGroup,
  SearchResultItem,
  SearchTypeFilter,
} from "./search";

export type {
  Tribe,
  TribeCategory,
  TribeInvitationAcceptPayload,
  TribeInvitationCreatePayload,
  TribeInvitationCreateResponse,
  TribeInvitationListResponse,
  TribeInvitationPending,
  TribeJoinPayload,
  TribeListResponse,
  TribeMember,
  TribeMemberListResponse,
  TribeMemberRole,
  TribeMemberRoleUpdatePayload,
  TribePostCreatePayload,
  TribePostListResponse,
  TribeUpdatePayload,
  TribeUserCreatePayload,
  TribeVisibility,
} from "./tribe";

export type {
  PartnerListParams,
  PartnerListResponse,
  PartnerPublic,
  PartnerStatus,
  PartnershipType,
} from "./partner";

export type {
  ConvertLeadPayload,
  PartnerLead,
  PartnerLeadListParams,
  PartnerLeadListResponse,
  PartnerLeadSource,
  PartnerLeadStatus,
  PartnerLeadUpdatePayload,
} from "./partner_lead";

export type {
  WeatherCurrent,
} from "./weather";

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
