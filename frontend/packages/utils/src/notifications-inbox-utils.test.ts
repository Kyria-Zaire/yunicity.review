import { describe, expect, it } from "vitest";

import { notificationEmptyMessage, notificationTabLabel, filterNotificationsByTab } from "./notifications-inbox-utils";
import type { UserNotificationItem } from "@yunicity/types";

describe("notifications-inbox-utils", () => {
  it("retourne un libellé par onglet", () => {
    expect(notificationTabLabel("social")).toBe("Fil social");
    expect(notificationTabLabel("passport")).toBe("Passport");
  });

  it("message vide honnête pour mentions", () => {
    expect(notificationEmptyMessage("mentions")).toContain("mentions");
  });

  it("filtre les notifications par onglet côté client", () => {
    const items: UserNotificationItem[] = [
      {
        id: "1",
        type: "POST_LIKED",
        actor_id: "a",
        actor_name: "Alice",
        target_post_id: "p1",
        deeplink: "/feed?post=p1",
        payload: { category: "social" },
        is_read: false,
        created_at: "2026-06-01T10:00:00Z",
      },
      {
        id: "2",
        type: "LOCAL_STAMP_EARNED",
        actor_id: null,
        actor_name: null,
        target_post_id: null,
        deeplink: "/passport",
        payload: { category: "passport" },
        is_read: true,
        created_at: "2026-06-01T09:00:00Z",
      },
    ];

    expect(filterNotificationsByTab(items, "social")).toHaveLength(1);
    expect(filterNotificationsByTab(items, "passport")).toHaveLength(1);
    expect(filterNotificationsByTab(items, "unread")).toHaveLength(1);
  });
});
