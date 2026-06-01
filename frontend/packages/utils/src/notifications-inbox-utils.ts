import type { NotificationInboxTab } from "@yunicity/types";

import {
  NOTIFICATIONS_EMPTY_BODY_CALM,
  NOTIFICATIONS_EMPTY_BODY_EVENTS,
  NOTIFICATIONS_EMPTY_BODY_MENTIONS,
  NOTIFICATIONS_EMPTY_BODY_PASSPORT,
  NOTIFICATIONS_EMPTY_BODY_SOCIAL,
  NOTIFICATIONS_EMPTY_BODY_SYSTEM,
} from "./notifications-page-labels";

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
