import type { UserNotificationItem } from "@yunicity/types";

import {
  NOTIFICATIONS_MEDIUM_SUMMARY_DISPLAYED,
  NOTIFICATIONS_MEDIUM_SUMMARY_EMPTY_EVENT,
  NOTIFICATIONS_MEDIUM_SUMMARY_EMPTY_OFFER,
} from "./notifications-medium-labels";
import { NOTIFICATIONS_DESKTOP_RAIL_SUMMARY_UNREAD } from "./notifications-desktop-labels";
import {
  buildNotificationDesktopRow,
  countNotificationDesktopDisplayedRecent,
  formatNotificationDesktopTime,
  notificationMatchesDesktopTypeFilter,
  type NotificationsDesktopIconTone,
} from "./notifications-desktop-presenter";

export type NotificationsMediumSummaryCardKind = "unread" | "event" | "offer";

export type NotificationsMediumSummaryCard = {
  id: string;
  kind: NotificationsMediumSummaryCardKind;
  title: string;
  detail: string;
  href: string | null;
  iconTone: NotificationsDesktopIconTone;
};

function payloadString(item: UserNotificationItem, key: string): string | null {
  const value = item.payload?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function pickFirstByType(
  items: UserNotificationItem[],
  filter: "events" | "offers",
): UserNotificationItem | null {
  const match = items.find((item) => notificationMatchesDesktopTypeFilter(item, filter));
  return match ?? null;
}

/** Cartes résumé medium — 3 slots maquette (non lues · sortie · offre). */
export function buildNotificationMediumSummaryCards(input: {
  items: UserNotificationItem[];
  unreadCount: number;
  hrefResolver: (item: UserNotificationItem) => string;
  now?: number;
}): NotificationsMediumSummaryCard[] {
  const now = input.now ?? Date.now();
  const displayed = countNotificationDesktopDisplayedRecent(input.items, now);
  const eventItem = pickFirstByType(input.items, "events");
  const offerItem = pickFirstByType(input.items, "offers");

  const cards: NotificationsMediumSummaryCard[] = [
    {
      id: "unread",
      kind: "unread",
      title: NOTIFICATIONS_DESKTOP_RAIL_SUMMARY_UNREAD(input.unreadCount),
      detail: NOTIFICATIONS_MEDIUM_SUMMARY_DISPLAYED(displayed),
      href: null,
      iconTone: "status",
    },
  ];

  if (eventItem) {
    const row = buildNotificationDesktopRow(eventItem, input.hrefResolver(eventItem), now);
    const venue = payloadString(eventItem, "event_venue") ?? payloadString(eventItem, "event_title");
    const eventTime = payloadString(eventItem, "event_time");
    const tomorrowFlag =
      eventItem.payload?.starts_tomorrow === true || eventItem.payload?.starts_tomorrow === "true";
    cards.push({
      id: eventItem.id,
      kind: "event",
      title: venue ?? row.title,
      detail: tomorrowFlag
        ? `demain${eventTime ? ` à ${eventTime}` : ""}`
        : eventTime ?? formatNotificationDesktopTime(eventItem.created_at, now),
      href: row.href,
      iconTone: "events",
    });
  } else {
    cards.push({
      id: "event-empty",
      kind: "event",
      title: NOTIFICATIONS_MEDIUM_SUMMARY_EMPTY_EVENT,
      detail: "",
      href: "/sortir",
      iconTone: "events",
    });
  }

  if (offerItem) {
    const row = buildNotificationDesktopRow(offerItem, input.hrefResolver(offerItem), now);
    const offerTitle =
      payloadString(offerItem, "offer_title") ??
      payloadString(offerItem, "partner_name") ??
      row.title;
    const expires =
      payloadString(offerItem, "expires_label") ??
      payloadString(offerItem, "event_time") ??
      row.timeLabel;
    cards.push({
      id: offerItem.id,
      kind: "offer",
      title: offerTitle.startsWith("Offre") ? offerTitle : `Offre ${offerTitle}`,
      detail: expires,
      href: row.href,
      iconTone: "offers",
    });
  } else {
    cards.push({
      id: "offer-empty",
      kind: "offer",
      title: NOTIFICATIONS_MEDIUM_SUMMARY_EMPTY_OFFER,
      detail: "",
      href: "/passport",
      iconTone: "offers",
    });
  }

  return cards;
}
