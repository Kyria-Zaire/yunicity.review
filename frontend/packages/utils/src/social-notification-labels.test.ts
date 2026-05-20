import { describe, expect, it } from "vitest";

import { formatNotificationMessage } from "./social-notification-labels";

describe("social-notification-labels", () => {
  it("formats like without hype", () => {
    const msg = formatNotificationMessage("POST_LIKED", "Marie");
    expect(msg).not.toMatch(/viral|explose|🔥/i);
    expect(msg).toContain("aimé");
  });

  it("formats comment with actor", () => {
    expect(formatNotificationMessage("POST_COMMENTED", "Marie")).toContain("Marie");
  });

  it("formats local stamp without achievement tone", () => {
    const msg = formatNotificationMessage("LOCAL_STAMP_EARNED", null, {
      stamp_title: "Premier lieu découvert",
      city: "Reims",
    });
    expect(msg).not.toMatch(/unlocked|achievement|🔥|XP/i);
    expect(msg).toContain("Reims");
  });
});
