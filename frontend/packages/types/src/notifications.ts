/** Push notification types (TICKET-307). */

export type PushPlatform = "ios" | "android";

export interface RegisterPushDeviceRequest {
  expo_push_token: string;
  platform: PushPlatform;
  device_name?: string | null;
  app_version?: string | null;
}

export interface PushSubscription {
  id: string;
  platform: PushPlatform;
  device_name: string | null;
  app_version: string | null;
  is_active: boolean;
  last_seen_at: string;
  created_at: string;
}

export interface PushSubscriptionListResponse {
  items: PushSubscription[];
}
