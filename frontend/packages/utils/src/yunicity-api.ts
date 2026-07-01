import type {
  CulturalPlaceDetail,
  CulturalPlaceListResponse,
  CulturalPlaceSort,
  CulturalPlaceStatsResponse,
  MapCulturalPlaceListResponse,
  MapCulturalPlacesListParams,
  MapEventsListParams,
  MapEventListResponse,
  WeatherCurrent,
  TransitNearbyParams,
  TransitNearbyResponse,
  SearchListParams,
  SearchResponse,
  CommentCreatePayload,
  CommentListResponse,
  FeedComment,
  FeedListParams,
  FeedListResponse,
  FeedPost,
  LocalEventListResponse,
  OrganizationCreateResponse,
  OrganizationMeListResponse,
  OrganizationPublic,
  OrganizationRequestPayload,
  CreatorPublicDetailResponse,
  CreatorPublicDirectoryListParams,
  CreatorPublicDirectoryListResponse,
  CreatorPublicListParams,
  CreatorPublicListResponse,
  CreatorPublicProfile,
  CreatorPublicProfileParams,
  PartnerCreatorContentListParams,
  PartnerCreatorContentPublicListResponse,
  PartnerEventsParams,
  PartnerListParams,
  PartnerListResponse,
  PartnerOfferListParams,
  PartnerOfferPublicListResponse,
  PartnerPublic,
  ChallengeClaimResponse,
  PassportActivateRequest,
  PassportBadgesResponse,
  PassportChallengesResponse,
  PassportMe,
  PassportOverviewResponse,
  PassportStampClaimResult,
  PassportStampListResponse,
  PostCreatePayload,
  ProfileCompleteRequest,
  ProfilePublic,
  ProfileUpdateRequest,
  PushSubscription,
  PushSubscriptionListResponse,
  Redemption,
  RegisterPushDeviceRequest,
  SubscriptionCheckoutRequest,
  SubscriptionCheckoutResponse,
  SubscriptionCommunityStats,
  SubscriptionMe,
  SubscriptionPlansResponse,
  DiscussionCreatePayload,
  DiscussionInsightsResponse,
  DiscussionListParams,
  DiscussionListResponse,
  StoryCreatePayload,
  StoryInsightsResponse,
  StoryItem,
  StoryListParams,
  StoryListResponse,
  StoryMediaUploadResponse,
  StoryRingsResponse,
  ReportPostPayload,
  UserProfile,
  LocalVideo,
  LocalVideoComment,
  LocalVideoCommentCreatePayload,
  LocalVideoCommentListResponse,
  LocalVideoFeedItem,
  LocalVideoLikeResponse,
  LocalVideoListParams,
  LocalVideoListResponse,
  LocalVideoPublishAcceptedResponse,
  LocalVideoPublishPayload,
  LocalVideoReportCreatePayload,
  LocalVideoUpload,
  LocalVideoUploadInitPayload,
} from "@yunicity/types";

