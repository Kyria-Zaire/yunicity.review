import { describe, expect, it } from "vitest";

import type { UserNotificationItem } from "@yunicity/types";

import { buildNotificationMediumSummaryCards } from "./notifications-medium-presenter";

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
      starts_tomorrow: true,
    },
    is_read: false,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

describe("notifications-medium-presenter", () => {
  it("construit 3 cartes résumé (non lues · événement · offre)", () => {
    const items = [
      item(),
      item({
        id: "o1",
        type: "POST_LIKED",
        deeplink: "/passport/offre/1",
        payload: { category: "offers", offer_title: "Pittaya", expires_label: "expire à 19:00" },
      }),
    ];
    const cards = buildNotificationMediumSummaryCards({
      items,
      unreadCount: 2,
      hrefResolver: (entry) => entry.deeplink ?? "/",
    });
    expect(cards).toHaveLength(3);
    expect(cards[0]!.kind).toBe("unread");
    expect(cards[0]!.title).toContain("2");
    expect(cards[1]!.kind).toBe("event");
    expect(cards[1]!.title).toContain("Boulingrin");
    expect(cards[2]!.kind).toBe("offer");
    expect(cards[2]!.title).toContain("Pittaya");
  });
});
