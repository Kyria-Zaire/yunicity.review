import type {
  PushSubscription,
  PushSubscriptionListResponse,
  RegisterPushDeviceRequest,
  UserNotificationListResponse,
  UserNotificationPreferences,
  UserNotificationPreferencesUpdate,
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

  listInbox(limit = 50): Promise<UserNotificationListResponse> {
    return this.getJson<UserNotificationListResponse>(
      `/notifications?limit=${encodeURIComponent(String(limit))}`,
    );
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
