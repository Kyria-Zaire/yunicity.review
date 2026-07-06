import type { UserNotificationItem } from "@yunicity/types";

import { formatNotificationMessage } from "./social-notification-labels";
import {
  NOTIFICATIONS_MOBILE_SECTION_EARLIER,
  NOTIFICATIONS_MOBILE_SECTION_THIS_WEEK,
  NOTIFICATIONS_MOBILE_SECTION_TODAY,
  NOTIFICATIONS_MOBILE_SECTION_YESTERDAY,
} from "./notifications-mobile-labels";

/** Filtres pills mobile Notifications (MOBILE-NOTIFICATIONS-01). */
export type NotificationsMobileTabId =
  | "all"
  | "community"
  | "events"
  | "places"
  | "offers"
  | "system";

export type NotificationsMobileDateSection = "today" | "yesterday" | "this_week" | "earlier";

export type NotificationsMobileRow = {
  id: string;
  title: string;
  body: string;
  timeLabel: string;
  href: string;
  isRead: boolean;
  thumbnailUrl: string | null;
  iconKind: "like" | "comment" | "community" | "event" | "offer" | "place" | "system" | "passport";
  actorLabel: string | null;
};

function notificationCategory(item: UserNotificationItem): string | null {
  const category = item.payload?.category;
  return typeof category === "string" ? category : null;
}

