import type {
  LocalEventCreatePayload,
  LocalEventManagement,
  LocalEventManagementListParams,
  LocalEventManagementListResponse,
  LocalEventUpdatePayload,
} from "@yunicity/types";

import type { AuthClient } from "./auth/auth-client";
import { ApiClientBase } from "./api-client";

function buildListQuery(params?: LocalEventManagementListParams): string {
  if (!params) {
    return "";
  }
  const search = new URLSearchParams();
  if (params.organization_id) {
    search.set("organization_id", params.organization_id);
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

export class OrganizationEventsApi extends ApiClientBase {
  listEvents(
    params?: LocalEventManagementListParams,
  ): Promise<LocalEventManagementListResponse> {
    return this.getJson<LocalEventManagementListResponse>(
      `/organizations/me/events${buildListQuery(params)}`,
    );
  }

  createEvent(payload: LocalEventCreatePayload): Promise<LocalEventManagement> {
    return this.postJson<LocalEventManagement>("/organizations/me/events", payload);
  }

  updateEvent(id: string, payload: LocalEventUpdatePayload): Promise<LocalEventManagement> {
    return this.patchJson<LocalEventManagement>(
      `/organizations/me/events/${encodeURIComponent(id)}`,
      payload,
    );
  }

  submitEvent(id: string): Promise<LocalEventManagement> {
    return this.postJson<LocalEventManagement>(
      `/organizations/me/events/${encodeURIComponent(id)}/submit`,
      {},
    );
  }
}

export function createOrganizationEventsApi(
  client: AuthClient,
  apiBaseUrl: string,
): OrganizationEventsApi {
  return new OrganizationEventsApi(client, apiBaseUrl);
}
