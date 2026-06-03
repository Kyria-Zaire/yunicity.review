import type {
  AdminPartnerActivatePayload,
  AdminPartnerCreateProfilePayload,
  AdminPartnerDetailResponse,
  AdminPartnerPatchPayload,
  AdminPartnerPausePayload,
  AdminPartnerUpgradePremiumPayload,
} from "@yunicity/types";

import type { AuthClient } from "./auth/auth-client";
import { ApiClientBase } from "./api-client";

export class AdminPartnersApi extends ApiClientBase {
  getPartnerDetail(organizationId: string): Promise<AdminPartnerDetailResponse> {
    return this.getJson<AdminPartnerDetailResponse>(
      `/admin/partners/${encodeURIComponent(organizationId)}`,
    );
  }

  createProfile(
    organizationId: string,
    payload: AdminPartnerCreateProfilePayload = {},
  ): Promise<AdminPartnerDetailResponse> {
    return this.postJson<AdminPartnerDetailResponse>(
      `/admin/partners/${encodeURIComponent(organizationId)}/profile`,
      payload,
    );
  }

  activate(
    organizationId: string,
    payload: AdminPartnerActivatePayload = {},
  ): Promise<AdminPartnerDetailResponse> {
    return this.postJson<AdminPartnerDetailResponse>(
      `/admin/partners/${encodeURIComponent(organizationId)}/activate`,
      payload,
    );
  }

  pause(
    organizationId: string,
    payload: AdminPartnerPausePayload = {},
  ): Promise<AdminPartnerDetailResponse> {
    return this.postJson<AdminPartnerDetailResponse>(
      `/admin/partners/${encodeURIComponent(organizationId)}/pause`,
      payload,
    );
  }

  upgradePremium(
    organizationId: string,
    payload: AdminPartnerUpgradePremiumPayload = {},
  ): Promise<AdminPartnerDetailResponse> {
    return this.postJson<AdminPartnerDetailResponse>(
      `/admin/partners/${encodeURIComponent(organizationId)}/upgrade-premium`,
      payload,
    );
  }

  patchSettings(
    organizationId: string,
    payload: AdminPartnerPatchPayload,
  ): Promise<AdminPartnerDetailResponse> {
    return this.patchJson<AdminPartnerDetailResponse>(
      `/admin/partners/${encodeURIComponent(organizationId)}`,
      payload,
    );
  }
}

export function createAdminPartnersApi(client: AuthClient, apiBaseUrl: string): AdminPartnersApi {
  return new AdminPartnersApi(client, apiBaseUrl);
}