function payloadString(item: UserNotificationItem, key: string): string | null {
  const value = item.payload?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function notificationMatchesMobileTab(
  item: UserNotificationItem,
  tab: NotificationsMobileTabId,
): boolean {
  if (tab === "all") return true;

  const category = notificationCategory(item);

  switch (tab) {
    case "community":
      return (
        item.type === "POST_LIKED" ||
        item.type === "POST_COMMENTED" ||
        category === "social"
      );
    case "events":
      return item.type === "LOCAL_EVENT_PUBLISHED" || category === "events";
    case "places":
      return item.type === "LOCAL_STAMP_EARNED" || category === "places";
    case "offers":
      return category === "offers";
    case "system":
      return (
        item.type === "PASSPORT_LEVEL_UNLOCKED" ||
        category === "system" ||
        (item.actor_id == null && item.type !== "LOCAL_EVENT_PUBLISHED")
      );
    default:
      return true;
  }
}

export function filterNotificationsByMobileTab(
  items: UserNotificationItem[],
  tab: NotificationsMobileTabId,
): UserNotificationItem[] {
  return items.filter((item) => notificationMatchesMobileTab(item, tab));
}

export function countNotificationsMobileTabBadges(
  items: UserNotificationItem[],
): Record<NotificationsMobileTabId, number> {
  const count = (tab: NotificationsMobileTabId) =>
    items.filter((item) => notificationMatchesMobileTab(item, tab)).length;

  return {
    all: items.length,
    community: count("community"),
    events: count("events"),
    places: count("places"),
    offers: count("offers"),
    system: count("system"),
  };
}

export function resolveNotificationMobileDateSection(
  iso: string,
  now = Date.now(),
): NotificationsMobileDateSection {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "earlier";

  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const dateStart = new Date(date);
  dateStart.setHours(0, 0, 0, 0);
  const dayDiff = Math.round((todayStart.getTime() - dateStart.getTime()) / 86_400_000);

  if (dayDiff <= 0) return "today";
  if (dayDiff === 1) return "yesterday";
  if (dayDiff < 7) return "this_week";
  return "earlier";
}

export function notificationMobileSectionLabel(section: NotificationsMobileDateSection): string {
  switch (section) {
    case "today":
      return NOTIFICATIONS_MOBILE_SECTION_TODAY;
    case "yesterday":
      return NOTIFICATIONS_MOBILE_SECTION_YESTERDAY;
    case "this_week":
      return NOTIFICATIONS_MOBILE_SECTION_THIS_WEEK;
    default:
      return NOTIFICATIONS_MOBILE_SECTION_EARLIER;
  }
}

export function formatNotificationMobileTime(iso: string, now = Date.now()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";

  const section = resolveNotificationMobileDateSection(iso, now);
  if (section === "today") {
    const diffMs = now - date.getTime();
    const minutes = Math.floor(diffMs / 60_000);
    if (minutes < 1) return "À l'instant";
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    return `${hours} h`;
  }

  const time = date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  if (section === "yesterday") {
    return `Hier à ${time}`;
  }
  if (section === "this_week") {
    return date.toLocaleDateString("fr-FR", { weekday: "short", hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function resolveNotificationMobileIconKind(
  item: UserNotificationItem,
): NotificationsMobileRow["iconKind"] {
  switch (item.type) {
    case "POST_LIKED":
      return "like";
    case "POST_COMMENTED":
      return "comment";
    case "LOCAL_EVENT_PUBLISHED":
      return "event";
    case "LOCAL_STAMP_EARNED":
      return "place";
    case "PASSPORT_LEVEL_UNLOCKED":
      return "passport";
    default:
      if (notificationCategory(item) === "offers") return "offer";
      if (item.actor_id) return "community";
      return "system";
  }
}

function buildNotificationMobileTitle(item: UserNotificationItem): string {
  const actor = item.actor_name?.trim();
  const eventTitle = payloadString(item, "event_title");
  const stampTitle = payloadString(item, "stamp_title");
  const tierLabel = payloadString(item, "tier_label");

  switch (item.type) {
    case "POST_LIKED":
      return actor ? `${actor} a aimé votre publication.` : "Quelqu'un a aimé votre publication.";
    case "POST_COMMENTED":
      return actor ? `${actor} a commenté votre publication.` : "Nouveau commentaire sur votre publication.";
    case "LOCAL_EVENT_PUBLISHED":
      return eventTitle ? `Nouvel événement : ${eventTitle}` : "Un événement local vient d'être publié.";
    case "LOCAL_STAMP_EARNED":
      return stampTitle ? `Nouveau souvenir : ${stampTitle}` : "Nouveau souvenir territorial.";
    case "PASSPORT_LEVEL_UNLOCKED":
      return tierLabel ? `Félicitations ! Niveau ${tierLabel}` : "Votre Passport progresse.";
    default:
      return actor ? `${actor} — activité locale` : "Notification Yunicity";
  }
}

function buildNotificationMobileBody(item: UserNotificationItem): string {
  const excerpt = payloadString(item, "post_excerpt") ?? payloadString(item, "comment_excerpt");
  if (excerpt) return excerpt;

  const eventTitle = payloadString(item, "event_title");
  if (item.type === "LOCAL_EVENT_PUBLISHED" && eventTitle) {
    return formatNotificationMessage(item.type, item.actor_name, item.payload);
  }

  return formatNotificationMessage(item.type, item.actor_name, item.payload);
}

function resolveNotificationMobileThumbnail(item: UserNotificationItem): string | null {
  return (
    payloadString(item, "thumbnail_url") ??
    payloadString(item, "media_url") ??
    payloadString(item, "image_url")
  );
}

export function buildNotificationMobileRow(
  item: UserNotificationItem,
  href: string,
): NotificationsMobileRow {
  return {
    id: item.id,
    title: buildNotificationMobileTitle(item),
    body: buildNotificationMobileBody(item),
    timeLabel: formatNotificationMobileTime(item.created_at),
    href,
    isRead: item.is_read,
    thumbnailUrl: resolveNotificationMobileThumbnail(item),
    iconKind: resolveNotificationMobileIconKind(item),
    actorLabel: item.actor_name?.trim() ?? null,
  };
}

export type NotificationsMobileGroupedSection = {
  section: NotificationsMobileDateSection;
  label: string;
  items: NotificationsMobileRow[];
};

const SECTION_ORDER: NotificationsMobileDateSection[] = [
  "today",
  "yesterday",
  "this_week",
  "earlier",
];

export function groupNotificationMobileRows(
  rows: NotificationsMobileRow[],
  sourceItems: UserNotificationItem[],
): NotificationsMobileGroupedSection[] {
  const byId = new Map(sourceItems.map((item) => [item.id, item]));
  const buckets = new Map<NotificationsMobileDateSection, NotificationsMobileRow[]>();

  for (const row of rows) {
    const source = byId.get(row.id);
    const section = source
      ? resolveNotificationMobileDateSection(source.created_at)
      : "earlier";
    const list = buckets.get(section) ?? [];
    list.push(row);
    buckets.set(section, list);
  }

  return SECTION_ORDER.filter((section) => (buckets.get(section)?.length ?? 0) > 0).map(
    (section) => ({
      section,
      label: notificationMobileSectionLabel(section),
      items: buckets.get(section) ?? [],
    }),
  );
}
