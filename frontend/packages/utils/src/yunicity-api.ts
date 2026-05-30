import type {
  CulturalPlaceDetail,
  CulturalPlaceListResponse,
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
  OrganizationCreateResponse,
  OrganizationMeListResponse,
  OrganizationPublic,
  OrganizationRequestPayload,
  PartnerOfferListResponse,
  PassportActivateRequest,
  PassportMe,
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
  ReportPostPayload,
  UserProfile,
} from "@yunicity/types";

import type { AuthClient } from "./auth/auth-client";
import { OrganizationApi, createOrganizationApi } from "./organization-api";
import { PartnerOffersApi, createPartnerOffersApi } from "./partner-offers-api";
import { PassportApi, createPassportApi } from "./passport-api";
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

/** FaÃƒÂ§ade profile + organizations + passport. */
export class YunicityApi {
  readonly profile: ProfileApi;
  readonly organization: OrganizationApi;
  readonly partnerOffers: PartnerOffersApi;
  readonly passport: PassportApi;
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

  constructor(client: AuthClient, apiBaseUrl: string) {
    this.profile = createProfileApi(client, apiBaseUrl);
    this.organization = createOrganizationApi(client, apiBaseUrl);
    this.partnerOffers = createPartnerOffersApi(client, apiBaseUrl);
    this.passport = createPassportApi(client, apiBaseUrl);
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
    limit?: number;
  }): Promise<CulturalPlaceListResponse> {
    return this.culturalPlaces.listPlaces(params);
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

  listPassportOffers(): Promise<PartnerOfferListResponse> {
    return this.passport.listOffers();
  }

  redeemPassportOffer(offerId: string): Promise<Redemption> {
    return this.passport.redeemOffer(offerId);
  }

  getPassportQr() {
    return this.passport.getPassportQr();
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
