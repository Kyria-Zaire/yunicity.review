import type { UserNotificationItem } from "@yunicity/types";

import {
  NOTIFICATIONS_DESKTOP_ACTION_OPEN_TRIBE,
  NOTIFICATIONS_DESKTOP_ACTION_VIEW_CONTRIBUTION,
  NOTIFICATIONS_DESKTOP_ACTION_VIEW_DETAIL,
  NOTIFICATIONS_DESKTOP_ACTION_VIEW_EVENT,
  NOTIFICATIONS_DESKTOP_ACTION_VIEW_OFFER,
  NOTIFICATIONS_DESKTOP_ACTION_VIEW_PASSPORT,
  NOTIFICATIONS_DESKTOP_ACTION_VIEW_POST,
  NOTIFICATIONS_DESKTOP_SECTION_EARLIER,
  NOTIFICATIONS_DESKTOP_SECTION_THIS_WEEK,
  NOTIFICATIONS_DESKTOP_SECTION_TODAY,
  NOTIFICATIONS_DESKTOP_TYPE_ALL,
  NOTIFICATIONS_DESKTOP_TYPE_COMMUNITY,
  NOTIFICATIONS_DESKTOP_TYPE_CONTRIBUTIONS,
  NOTIFICATIONS_DESKTOP_TYPE_EVENTS,
  NOTIFICATIONS_DESKTOP_TYPE_OFFERS,
  NOTIFICATIONS_DESKTOP_TYPE_STATUS,
} from "./notifications-desktop-labels";
import { formatNotificationMessage } from "./social-notification-labels";

export type NotificationsDesktopPrimaryTab = "all" | "unread";

export type NotificationsDesktopTypeFilter =
  | "all"
  | "events"
  | "community"
  | "contributions"
  | "offers"
  | "status";

export type NotificationsDesktopSort = "recent" | "oldest";

export type NotificationsDesktopDateSection = "today" | "this_week" | "earlier";

export type NotificationsDesktopIconTone =
  | "events"
  | "community"
  | "contributions"
  | "offers"
  | "status";

export type NotificationsDesktopRow = {
  id: string;
  title: string;
  detail: string;
  timeLabel: string;
  href: string;
  isRead: boolean;
  actionLabel: string;
  iconTone: NotificationsDesktopIconTone;
};

export type NotificationsDesktopGroupedSection = {
  section: NotificationsDesktopDateSection;
  label: string;
  items: NotificationsDesktopRow[];
};

export type NotificationsDesktopHighlight = {
  id: string;
  title: string;
  detail: string;
  timeLabel: string;
  href: string;
  iconTone: NotificationsDesktopIconTone;
};

export const NOTIFICATIONS_DESKTOP_TYPE_OPTIONS: Array<{
  id: NotificationsDesktopTypeFilter;
  label: string;
}> = [
  { id: "all", label: NOTIFICATIONS_DESKTOP_TYPE_ALL },
  { id: "events", label: NOTIFICATIONS_DESKTOP_TYPE_EVENTS },
  { id: "community", label: NOTIFICATIONS_DESKTOP_TYPE_COMMUNITY },
  { id: "contributions", label: NOTIFICATIONS_DESKTOP_TYPE_CONTRIBUTIONS },
  { id: "offers", label: NOTIFICATIONS_DESKTOP_TYPE_OFFERS },
  { id: "status", label: NOTIFICATIONS_DESKTOP_TYPE_STATUS },
];

function notificationCategory(item: UserNotificationItem): string | null {
  const category = item.payload?.category;
  return typeof category === "string" ? category : null;
}

