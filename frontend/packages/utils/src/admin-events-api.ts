import type {
  AdminLocalEventActionListParams,
  AdminLocalEventActionListResponse,
  AdminLocalEventDetail,
  AdminLocalEventListItem,
  AdminLocalEventListParams,
  AdminLocalEventListResponse,
  LocalEventRejectPayload,
} from "@yunicity/types";

import type { AuthClient } from "./auth/auth-client";
import { ApiClientBase } from "./api-client";

function buildPagedQuery(params?: { page?: number; page_size?: number }): string {
  if (!params) {
    return "";
  }
  const search = new URLSearchParams();
  if (params.page !== undefined) {
    search.set("page", String(params.page));
  }
  if (params.page_size !== undefined) {
    search.set("page_size", String(params.page_size));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

function buildListQuery(params?: AdminLocalEventListParams): string {
  if (!params) {
    return "";
  }
  const search = new URLSearchParams();
  if (params.status) {
    search.set("status", params.status);
  }
  if (params.city) {
    search.set("city", params.city);
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

export class AdminEventsApi extends ApiClientBase {
  listEvents(params?: AdminLocalEventListParams): Promise<AdminLocalEventListResponse> {
    return this.getJson<AdminLocalEventListResponse>(
      `/admin/local-events${buildListQuery(params)}`,
    );
  }

  getEventDetail(eventId: string): Promise<AdminLocalEventDetail> {
    return this.getJson<AdminLocalEventDetail>(
      `/admin/local-events/${encodeURIComponent(eventId)}`,
    );
  }

  approveEvent(eventId: string): Promise<AdminLocalEventListItem> {
    return this.postJson<AdminLocalEventListItem>(
      `/admin/local-events/${encodeURIComponent(eventId)}/approve`,
      {},
    );
  }

  rejectEvent(eventId: string, payload: LocalEventRejectPayload): Promise<AdminLocalEventListItem> {
    return this.postJson<AdminLocalEventListItem>(
      `/admin/local-events/${encodeURIComponent(eventId)}/reject`,
      payload,
    );
  }

  listEventActions(
    eventId: string,
    params?: AdminLocalEventActionListParams,
  ): Promise<AdminLocalEventActionListResponse> {
    return this.getJson<AdminLocalEventActionListResponse>(
      `/admin/local-events/${encodeURIComponent(eventId)}/actions${buildPagedQuery(params)}`,
    );
  }
}

export function createAdminEventsApi(client: AuthClient, apiBaseUrl: string): AdminEventsApi {
  return new AdminEventsApi(client, apiBaseUrl);
}
