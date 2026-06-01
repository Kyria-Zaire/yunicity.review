import type {
  NotificationInboxTab,
  PushSubscription,
  PushSubscriptionListResponse,
  RegisterPushDeviceRequest,
  UserNotificationListResponse,
  UserNotificationPreferences,
  UserNotificationPreferencesUpdate,
  UserNotificationSummaryResponse,
} from "@yunicity/types";

import type { AuthClient } from "./auth/auth-client";
import { ApiClientBase } from "./api-client";

export class NotificationsApi extends ApiClientBase {
  registerPushDevice(payload: RegisterPushDeviceRequest): Promise<PushSubscription> {
    return this.postJson<PushSubscription>("/notifications/register-device", payload);
  }

  listMyPushSubscriptions(): Promise<PushSubscriptionListResponse> {
    return this.getJson<PushSubscriptionListResponse>("/notifications/me/subscriptions");
  }

  deletePushSubscription(subscriptionId: string): Promise<void> {
    return this.deleteVoid(`/notifications/subscriptions/${encodeURIComponent(subscriptionId)}`);
  }

  getInboxSummary(): Promise<UserNotificationSummaryResponse> {
    return this.getJson<UserNotificationSummaryResponse>("/notifications/summary");
  }

  listInbox(
    limitOrParams:
      | number
      | { tab: NotificationInboxTab; cursor?: string; limit?: number } = 50,
  ): Promise<UserNotificationListResponse> {
    if (typeof limitOrParams === "number") {
      return this.getJson<UserNotificationListResponse>(
        `/notifications?limit=${encodeURIComponent(String(limitOrParams))}`,
      );
    }
    const search = new URLSearchParams();
    search.set("limit", String(limitOrParams.limit ?? 50));
    search.set("tab", limitOrParams.tab);
    if (limitOrParams.cursor) {
      search.set("cursor", limitOrParams.cursor);
    }
    return this.getJson<UserNotificationListResponse>(`/notifications?${search.toString()}`);
  }

  markNotificationRead(notificationId: string): Promise<{ id: string; is_read: boolean }> {
    return this.patchJson<{ id: string; is_read: boolean }>(
      `/notifications/${encodeURIComponent(notificationId)}/read`,
      {},
    );
  }

  markAllNotificationsRead(): Promise<{ marked_count: number }> {
    return this.postJson<{ marked_count: number }>("/notifications/read-all", {});
  }

  getNotificationPreferences(): Promise<UserNotificationPreferences> {
    return this.getJson<UserNotificationPreferences>("/users/me/preferences");
  }

  updateNotificationPreferences(
    payload: UserNotificationPreferencesUpdate,
  ): Promise<UserNotificationPreferences> {
    return this.patchJson<UserNotificationPreferences>("/users/me/preferences", payload);
  }
}

export function createNotificationsApi(
  client: AuthClient,
  apiBaseUrl: string,
): NotificationsApi {
  return new NotificationsApi(client, apiBaseUrl);
}
