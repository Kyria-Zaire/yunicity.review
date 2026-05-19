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
});
