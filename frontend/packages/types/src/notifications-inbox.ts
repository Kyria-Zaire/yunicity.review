/** In-app notification inbox (TICKET-503). */

export type SocialNotificationType =
  | "POST_LIKED"
  | "POST_COMMENTED"
  | "PASSPORT_LEVEL_UNLOCKED"
  | "LOCAL_STAMP_EARNED"
  | "LOCAL_EVENT_PUBLISHED";

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

export type NotificationInboxTab =
  | "all"
  | "unread"
  | "mentions"
  | "social"
  | "events"
  | "passport"
  | "offers"
  | "system"
  | "achievements";

export interface UserNotificationListResponse {
  items: UserNotificationItem[];
  unread_count: number;
  total: number;
  next_cursor?: string | null;
  has_more?: boolean;
}

export interface UserNotificationSummaryResponse {
  unread_count: number;
  by_tab?: Partial<Record<NotificationInboxTab, number>>;
  unread_mentions?: number;
  unread_social?: number;
  unread_events?: number;
  unread_passport?: number;
  unread_system?: number;
  count_this_week?: number;
  count_this_month?: number;
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
