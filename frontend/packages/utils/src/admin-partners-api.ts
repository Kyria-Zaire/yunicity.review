import type { AdminPartnerDetailResponse } from "@yunicity/types";

import type { AuthClient } from "./auth/auth-client";
import { ApiClientBase } from "./api-client";

export class AdminPartnersApi extends ApiClientBase {
  getPartnerDetail(organizationId: string): Promise<AdminPartnerDetailResponse> {
    return this.getJson<AdminPartnerDetailResponse>(
      `/admin/partners/${encodeURIComponent(organizationId)}`,
    );
  }
}

export function createAdminPartnersApi(client: AuthClient, apiBaseUrl: string): AdminPartnersApi {
  return new AdminPartnersApi(client, apiBaseUrl);
}