import type { AuthClient } from "./auth/auth-client";
import { OrganizationApi, createOrganizationApi } from "./organization-api";
import { PartnerOffersApi, createPartnerOffersApi } from "./partner-offers-api";
import { PassportApi, createPassportApi } from "./passport-api";
import { PassportMeApi, createPassportMeApi } from "./passport-me-api";
import { ScanApi, createScanApi } from "./scan-api";
import { NotificationsApi, createNotificationsApi } from "./notifications-api";
import { EventsApi, createEventsApi } from "./events-api";
import { NeighborhoodsApi, createNeighborhoodsApi } from "./neighborhood-api";
import { TribesApi, createTribesApi } from "./tribes-api";
import { FeedApi, createFeedApi } from "./feed-api";
import { MapEventsApi, createMapEventsApi } from "./map-events-api";
import { CulturalPlacesApi, createCulturalPlacesApi } from "./cultural-places-api";
import { TransitApi, createTransitApi } from "./transit-api";
import { SearchApi, createSearchApi } from "./search-api";
import { ProfileApi, createProfileApi } from "./profile-api";
import { WeatherApi, createWeatherApi } from "./weather-api";
import { SubscriptionsApi, createSubscriptionsApi } from "./subscription-api";
import { DiscussionsApi, createDiscussionsApi } from "./discussions-api";
import { StoriesApi, createStoriesApi } from "./stories-api";
import { LocalVideosApi, createLocalVideosApi } from "./local-videos-api";
import {
  OrganizationCreatorContentApi,
  createOrganizationCreatorContentApi,
} from "./organization-creator-content-api";
import {
  OrganizationEventsApi,
  createOrganizationEventsApi,
} from "./organization-events-api";
import { PartnerPassportApi, createPartnerPassportApi } from "./partner-passport-api";
import { CreatorPublicApi, createCreatorPublicApi } from "./creator-public-api";
import { PartnersApi, createPartnersApi, fetchPublicPartnerOffers } from "./partners-api";

/** FaÃƒÆ’Ã‚Â§ade profile + organizations + passport. */
export class YunicityApi {
  private readonly apiBaseUrl: string;

  readonly profile: ProfileApi;
  readonly organization: OrganizationApi;
  readonly partnerOffers: PartnerOffersApi;
  readonly passport: PassportApi;
  readonly passportMe: PassportMeApi;
  readonly scan: ScanApi;
  readonly notifications: NotificationsApi;
  readonly feed: FeedApi;
  readonly events: EventsApi;
  readonly neighborhoods: NeighborhoodsApi;
  readonly tribes: TribesApi;
  readonly search: SearchApi;
  readonly map: MapEventsApi;
  readonly transit: TransitApi;
  readonly culturalPlaces: CulturalPlacesApi;
  readonly weather: WeatherApi;
  readonly subscriptions: SubscriptionsApi;
  readonly discussions: DiscussionsApi;
  readonly stories: StoriesApi;
  readonly localVideos: LocalVideosApi;
  readonly partners: PartnersApi;
  readonly partnerPassport: PartnerPassportApi;
  readonly organizationEvents: OrganizationEventsApi;
  readonly organizationCreatorContent: OrganizationCreatorContentApi;
  readonly creatorPublic: CreatorPublicApi;

  constructor(client: AuthClient, apiBaseUrl: string) {
    this.apiBaseUrl = apiBaseUrl;
    this.profile = createProfileApi(client, apiBaseUrl);
    this.organization = createOrganizationApi(client, apiBaseUrl);
    this.partnerOffers = createPartnerOffersApi(client, apiBaseUrl);
    this.passport = createPassportApi(client, apiBaseUrl);
    this.passportMe = createPassportMeApi(client, apiBaseUrl);
    this.scan = createScanApi(client, apiBaseUrl);
    this.notifications = createNotificationsApi(client, apiBaseUrl);
    this.feed = createFeedApi(client, apiBaseUrl);
    this.events = createEventsApi(client, apiBaseUrl);
    this.neighborhoods = createNeighborhoodsApi(client, apiBaseUrl);
    this.tribes = createTribesApi(client, apiBaseUrl);
    this.search = createSearchApi(client, apiBaseUrl);
    this.map = createMapEventsApi(client, apiBaseUrl);
    this.transit = createTransitApi(client, apiBaseUrl);
    this.culturalPlaces = createCulturalPlacesApi(client, apiBaseUrl);
    this.weather = createWeatherApi(client, apiBaseUrl);
    this.subscriptions = createSubscriptionsApi(client, apiBaseUrl);
    this.discussions = createDiscussionsApi(client, apiBaseUrl);
    this.stories = createStoriesApi(client, apiBaseUrl);
    this.localVideos = createLocalVideosApi(client, apiBaseUrl);
    this.partners = createPartnersApi(client, apiBaseUrl);
    this.partnerPassport = createPartnerPassportApi(client, apiBaseUrl);
    this.organizationEvents = createOrganizationEventsApi(client, apiBaseUrl);
    this.organizationCreatorContent = createOrganizationCreatorContentApi(client, apiBaseUrl);
    this.creatorPublic = createCreatorPublicApi(client, apiBaseUrl);
  }

