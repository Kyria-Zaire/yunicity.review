import type {
  PartnerCreatorContentCreatePayload,
  PartnerCreatorContentManagement,
  PartnerCreatorContentManagementListParams,
  PartnerCreatorContentManagementListResponse,
  PartnerCreatorContentUpdatePayload,
} from "@yunicity/types";

import type { AuthClient } from "./auth/auth-client";
import { ApiClientBase } from "./api-client";

function buildListQuery(params?: PartnerCreatorContentManagementListParams): string {
  if (!params) {
    return "";
  }
  const search = new URLSearchParams();
  if (params.organization_id) {
    search.set("organization_id", params.organization_id);
  }
  if (params.status) {
    search.set("status", params.status);
  }
  if (params.page !== undefined) {
    search.set("page", String(params.page));
  }
  if (params.page_size !== undefined) {
    search.set("page_size", String(params.page_size));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export class OrganizationCreatorContentApi extends ApiClientBase {
  listContents(
    params?: PartnerCreatorContentManagementListParams,
  ): Promise<PartnerCreatorContentManagementListResponse> {
    return this.getJson<PartnerCreatorContentManagementListResponse>(
      `/organizations/me/creator-content${buildListQuery(params)}`,
    );
  }

  createContent(
    payload: PartnerCreatorContentCreatePayload,
  ): Promise<PartnerCreatorContentManagement> {
    return this.postJson<PartnerCreatorContentManagement>(
      "/organizations/me/creator-content",
      payload,
    );
  }

  updateContent(
    id: string,
    payload: PartnerCreatorContentUpdatePayload,
  ): Promise<PartnerCreatorContentManagement> {
    return this.patchJson<PartnerCreatorContentManagement>(
      `/organizations/me/creator-content/${encodeURIComponent(id)}`,
      payload,
    );
  }

  submitContent(id: string): Promise<PartnerCreatorContentManagement> {
    return this.postJson<PartnerCreatorContentManagement>(
      `/organizations/me/creator-content/${encodeURIComponent(id)}/submit`,
      {},
    );
  }
}

export function createOrganizationCreatorContentApi(
  client: AuthClient,
  apiBaseUrl: string,
): OrganizationCreatorContentApi {
  return new OrganizationCreatorContentApi(client, apiBaseUrl);
}
