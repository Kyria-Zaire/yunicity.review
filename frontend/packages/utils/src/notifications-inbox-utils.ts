import type { NotificationInboxTab, UserNotificationItem } from "@yunicity/types";

import {
  NOTIFICATIONS_EMPTY_BODY_CALM,
  NOTIFICATIONS_EMPTY_BODY_EVENTS,
  NOTIFICATIONS_EMPTY_BODY_MENTIONS,
  NOTIFICATIONS_EMPTY_BODY_PASSPORT,
  NOTIFICATIONS_EMPTY_BODY_SOCIAL,
  NOTIFICATIONS_EMPTY_BODY_SYSTEM,
} from "./notifications-page-labels";

function notificationCategory(item: UserNotificationItem): string | null {
  const category = item.payload?.category;
  return typeof category === "string" ? category : null;
}

/** Client-side inbox tab filter — backend list endpoint ignores tab/cursor (TICKET-503). */
export function notificationMatchesTab(
  item: UserNotificationItem,
  tab: NotificationInboxTab,
): boolean {
  if (tab === "all") return true;
  if (tab === "unread") return !item.is_read;
  if (tab === "mentions" || tab === "achievements" || tab === "offers") {
    return false;
  }

  const category = notificationCategory(item);

  switch (tab) {
    case "social":
      return item.type === "POST_LIKED" || item.type === "POST_COMMENTED";
    case "events":
      return item.type === "LOCAL_EVENT_PUBLISHED" || category === "events";
    case "passport":
      return (
        item.type === "PASSPORT_LEVEL_UNLOCKED" ||
        item.type === "LOCAL_STAMP_EARNED" ||
        category === "passport"
      );
    case "system":
      return item.actor_id == null && item.type !== "LOCAL_EVENT_PUBLISHED";
    default:
      return true;
  }
}

export function filterNotificationsByTab(
  items: UserNotificationItem[],
  tab: NotificationInboxTab,
): UserNotificationItem[] {
  return items.filter((item) => notificationMatchesTab(item, tab));
}

export function countUnreadNotificationsByTab(
  items: UserNotificationItem[],
): Record<"mentions" | "social" | "events" | "passport" | "system", number> {
  const unread = (tab: NotificationInboxTab) =>
    items.filter((item) => !item.is_read && notificationMatchesTab(item, tab)).length;

  return {
    mentions: unread("mentions"),
    social: unread("social"),
    events: unread("events"),
    passport: unread("passport"),
    system: unread("system"),
  };
}

export function notificationEmptyMessage(tab: NotificationInboxTab): string {
  switch (tab) {
    case "mentions":
      return NOTIFICATIONS_EMPTY_BODY_MENTIONS;
    case "social":
      return NOTIFICATIONS_EMPTY_BODY_SOCIAL;
    case "events":
      return NOTIFICATIONS_EMPTY_BODY_EVENTS;
    case "passport":
      return NOTIFICATIONS_EMPTY_BODY_PASSPORT;
    case "system":
      return NOTIFICATIONS_EMPTY_BODY_SYSTEM;
    default:
      return NOTIFICATIONS_EMPTY_BODY_CALM;
  }
}

export function notificationTabLabel(tab: NotificationInboxTab): string {
  switch (tab) {
    case "all":
      return "Toutes";
    case "unread":
      return "Non lues";
    case "mentions":
      return "Mentions";
    case "social":
      return "Fil social";
    case "events":
      return "Événements";
    case "passport":
      return "Passport";
    case "system":
      return "Système";
    case "achievements":
      return "Succès";
    default:
      return "Notifications";
  }
}
