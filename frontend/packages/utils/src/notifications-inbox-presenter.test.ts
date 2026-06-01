import { describe, expect, it } from "vitest";

import type { UserNotificationItem } from "@yunicity/types";

import {
  formatNotificationInboxTime,
  getNotificationPresentation,
} from "./notifications-inbox-presenter";

function item(overrides: Partial<UserNotificationItem> = {}): UserNotificationItem {
  return {
    id: "n1",
    type: "POST_LIKED",
    actor_id: "a1",
    actor_name: "Alice",
    target_post_id: "p1",
    deeplink: "/feed?post=p1",
    payload: { category: "social" },
    is_read: false,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

describe("notifications-inbox-presenter", () => {
  it("présente un like social", () => {
    const view = getNotificationPresentation(item());
    expect(view.title).toBe("Publication appréciée");
    expect(view.actionLabel).toBe("Voir la publication");
  });

  it("formate l'heure du jour", () => {
    const now = new Date();
    const label = formatNotificationInboxTime(now.toISOString());
    expect(label).toMatch(/\d{2}:\d{2}/);
  });
});
