export type {
  ApiErrorBody,
  AuthResponse,
  AuthTokens,
  AuthUser,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  LoginRequest,
  PermissionKey,
  RefreshResponse,
  RegisterRequest,
  ResetPasswordRequest,
  ResetPasswordResponse,
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
  AdminOfferListItem,
  AdminOfferListParams,
  AdminOfferListResponse,
  AdminOfferStatus,
} from "./admin-offer";

export type {
  PartnerOfferAdmin,
  PartnerOfferAdminCreatePayload,
  PartnerOfferAdminListParams,
  PartnerOfferAdminListResponse,
  PartnerOfferAdminSummaryParams,
  PartnerOfferAdminSummaryResponse,
  PartnerOfferAdminRedemptionItem,
  PartnerOfferAdminRedemptionListParams,
  PartnerOfferAdminRedemptionListResponse,
  PartnerOfferAdminStatus,
  PartnerOfferAdminUpdatePayload,
  AdminOfferRedemptionChannel,
  AdminOfferRedemptionCitizen,
  AdminOfferRedemptionPassport,
  PartnerOfferRejectPayload,
  AdminPartnerOfferAction,
  AdminPartnerOfferActionItem,
  AdminPartnerOfferActionListResponse,
  AdminPartnerOfferActorSummary,
  PartnerOfferAdminActionListParams,
  VerifiedOrganizationListResponse,
  VerifiedOrganizationOption,
} from "./admin_partner_offer";

export type {
  AdminEventModerationStatus,
  AdminEventModerationStatusFilter,
  AdminLocalEventAction,
  AdminLocalEventActionItem,
  AdminLocalEventActionListParams,
  AdminLocalEventActionListResponse,
  AdminLocalEventActorSummary,
  AdminLocalEventDetail,
  AdminLocalEventListItem,
  AdminLocalEventListParams,
  AdminLocalEventListResponse,
  AdminLocalEventOrganizationDetail,
  LocalEventAdminSummaryParams,
  LocalEventAdminSummaryResponse,
  LocalEventCancelPayload,
  LocalEventRejectPayload,
} from "./admin-event";

export type {
  AdminReportAdminSummaryResponse,
  AdminReportDetailResponse,
  AdminReportDismissPayload,
  AdminReportListItem,
  AdminReportListParams,
  AdminReportListResponse,
  AdminReportReason,
  AdminReportReporterSummary,
  AdminReportResolvePayload,
  AdminReportResolverSummary,
  AdminReportStatus,
  AdminReportStatusSummary,
  AdminReportTargetPostSummary,
  AdminReportTargetType,
} from "./admin-report";
export type {
  AdminStaffActionActor,
  AdminStaffActionItem,
  AdminStaffActionListParams,
  AdminStaffActionListResponse,
  AdminStaffActionType,
  AdminStaffAdminSummaryResponse,
  AdminStaffAssignRolePayload,
  AdminStaffDetailResponse,
  AdminStaffReasonPayload,
  AdminStaffListItem,
  AdminStaffListParams,
  AdminStaffListResponse,
  AdminStaffPlatformRole,
} from "./admin-staff";

export type {
  AdminCockpitAttention,
  AdminCockpitExecutive,
  AdminCockpitPartners,
  AdminCockpitPassport,
  AdminCockpitSignals,
  AdminCockpitSummaryParams,
  AdminCockpitSummaryResponse,
  AdminCockpitTopStampPartner,
} from "./admin-cockpit";

export type {
  AdminAnalyticsAttention,
  AdminAnalyticsCreators,
  AdminAnalyticsCrm,
  AdminAnalyticsEvents,
  AdminAnalyticsGrowth,
  AdminAnalyticsOffers,
  AdminAnalyticsPartners,
  AdminAnalyticsPassport,
  AdminAnalyticsPeriod,
  AdminAnalyticsScope,
  AdminAnalyticsSummary,
  AdminAnalyticsSummaryParams,
} from "./admin-analytics";

export type {
  AdminPlatformConfigBadgeThresholds,
  AdminPlatformConfigBusiness,
  AdminPlatformConfigGeneral,
  AdminPlatformConfigMembershipPlan,
  AdminPlatformConfigModeration,
  AdminPlatformConfigNotifications,
  AdminPlatformConfigPartners,
  AdminPlatformConfigPassport,
  AdminPlatformConfigPassportTier,
  AdminPlatformConfigPilotGoals,
  AdminPlatformConfigPlatformRole,
  AdminPlatformConfigReadiness,
  AdminPlatformConfigSnapshot,
  AdminPlatformConfigSystem,
  AdminPlatformConfigViewer,
} from "./admin-platform-config";

export type {
  AdminActivityAlert,
  AdminActivityAttentionSummary,
  AdminActivityFeed,
  AdminActivityFeedCategory,
  AdminActivityFeedItem,
  AdminActivityFeedParams,
  AdminActivityFeedSeverity,
  AdminActivityFilterCategory,
  AdminActivityHealth,
  AdminActivityHealthStatus,
  AdminActivitySectionSummary,
  AdminActivitySections,
  AdminActivitySummary,
  AdminActivityAlertSeverity,
  AdminActivityCheckStatus,
} from "./admin-activity";

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
  AdminPartnersCategoryBreakdownItem,
  AdminPartnersEvolutionPoint,
  AdminPartnersMapPin,
  AdminPartnersPendingRequestItem,
  AdminPartnersTerrainListItem,
  AdminPartnersTerrainListParams,
  AdminPartnersTerrainListResponse,
  AdminPartnersTopActiveItem,
  AdminPartnersWorkspaceSummary,
  AdminPartnersWorkspaceSummaryParams,
} from "./admin-partners-workspace";

