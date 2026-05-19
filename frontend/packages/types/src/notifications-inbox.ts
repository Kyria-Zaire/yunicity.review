/** In-app notification inbox (TICKET-503). */

export type SocialNotificationType =
  | "POST_LIKED"
  | "POST_COMMENTED"
  | "PASSPORT_LEVEL_UNLOCKED";

export interface UserNotificationItem {
  id: string;
  type: SocialNotificationType;
  actor_id: string | null;
  actor_name: string | null;
  target_post_id: string | null;
  deeplink: string | null;
  payload: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

export interface UserNotificationListResponse {
  items: UserNotificationItem[];
  unread_count: number;
  total: number;
}

export interface UserNotificationPreferences {
  social: boolean;
  passport: boolean;
  offers: boolean;
}

export interface UserNotificationPreferencesUpdate {
  social?: boolean;
  passport?: boolean;
  offers?: boolean;
}