function payloadString(item: UserNotificationItem, key: string): string | null {
  const value = item.payload?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function notificationMatchesDesktopPrimaryTab(
  item: UserNotificationItem,
  tab: NotificationsDesktopPrimaryTab,
): boolean {
  if (tab === "all") return true;
  return !item.is_read;
}

export function notificationMatchesDesktopTypeFilter(
  item: UserNotificationItem,
  filter: NotificationsDesktopTypeFilter,
): boolean {
  if (filter === "all") return true;

  const category = notificationCategory(item);

  switch (filter) {
    case "events":
      return item.type === "LOCAL_EVENT_PUBLISHED" || category === "events";
    case "community":
      return (
        item.type === "POST_LIKED" ||
        item.type === "POST_COMMENTED" ||
        category === "social"
      );
    case "contributions":
      return item.type === "LOCAL_STAMP_EARNED" || category === "places" || category === "contributions";
    case "offers":
      return category === "offers";
    case "status":
      return (
        item.type === "PASSPORT_LEVEL_UNLOCKED" ||
        category === "system" ||
        category === "passport" ||
        (item.actor_id == null && item.type !== "LOCAL_EVENT_PUBLISHED")
      );
    default:
      return true;
  }
}

export function filterNotificationsForDesktop(
  items: UserNotificationItem[],
  primaryTab: NotificationsDesktopPrimaryTab,
  typeFilter: NotificationsDesktopTypeFilter,
): UserNotificationItem[] {
  return items.filter(
    (item) =>
      notificationMatchesDesktopPrimaryTab(item, primaryTab) &&
      notificationMatchesDesktopTypeFilter(item, typeFilter),
  );
}

export function sortNotificationsForDesktop(
  items: UserNotificationItem[],
  sort: NotificationsDesktopSort,
): UserNotificationItem[] {
  const sorted = [...items].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
  return sort === "recent" ? sorted : sorted.reverse();
}

export function resolveNotificationDesktopDateSection(
  iso: string,
  now = Date.now(),
): NotificationsDesktopDateSection {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "earlier";

  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const dateStart = new Date(date);
  dateStart.setHours(0, 0, 0, 0);
  const dayDiff = Math.round((todayStart.getTime() - dateStart.getTime()) / 86_400_000);

  if (dayDiff <= 0) return "today";
  if (dayDiff < 7) return "this_week";
  return "earlier";
}

export function notificationDesktopSectionLabel(section: NotificationsDesktopDateSection): string {
  switch (section) {
    case "today":
      return NOTIFICATIONS_DESKTOP_SECTION_TODAY;
    case "this_week":
      return NOTIFICATIONS_DESKTOP_SECTION_THIS_WEEK;
    default:
      return NOTIFICATIONS_DESKTOP_SECTION_EARLIER;
  }
}

export function formatNotificationDesktopTime(iso: string, now = Date.now()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";

  const section = resolveNotificationDesktopDateSection(iso, now);
  if (section === "today") {
    const diffMs = now - date.getTime();
    const minutes = Math.floor(diffMs / 60_000);
    if (minutes < 1) return "À l'instant";
    if (minutes < 60) return `Il y a ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    return `Il y a ${hours} h`;
  }

  if (section === "this_week") {
    const dayDiff = Math.round(
      (new Date(now).setHours(0, 0, 0, 0) - new Date(date).setHours(0, 0, 0, 0)) / 86_400_000,
    );
    if (dayDiff === 1) return "Hier";
    return date.toLocaleDateString("fr-FR", { weekday: "short" });
  }

  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function resolveNotificationDesktopIconTone(item: UserNotificationItem): NotificationsDesktopIconTone {
  const category = notificationCategory(item);
  if (item.type === "LOCAL_EVENT_PUBLISHED" || category === "events") return "events";
  if (item.type === "LOCAL_STAMP_EARNED" || category === "places" || category === "contributions") {
    return "contributions";
  }
  if (category === "offers") return "offers";
  if (
    item.type === "PASSPORT_LEVEL_UNLOCKED" ||
    category === "passport" ||
    category === "system" ||
    item.actor_id == null
  ) {
    return "status";
  }
  return "community";
}

function payloadTruthy(item: UserNotificationItem, key: string): boolean {
  const value = item.payload?.[key];
  return value === true || value === "true";
}

function buildNotificationDesktopTitle(item: UserNotificationItem): string {
  const actor = item.actor_name?.trim();
  const eventTitle = payloadString(item, "event_title");
  const stampTitle = payloadString(item, "stamp_title");
  const tierLabel = payloadString(item, "tier_label");
  const tribeName = payloadString(item, "tribe_name");

  switch (item.type) {
    case "LOCAL_EVENT_PUBLISHED":
      if (payloadTruthy(item, "starts_tomorrow")) {
        return "Votre sortie commence demain";
      }
      return eventTitle ? `Nouvel événement : ${eventTitle}` : "Un événement local vient d'être publié";
    case "POST_LIKED":
      return actor ? `${actor} a aimé votre publication` : "Votre publication a reçu un like";
    case "POST_COMMENTED":
      return actor ? `${actor} a commenté votre publication` : "Nouveau commentaire sur votre publication";
    case "LOCAL_STAMP_EARNED":
      return stampTitle ? `Nouvelle contribution : ${stampTitle}` : "Contribution locale enregistrée";
    case "PASSPORT_LEVEL_UNLOCKED":
      return tierLabel ? `Niveau Passport ${tierLabel} débloqué` : "Votre Passport progresse";
    default:
      if (tribeName) return `Activité dans ${tribeName}`;
      return actor ? `${actor} — activité locale` : "Notification Yunicity";
  }
}

function buildNotificationDesktopDetail(item: UserNotificationItem): string {
  const eventVenue = payloadString(item, "event_venue") ?? payloadString(item, "venue_name");
  const eventTime = payloadString(item, "event_time") ?? payloadString(item, "starts_at_label");
  const neighborhood = payloadString(item, "neighborhood_name") ?? payloadString(item, "city");

  if (item.type === "LOCAL_EVENT_PUBLISHED" && (eventVenue || eventTime || neighborhood)) {
    return [eventVenue, eventTime, neighborhood].filter(Boolean).join(" · ");
  }

  const excerpt = payloadString(item, "post_excerpt") ?? payloadString(item, "comment_excerpt");
  if (excerpt) return excerpt;

  return formatNotificationMessage(item.type, item.actor_name, item.payload);
}

function buildNotificationDesktopActionLabel(item: UserNotificationItem): string {
  const category = notificationCategory(item);
  if (item.type === "LOCAL_EVENT_PUBLISHED" || category === "events") {
    return NOTIFICATIONS_DESKTOP_ACTION_VIEW_EVENT;
  }
  if (payloadString(item, "tribe_name") || category === "social") {
    if (payloadString(item, "tribe_name")) return NOTIFICATIONS_DESKTOP_ACTION_OPEN_TRIBE;
    if (item.type === "POST_LIKED" || item.type === "POST_COMMENTED") {
      return NOTIFICATIONS_DESKTOP_ACTION_VIEW_POST;
    }
  }
  if (item.type === "LOCAL_STAMP_EARNED" || category === "contributions" || category === "places") {
    return NOTIFICATIONS_DESKTOP_ACTION_VIEW_CONTRIBUTION;
  }
  if (category === "offers") return NOTIFICATIONS_DESKTOP_ACTION_VIEW_OFFER;
  if (item.type === "PASSPORT_LEVEL_UNLOCKED" || category === "passport") {
    return NOTIFICATIONS_DESKTOP_ACTION_VIEW_PASSPORT;
  }
  return NOTIFICATIONS_DESKTOP_ACTION_VIEW_DETAIL;
}

export function buildNotificationDesktopRow(
  item: UserNotificationItem,
  href: string,
  now = Date.now(),
): NotificationsDesktopRow {
  return {
    id: item.id,
    title: buildNotificationDesktopTitle(item),
    detail: buildNotificationDesktopDetail(item),
    timeLabel: formatNotificationDesktopTime(item.created_at, now),
    href,
    isRead: item.is_read,
    actionLabel: buildNotificationDesktopActionLabel(item),
    iconTone: resolveNotificationDesktopIconTone(item),
  };
}

const SECTION_ORDER: NotificationsDesktopDateSection[] = ["today", "this_week", "earlier"];

export function groupNotificationDesktopRows(
  rows: NotificationsDesktopRow[],
  sourceItems: UserNotificationItem[],
  options?: { includeEarlier?: boolean },
): NotificationsDesktopGroupedSection[] {
  const includeEarlier = options?.includeEarlier ?? false;
  const byId = new Map(sourceItems.map((item) => [item.id, item]));
  const buckets = new Map<NotificationsDesktopDateSection, NotificationsDesktopRow[]>();

  for (const row of rows) {
    const source = byId.get(row.id);
    const section = source
      ? resolveNotificationDesktopDateSection(source.created_at)
      : "earlier";
    if (section === "earlier" && !includeEarlier) continue;
    const list = buckets.get(section) ?? [];
    list.push(row);
    buckets.set(section, list);
  }

  return SECTION_ORDER.filter((section) => {
    if (section === "earlier" && !includeEarlier) return false;
    return (buckets.get(section)?.length ?? 0) > 0;
  }).map((section) => ({
    section,
    label: notificationDesktopSectionLabel(section),
    items: buckets.get(section) ?? [],
  }));
}

export function countNotificationDesktopDisplayedRecent(
  items: UserNotificationItem[],
  now = Date.now(),
): number {
  return items.filter((item) => {
    const section = resolveNotificationDesktopDateSection(item.created_at, now);
    return section === "today" || section === "this_week";
  }).length;
}

export function hasNotificationDesktopEarlierItems(
  items: UserNotificationItem[],
  now = Date.now(),
): boolean {
  return items.some((item) => resolveNotificationDesktopDateSection(item.created_at, now) === "earlier");
}

export function buildNotificationDesktopHighlights(
  items: UserNotificationItem[],
  hrefResolver: (item: UserNotificationItem) => string,
  limit = 2,
  now = Date.now(),
): NotificationsDesktopHighlight[] {
  const candidates = items
    .filter((item) => !item.is_read)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return candidates.slice(0, limit).map((item) => ({
    id: item.id,
    title: buildNotificationDesktopTitle(item),
    detail: buildNotificationDesktopDetail(item),
    timeLabel: formatNotificationDesktopTime(item.created_at, now),
    href: hrefResolver(item),
    iconTone: resolveNotificationDesktopIconTone(item),
  }));
}