  listCreatorHubContent(
    params?: CreatorPublicListParams,
  ): Promise<CreatorPublicListResponse> {
    return this.creatorPublic.listCreatorContent(params);
  }

  getCreatorContentDetail(contentId: string): Promise<CreatorPublicDetailResponse> {
    return this.creatorPublic.getCreatorContentDetail(contentId);
  }

  getCreatorProfile(
    creatorId: string,
    params?: CreatorPublicProfileParams,
  ): Promise<CreatorPublicProfile> {
    return this.creatorPublic.getCreatorProfile(creatorId, params);
  }

  listCreators(
    params?: CreatorPublicDirectoryListParams,
  ): Promise<CreatorPublicDirectoryListResponse> {
    return this.creatorPublic.listCreators(params);
  }

  listPartners(params: PartnerListParams): Promise<PartnerListResponse> {
    return this.partners.listPartners(params);
  }

  getPartner(slug: string, city: string): Promise<PartnerPublic> {
    return this.partners.getPartner(slug, city);
  }

  listPartnerEvents(
    slug: string,
    params?: PartnerEventsParams,
  ): Promise<LocalEventListResponse> {
    return this.partners.listPartnerEvents(slug, params);
  }

  listPartnerCreatorContent(
    slug: string,
    params?: PartnerCreatorContentListParams,
  ): Promise<PartnerCreatorContentPublicListResponse> {
    return this.partners.listPartnerCreatorContent(slug, params);
  }

  listStories(params: StoryListParams = {}): Promise<StoryListResponse> {
    return this.stories.listStories(params);
  }

  listStoryRings(): Promise<StoryRingsResponse> {
    return this.stories.listRings();
  }

  getStoryInsights(): Promise<StoryInsightsResponse> {
    return this.stories.getInsights();
  }

  createStory(payload: StoryCreatePayload): Promise<StoryItem> {
    return this.stories.createStory(payload);
  }

  uploadStoryMedia(file: File): Promise<StoryMediaUploadResponse> {
    return this.stories.uploadMedia(file);
  }

  recordStoryView(storyId: string): Promise<void> {
    return this.stories.recordView(storyId);
  }

  listLocalVideos(params: LocalVideoListParams = {}): Promise<LocalVideoListResponse> {
    return this.localVideos.listLocalVideos(params);
  }

  getLocalVideo(videoId: string): Promise<LocalVideoFeedItem> {
    return this.localVideos.getLocalVideo(videoId);
  }

  getVideo(videoId: string): Promise<LocalVideo> {
    return this.localVideos.getVideo(videoId);
  }

  createLocalVideoUpload(payload: LocalVideoUploadInitPayload): Promise<LocalVideoUpload> {
    return this.localVideos.createUpload(payload);
  }

  publishLocalVideo(payload: LocalVideoPublishPayload): Promise<LocalVideoPublishAcceptedResponse> {
    return this.localVideos.publishVideo(payload);
  }

  likeLocalVideo(videoId: string): Promise<LocalVideoLikeResponse> {
    return this.localVideos.likeLocalVideo(videoId);
  }

  unlikeLocalVideo(videoId: string): Promise<LocalVideoLikeResponse> {
    return this.localVideos.unlikeLocalVideo(videoId);
  }

  listLocalVideoComments(
    videoId: string,
    params: { cursor?: string | null; limit?: number } = {},
  ): Promise<LocalVideoCommentListResponse> {
    return this.localVideos.listLocalVideoComments(videoId, params);
  }

