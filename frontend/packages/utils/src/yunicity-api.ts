import type {
  MapEventsListParams,
  MapEventListResponse,
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
import { SearchApi, createSearchApi } from "./search-api";
import { ProfileApi, createProfileApi } from "./profile-api";

/** Façade profile + organizations + passport. */
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
  }

  listMapEvents(params: MapEventsListParams): Promise<MapEventListResponse> {
    return this.map.listEvents(params);
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
}

export function createYunicityApi(client: AuthClient, apiBaseUrl: string): YunicityApi {
  return new YunicityApi(client, apiBaseUrl);
}
