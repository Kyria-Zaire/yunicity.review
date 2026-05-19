import type {
  PushSubscription,
  PushSubscriptionListResponse,
  RegisterPushDeviceRequest,
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
}

export function createNotificationsApi(
  client: AuthClient,
  apiBaseUrl: string,
): NotificationsApi {
  return new NotificationsApi(client, apiBaseUrl);
}