  createLocalVideoComment(
    videoId: string,
    payload: LocalVideoCommentCreatePayload,
  ): Promise<LocalVideoComment> {
    return this.localVideos.createLocalVideoComment(videoId, payload);
  }

  deleteLocalVideoComment(commentId: string): Promise<void> {
    return this.localVideos.deleteLocalVideoComment(commentId);
  }

  reportLocalVideo(videoId: string, payload: LocalVideoReportCreatePayload): Promise<void> {
    return this.localVideos.reportLocalVideo(videoId, payload);
  }

  listDiscussions(params: DiscussionListParams = {}): Promise<DiscussionListResponse> {
    return this.discussions.listDiscussions(params);
  }

  getDiscussionInsights(): Promise<DiscussionInsightsResponse> {
    return this.discussions.getInsights();
  }

  createDiscussion(payload: DiscussionCreatePayload) {
    return this.discussions.createDiscussion(payload);
  }

  listSubscriptionPlans(): Promise<SubscriptionPlansResponse> {
    return this.subscriptions.listPlans();
  }

  getSubscriptionCommunityStats(): Promise<SubscriptionCommunityStats> {
    return this.subscriptions.getCommunityStats();
  }

  getMySubscription(): Promise<SubscriptionMe> {
    return this.subscriptions.getMySubscription();
  }

  startSubscriptionCheckout(
    payload: SubscriptionCheckoutRequest,
  ): Promise<SubscriptionCheckoutResponse> {
    return this.subscriptions.startCheckout(payload);
  }

  listCulturalPlaces(params: {
    city: string;
    featured?: boolean;
    category?: string[];
    sort?: CulturalPlaceSort;
    limit?: number;
    offset?: number;
  }): Promise<CulturalPlaceListResponse> {
    return this.culturalPlaces.listPlaces(params);
  }

  getCulturalPlacesStats(city: string): Promise<CulturalPlaceStatsResponse> {
    return this.culturalPlaces.getPlacesStats(city);
  }

  listMapCulturalPlaces(params: MapCulturalPlacesListParams): Promise<MapCulturalPlaceListResponse> {
    return this.culturalPlaces.listMapPlaces(params);
  }

  getCulturalPlace(slug: string, city: string): Promise<CulturalPlaceDetail> {
    return this.culturalPlaces.getPlace(slug, city);
  }

  listMapEvents(params: MapEventsListParams): Promise<MapEventListResponse> {
    return this.map.listEvents(params);
  }

  getTransitNearby(params: TransitNearbyParams): Promise<TransitNearbyResponse> {
    return this.transit.getNearby(params);
  }

  getCurrentWeather(params: { lat?: number; lon?: number; city?: string }): Promise<WeatherCurrent> {
    return this.weather.getCurrentWeather(params);
  }

  searchLocal(params: SearchListParams): Promise<SearchResponse> {
    return this.search.search(params);
  }

  registerPushDevice(payload: RegisterPushDeviceRequest): Promise<PushSubscription> {
    return this.notifications.registerPushDevice(payload);
  }

  listMyPushSubscriptions(): Promise<PushSubscriptionListResponse> {
    return this.notifications.listMyPushSubscriptions();
  }

  deletePushSubscription(subscriptionId: string): Promise<void> {
    return this.notifications.deletePushSubscription(subscriptionId);
  }

  getProfileMe(): Promise<UserProfile> {
    return this.profile.getProfileMe();
  }

  updateProfileMe(payload: ProfileUpdateRequest): Promise<UserProfile> {
    return this.profile.updateProfileMe(payload);
  }

  uploadProfileAvatar(file: File): Promise<UserProfile> {
    return this.profile.uploadProfileAvatar(file);
  }

  uploadProfileBanner(file: File): Promise<UserProfile> {
    return this.profile.uploadProfileBanner(file);
  }