export type {
  AdminPassportActionActorUser,
  AdminPassportActionItem,
  AdminPassportActionKind,
  AdminPassportActionListResponse,
  AdminPassportDetailResponse,
  AdminPassportDetailStats,
  AdminPassportDetailUser,
  AdminPassportListItem,
  AdminPassportListParams,
  AdminPassportListResponse,
  AdminPassportRedemptionItem,
  AdminPassportRedemptionListResponse,
  AdminPassportSearchMode,
  AdminPassportStatusPatchPayload,
  AdminPassportStampItem,
  AdminPassportStampListResponse,
  AdminPassportStatus,
  AdminPassportSubresourceListParams,
  AdminPassportTierDetail,
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
  AdminCreatorContentAction,
  AdminCreatorContentActionActor,
  AdminCreatorContentActionItem,
  AdminCreatorContentActionListResponse,
  PartnerCreatorContentAdmin,
  PartnerCreatorContentAdminActionListParams,
  PartnerCreatorContentAdminListParams,
  PartnerCreatorContentAdminListResponse,
  PartnerCreatorContentAdminSummaryParams,
  PartnerCreatorContentAdminSummaryResponse,
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
  CreatorContentAuthor,
  CreatorContentAuthorKind,
  CreatorContentType,
  CreatorPublicContent,
  CreatorPublicDetailResponse,
  CreatorPublicListItem,
  CreatorPublicListParams,
  CreatorPublicListResponse,
  CreatorPublicDirectoryItem,
  CreatorPublicDirectoryListParams,
  CreatorPublicDirectoryListResponse,
  CreatorPublicProfile,
  CreatorPublicProfileParams,
  CreatorPublicProfileStats,
  CreatorPublicTerritory,
} from "./creator-public";
export { CREATOR_AUTHOR_KINDS, CREATOR_CONTENT_TYPES } from "./creator-public";

export type {
  PartnerOfferListParams,
  PartnerOfferPartnerSummary,
  PartnerOfferPublic,
  PartnerOfferPublicListResponse,
} from "./partner-offer-public";

export type {
  PartnerOfferReadinessCheck,
  PartnerOfferReadinessCheckSeverity,
  PartnerOfferReadinessFields,
  PartnerOfferReadinessLevel,
  PartnerOfferValueCategory,
} from "./partner-offer-readiness";

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
  ChallengeClaimResponse,
  PassportBadgeResponse,
  PassportBadgesResponse,
  PassportChallengeResponse,
  PassportChallengesResponse,
  PassportOverviewPassportResponse,
  PassportOverviewResponse,
  PassportReputationResponse,
  PassportSummaryResponse,
  PassportWalletResponse,
} from "./passport-me";

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
  LocalVideo,
  LocalVideoAuthor,
  LocalVideoComment,
  LocalVideoCommentCreatePayload,
  LocalVideoCommentListResponse,
  LocalVideoContentType,
  LocalVideoErrorCode,
  LocalVideoFeedItem,
  LocalVideoLikeResponse,
  LocalVideoListParams,
  LocalVideoListResponse,
  LocalVideoProcessingStatusId,
  LocalVideoPublishAcceptedResponse,
  LocalVideoPublishPayload,
  LocalVideoReportCreatePayload,
  LocalVideoReportReason,
  LocalVideoStatusId,
  LocalVideoTypeId,
  LocalVideoUpload,
  LocalVideoUploadInitPayload,
} from "./local-video";

export {
  LOCAL_VIDEO_ALLOWED_CONTENT_TYPES,
  LOCAL_VIDEO_MAX_BYTES,
  LOCAL_VIDEO_MAX_DURATION_SECONDS,
} from "./local-video";

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
  PostComposerMeta,
  PostCrossPostTargets,
  PostFormatId,
  PostMediaItem,
  PostMediaTypeId,
  PostMediaUploadResponse,
  PostPollPayload,
  PostVisibilityId,
} from "./post-composer";

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
  NeighborhoodAliasItem,
  NeighborhoodContextEventItem,
  NeighborhoodContextOfferItem,
  NeighborhoodContextOrganizationItem,
  NeighborhoodContextPostItem,
  NeighborhoodContextResponse,
  NeighborhoodContextStats,
  NeighborhoodDetail,
  NeighborhoodDetailContributionItem,
  NeighborhoodContributionAnonymousGender,
  NeighborhoodContributionIdentityType,
  NeighborhoodContributionMeItem,
  NeighborhoodContributionMeListResponse,
  NeighborhoodContributionMeStatus,
  NeighborhoodContributionSubmitRequest,
  NeighborhoodContributionSubmitResponse,
  NeighborhoodContributionMeNeighborhood,
  NeighborhoodDetailCreatorItem,
  NeighborhoodDetailEventItem,
  NeighborhoodDetailHero,
  NeighborhoodDetailHistory,
  NeighborhoodDetailPassportOfferItem,
  NeighborhoodDetailPlaceItem,
  NeighborhoodDetailStats,
  NeighborhoodDetailTribeItem,
  NeighborhoodDetailVideoAuthor,
  NeighborhoodDetailVideoItem,
  NeighborhoodCommunityTagItem,
  NeighborhoodLandmarkItem,
  NeighborhoodListResponse,
  NeighborhoodTimelineItem,
  NeighborhoodTribeSuggestionItem,
} from "./neighborhood";

export type {
  CulturalGalleryImage,
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
  TribeJoinRequestPayload,
  TribeJoinRequestItem,
  TribeJoinRequestListResponse,
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
  PartnerLeadCreatePayload,
  PartnerLeadListParams,
  PartnerLeadListResponse,
  PartnerLeadSource,
  PartnerLeadStatus,
  PartnerLeadUpdatePayload,
} from "./partner_lead";

export type {
  WeatherCurrent,
  WeatherSource,
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
