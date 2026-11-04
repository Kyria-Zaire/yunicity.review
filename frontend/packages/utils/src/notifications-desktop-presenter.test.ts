import { describe, expect, it } from "vitest";

import type { UserNotificationItem } from "@yunicity/types";

import {
  buildNotificationDesktopRow,
  countNotificationDesktopDisplayedRecent,
  filterNotificationsForDesktop,
  groupNotificationDesktopRows,
  hasNotificationDesktopEarlierItems,
  notificationMatchesDesktopTypeFilter,
} from "./notifications-desktop-presenter";

function item(overrides: Partial<UserNotificationItem> = {}): UserNotificationItem {
  return {
    id: "n1",
    type: "LOCAL_EVENT_PUBLISHED",
    actor_id: "a1",
    actor_name: "Alice",
    target_post_id: null,
    deeplink: "/sortir/ev-1",
    payload: {
      category: "events",
      event_title: "Marché du Boulingrin",
      event_venue: "Marché du Boulingrin",
      event_time: "10:00",
      neighborhood_name: "Centre-ville",
      starts_tomorrow: true,
    },
    is_read: false,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

describe("notifications-desktop-presenter", () => {
  it("filtre les non lues", () => {
    const items = [item({ id: "a", is_read: false }), item({ id: "b", is_read: true })];
    expect(filterNotificationsForDesktop(items, "unread", "all")).toHaveLength(1);
  });

  it("filtre par type événement", () => {
    const items = [
      item(),
      item({ id: "n2", type: "POST_LIKED", payload: { category: "social" } }),
    ];
    expect(notificationMatchesDesktopTypeFilter(items[0]!, "events")).toBe(true);
    expect(filterNotificationsForDesktop(items, "all", "events")).toHaveLength(1);
  });

  it("construit une ligne desktop avec titre maquette", () => {
    const row = buildNotificationDesktopRow(item(), "/sortir/ev-1");
    expect(row.title).toBe("Votre sortie commence demain");
    expect(row.actionLabel).toBe("Voir l'événement");
    expect(row.iconTone).toBe("events");
  });

  it("groupe aujourd'hui et cette semaine sans plus tôt par défaut", () => {
    const now = Date.now();
    const today = new Date(now).toISOString();
    const week = new Date(now - 3 * 86_400_000).toISOString();
    const earlier = new Date(now - 10 * 86_400_000).toISOString();
    const source = [
      item({ id: "t", created_at: today }),
      item({ id: "w", created_at: week }),
      item({ id: "e", created_at: earlier }),
    ];
    const rows = source.map((entry) => buildNotificationDesktopRow(entry, "/x"));
    const grouped = groupNotificationDesktopRows(rows, source);
    expect(grouped.map((section) => section.section)).toEqual(["today", "this_week"]);
    expect(hasNotificationDesktopEarlierItems(source)).toBe(true);
  });

  it("compte les notifications récentes affichées", () => {
    const now = Date.now();
    const source = [
      item({ id: "t", created_at: new Date(now).toISOString() }),
      item({ id: "e", created_at: new Date(now - 10 * 86_400_000).toISOString() }),
    ];
    expect(countNotificationDesktopDisplayedRecent(source, now)).toBe(1);
  });
});
