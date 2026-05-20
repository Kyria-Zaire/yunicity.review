import { describe, expect, it } from "vitest";

import { resolveNotificationDeeplink } from "./notification-deeplink";

describe("resolveNotificationDeeplink", () => {
  it("falls back to feed", () => {
    expect(resolveNotificationDeeplink(null, "web")).toBe("/feed");
    expect(resolveNotificationDeeplink(undefined, "mobile")).toBe(
      "/(protected)/(tabs)/feed",
    );
  });

  it("maps mobile routes", () => {
    expect(resolveNotificationDeeplink("/passport", "mobile")).toBe(
      "/(protected)/(tabs)/passport",
    );
    expect(resolveNotificationDeeplink("/events", "mobile")).toBe(
      "/(protected)/(tabs)/events",
    );
    expect(
      resolveNotificationDeeplink(
        "/events/c5050000-0000-4000-8000-000000000001",
        "mobile",
      ),
    ).toBe("/(protected)/events/c5050000-0000-4000-8000-000000000001");
  });

  it("keeps web paths including query", () => {
    expect(resolveNotificationDeeplink("/feed?post=abc", "web")).toBe("/feed?post=abc");
  });
});
