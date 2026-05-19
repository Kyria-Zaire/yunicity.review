import type {
  OrganizationCreateResponse,
  OrganizationMeListResponse,
  OrganizationPublic,
  OrganizationRequestPayload,
  PartnerOfferListResponse,
  PassportActivateRequest,
  PassportMe,
  PassportStampListResponse,
  ProfileCompleteRequest,
  ProfilePublic,
  ProfileUpdateRequest,
  PushSubscription,
  PushSubscriptionListResponse,
  Redemption,
  RegisterPushDeviceRequest,
  UserProfile,
} from "@yunicity/types";

import type { AuthClient } from "./auth/auth-client";
import { OrganizationApi, createOrganizationApi } from "./organization-api";
import { PartnerOffersApi, createPartnerOffersApi } from "./partner-offers-api";
import { PassportApi, createPassportApi } from "./passport-api";
import { ScanApi, createScanApi } from "./scan-api";
import { NotificationsApi, createNotificationsApi } from "./notifications-api";
import { ProfileApi, createProfileApi } from "./profile-api";

/** Façade profile + organizations + passport. */
export class YunicityApi {
  readonly profile: ProfileApi;
  readonly organization: OrganizationApi;
  readonly partnerOffers: PartnerOffersApi;
  readonly passport: PassportApi;
  readonly scan: ScanApi;
  readonly notifications: NotificationsApi;

  constructor(client: AuthClient, apiBaseUrl: string) {
    this.profile = createProfileApi(client, apiBaseUrl);
    this.organization = createOrganizationApi(client, apiBaseUrl);
    this.partnerOffers = createPartnerOffersApi(client, apiBaseUrl);
    this.passport = createPassportApi(client, apiBaseUrl);
    this.scan = createScanApi(client, apiBaseUrl);
    this.notifications = createNotificationsApi(client, apiBaseUrl);
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
}

export function createYunicityApi(client: AuthClient, apiBaseUrl: string): YunicityApi {
  return new YunicityApi(client, apiBaseUrl);
}