  completeProfileOnboarding(payload: ProfileCompleteRequest): Promise<UserProfile> {
    return this.profile.completeProfileOnboarding(payload);
  }

  getPublicProfile(username: string): Promise<ProfilePublic> {
    return this.profile.getPublicProfile(username);
  }

  listMyOrganizations(): Promise<OrganizationMeListResponse> {
    return this.organization.listMyOrganizations();
  }

  createOrganizationRequest(
    payload: OrganizationRequestPayload,
  ): Promise<OrganizationCreateResponse> {
    return this.organization.createOrganizationRequest(payload);
  }

  getOrganizationBySlug(slug: string): Promise<OrganizationPublic> {
    return this.organization.getOrganizationBySlug(slug);
  }

  getPassportMe(): Promise<PassportMe> {
    return this.passport.getPassportMe();
  }

  activatePassport(payload?: PassportActivateRequest): Promise<PassportMe> {
    return this.passport.activatePassport(payload ?? {});
  }

  listPassportStamps(): Promise<PassportStampListResponse> {
    return this.passport.listStamps();
  }

  claimPassportStamp(token: string): Promise<PassportStampClaimResult> {
    return this.passport.claimStamp(token);
  }

  listPassportOffers(): Promise<PartnerOfferPublicListResponse> {
    return this.passport.listOffers();
  }

  listPartnerOffers(
    slug: string,
    city: string,
    params?: Pick<PartnerOfferListParams, "limit" | "offset">,
  ): Promise<PartnerOfferPublicListResponse> {
    return this.partners.listPartnerOffers(slug, city, params);
  }

  fetchPublicPartnerOffers(params: PartnerOfferListParams): Promise<PartnerOfferPublicListResponse> {
    return fetchPublicPartnerOffers(this.apiBaseUrl, params);
  }

  redeemPassportOffer(offerId: string): Promise<Redemption> {
    return this.passport.redeemOffer(offerId);
  }

  getPassportQr() {
    return this.passport.getPassportQr();
  }

  getMyPassport(): Promise<PassportOverviewResponse> {
    return this.passportMe.getMyPassport();
  }

  getMyPassportBadges(): Promise<PassportBadgesResponse> {
    return this.passportMe.getMyPassportBadges();
  }

  getMyPassportChallenges(): Promise<PassportChallengesResponse> {
    return this.passportMe.getMyPassportChallenges();
  }

  claimChallengeReward(challengeCode: string): Promise<ChallengeClaimResponse> {
    return this.passportMe.claimChallengeReward(challengeCode);
  }

  listFeed(params?: FeedListParams): Promise<FeedListResponse> {
    return this.feed.listFeed(params ?? {});
  }

  getFeedPost(postId: string): Promise<FeedPost> {
    return this.feed.getPost(postId);
  }

  createFeedPost(payload: PostCreatePayload): Promise<FeedPost> {
    return this.feed.createPost(payload);
  }

  likeFeedPost(postId: string): Promise<void> {
    return this.feed.likePost(postId);
  }

  unlikeFeedPost(postId: string): Promise<void> {
    return this.feed.unlikePost(postId);
  }

  listFeedComments(postId: string, params?: FeedListParams): Promise<CommentListResponse> {
    return this.feed.listComments(postId, params ?? {});
  }

  createFeedComment(postId: string, payload: CommentCreatePayload): Promise<FeedComment> {
    return this.feed.createComment(postId, payload);
  }

  deleteFeedComment(commentId: string): Promise<void> {
    return this.feed.deleteComment(commentId);
  }

  reportFeedPost(postId: string, payload: ReportPostPayload): Promise<void> {
    return this.feed.reportPost(postId, payload);
  }

  toggleEventInterest(eventId: string) {
    return this.events.toggleInterest(eventId);
  }
}

export function createYunicityApi(client: AuthClient, apiBaseUrl: string): YunicityApi {
  return new YunicityApi(client, apiBaseUrl);
}
