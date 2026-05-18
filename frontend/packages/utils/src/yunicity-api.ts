import type {
  OrganizationCreateResponse,
  OrganizationMeListResponse,
  OrganizationPublic,
  OrganizationRequestPayload,
  ProfileCompleteRequest,
  ProfilePublic,
  ProfileUpdateRequest,
  UserProfile,
} from "@yunicity/types";

import type { AuthClient } from "./auth/auth-client";
import { OrganizationApi, createOrganizationApi } from "./organization-api";
import { ProfileApi, createProfileApi } from "./profile-api";

/** Façade profile + organizations (compat TICKET-206). */
export class YunicityApi {
  readonly profile: ProfileApi;
  readonly organization: OrganizationApi;

  constructor(client: AuthClient, apiBaseUrl: string) {
    this.profile = createProfileApi(client, apiBaseUrl);
    this.organization = createOrganizationApi(client, apiBaseUrl);
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
}

export function createYunicityApi(client: AuthClient, apiBaseUrl: string): YunicityApi {
  return new YunicityApi(client, apiBaseUrl);
}
