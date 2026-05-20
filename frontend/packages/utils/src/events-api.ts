import type {
  EventInterestToggleResponse,
  LocalEvent,
  LocalEventListResponse,
} from "@yunicity/types";

import type { AuthClient } from "./auth/auth-client";
import { ApiClientBase } from "./api-client";

export class EventsApi extends ApiClientBase {
  listEvents(params?: { city?: string; page?: number }): Promise<LocalEventListResponse> {
    const search = new URLSearchParams();
    if (params?.city) {
      search.set("city", params.city);
    }
    if (params?.page) {
      search.set("page", String(params.page));
    }
    const qs = search.toString();
    return this.getJson<LocalEventListResponse>(`/events${qs ? `?${qs}` : ""}`);
  }

  getEvent(eventId: string): Promise<LocalEvent> {
    return this.getJson<LocalEvent>(`/events/${encodeURIComponent(eventId)}`);
  }

  listSavedEvents(): Promise<LocalEventListResponse> {
    return this.getJson<LocalEventListResponse>("/events/me/saved");
  }

  toggleInterest(eventId: string): Promise<EventInterestToggleResponse> {
    return this.postJson<EventInterestToggleResponse>(
      `/events/${encodeURIComponent(eventId)}/interest`,
      {},
    );
  }
}

export function createEventsApi(client: AuthClient, apiBaseUrl: string): EventsApi {
  return new EventsApi(client, apiBaseUrl);
}
