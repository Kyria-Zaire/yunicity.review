import type {
  AdminPartnerActivatePayload,
  AdminPartnerCreateProfilePayload,
  AdminPartnerDetailResponse,
  AdminPartnerPatchPayload,
  AdminPartnerPausePayload,
  AdminPartnersTerrainListParams,
  AdminPartnersTerrainListResponse,
  AdminPartnersWorkspaceSummary,
  AdminPartnersWorkspaceSummaryParams,
  AdminPartnerUpgradePremiumPayload,
} from "@yunicity/types";

import type { AuthClient } from "./auth/auth-client";
import { ApiClientBase } from "./api-client";

export class AdminPartnersApi extends ApiClientBase {
  listTerrain(params: AdminPartnersTerrainListParams = {}): Promise<AdminPartnersTerrainListResponse> {
    const query = new URLSearchParams();
    if (params.city) query.set("city", params.city);
    if (params.search) query.set("search", params.search);
    if (params.status) query.set("status", params.status);
    if (params.partnership_type) query.set("partnership_type", params.partnership_type);
    if (params.organization_type) query.set("organization_type", params.organization_type);
    if (params.page) query.set("page", String(params.page));
    if (params.page_size) query.set("page_size", String(params.page_size));
    const suffix = query.size > 0 ? `?${query.toString()}` : "";
    return this.getJson<AdminPartnersTerrainListResponse>(`/admin/partners/terrain${suffix}`);
  }

  getWorkspaceSummary(
    params: AdminPartnersWorkspaceSummaryParams = {},
  ): Promise<AdminPartnersWorkspaceSummary> {
    const query = new URLSearchParams();
    if (params.city) {
      query.set("city", params.city);
    }
    const suffix = query.size > 0 ? `?${query.toString()}` : "";
    return this.getJson<AdminPartnersWorkspaceSummary>(
      `/admin/partners/workspace-summary${suffix}`,
    );
  }

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
