import type { LocalEvent, Neighborhood, Tribe } from "@yunicity/types";
import type { NotificationInboxTab } from "@yunicity/types";

import {
  NOTIFICATIONS_EMPTY_BODY_CALM,
  NOTIFICATIONS_EMPTY_BODY_EVENTS,
  NOTIFICATIONS_EMPTY_BODY_MENTIONS,
  NOTIFICATIONS_EMPTY_BODY_PASSPORT,
  NOTIFICATIONS_EMPTY_BODY_SOCIAL,
  NOTIFICATIONS_EMPTY_BODY_SYSTEM,
  NOTIFICATIONS_EMPTY_FALLBACK_HINT_EVENTS,
  NOTIFICATIONS_EMPTY_FALLBACK_HINT_PASSPORT,
  NOTIFICATIONS_EMPTY_FALLBACK_HINT_TRIBES,
  NOTIFICATIONS_EMPTY_TITLE,
  NOTIFICATIONS_METRIC_MONTH_ZERO,
  NOTIFICATIONS_METRIC_UNREAD_ZERO,
  NOTIFICATIONS_METRIC_WEEK_ZERO,
} from "./notifications-page-labels";
import { notificationEmptyMessage } from "./notifications-inbox-utils";

export type NotificationLocalHint = {
  id: string;
  label: string;
  href: string;
};

export type NotificationEmptyStateView = {
  title: string;
  body: string;
  suggestions: NotificationLocalHint[];
};

export type NotificationLocalHintsInput = {
  events: LocalEvent[];
  tribes: Tribe[];
  neighborhoods: Neighborhood[];
  offerTitles: string[];
};

const BANNED_METRIC_PATTERN =
  /leaderboard|classement|#\d+\s*(sur|\/)\s*\d+|top\s*\d+/i;

export function formatActivityMetric(
  count: number | null | undefined,
  kind: "unread" | "week" | "month",
): string {
  const safe = typeof count === "number" && Number.isFinite(count) ? Math.max(0, count) : 0;
  if (safe > 0) {
    return new Intl.NumberFormat("fr-FR").format(safe);
  }
  switch (kind) {
    case "unread":
      return NOTIFICATIONS_METRIC_UNREAD_ZERO;
    case "week":
      return NOTIFICATIONS_METRIC_WEEK_ZERO;
    case "month":
      return NOTIFICATIONS_METRIC_MONTH_ZERO;
    default:
      return "—";
  }
}

export function shouldShowUnreadBadge(count: number): boolean {
  return count > 0;
}

export function buildFallbackLocalHints(): NotificationLocalHint[] {
  return [
    {
      id: "fallback-events",
      label: NOTIFICATIONS_EMPTY_FALLBACK_HINT_EVENTS,
      href: "/events",
    },
    {
      id: "fallback-tribes",
      label: NOTIFICATIONS_EMPTY_FALLBACK_HINT_TRIBES,
      href: "/tribes",
    },
    {
      id: "fallback-passport",
      label: NOTIFICATIONS_EMPTY_FALLBACK_HINT_PASSPORT,
      href: "/passport",
    },
  ];
}

export function resolveEmptyStateSuggestions(
  territoryHints: NotificationLocalHint[],
): NotificationLocalHint[] {
  if (territoryHints.length > 0) {
    return territoryHints.slice(0, 3);
  }
  return buildFallbackLocalHints();
}

export function buildNotificationEmptyState(
  tab: NotificationInboxTab,
  localHints: NotificationLocalHint[],
): NotificationEmptyStateView {
  const bodyByTab: Record<NotificationInboxTab, string> = {
    all: NOTIFICATIONS_EMPTY_BODY_CALM,
    unread: NOTIFICATIONS_EMPTY_BODY_CALM,
    mentions: NOTIFICATIONS_EMPTY_BODY_MENTIONS,
    social: NOTIFICATIONS_EMPTY_BODY_SOCIAL,
    events: NOTIFICATIONS_EMPTY_BODY_EVENTS,
    passport: NOTIFICATIONS_EMPTY_BODY_PASSPORT,
    offers: NOTIFICATIONS_EMPTY_BODY_PASSPORT,
    system: NOTIFICATIONS_EMPTY_BODY_SYSTEM,
    achievements: NOTIFICATIONS_EMPTY_BODY_CALM,
  };

  return {
    title: NOTIFICATIONS_EMPTY_TITLE,
    body: bodyByTab[tab] ?? notificationEmptyMessage(tab),
    suggestions: resolveEmptyStateSuggestions(localHints),
  };
}

export function buildLocalHintsFromTerritory(input: NotificationLocalHintsInput): NotificationLocalHint[] {
  const hints: NotificationLocalHint[] = [];
  const now = Date.now();

  const upcomingEvent = [...input.events]
    .filter((event) => {
      const starts = Date.parse(event.starts_at);
      return Number.isFinite(starts) && starts >= now && !event.is_cancelled;
    })
    .sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at))[0];

  if (upcomingEvent) {
    hints.push({
      id: `event-${upcomingEvent.id}`,
      label: `Moment à venir · ${upcomingEvent.title}`,
      href: `/events/${upcomingEvent.id}`,
    });
  }

  const activeTribe = input.tribes.find((tribe) => !tribe.is_archived);
  if (activeTribe && hints.length < 3) {
    hints.push({
      id: `tribe-${activeTribe.id}`,
      label: `Tribu · ${activeTribe.name}`,
      href: `/tribes/${encodeURIComponent(activeTribe.slug)}`,
    });
  }

  const neighborhood = input.neighborhoods[0];
  if (neighborhood && hints.length < 3) {
    hints.push({
      id: `neighborhood-${neighborhood.slug}`,
      label: `Quartier · ${neighborhood.display_name}`,
      href: `/neighborhoods/${encodeURIComponent(neighborhood.slug)}`,
    });
  }

  const offerTitle = input.offerTitles[0];
  if (offerTitle && hints.length < 3) {
    hints.push({
      id: `offer-${offerTitle}`,
      label: `Privilège · ${offerTitle}`,
      href: "/passport",
    });
  }

  return hints.slice(0, 3);
}

export function notificationsHumanizeHasNoFakeMetrics(texts: string[]): boolean {
  return texts.every((text) => !BANNED_METRIC_PATTERN.test(text));
}
