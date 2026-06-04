import { describe, expect, it } from "vitest";

import {
  buildAdminEventDetailPath,
  buildEventsListPath,
  eventModerationStatusLabel,
  eventVisibilityLabel,
  formatEventDate,
} from "./admin-event";

describe("admin-event helpers", () => {
  it("labels moderation statuses for staff", () => {
    expect(eventModerationStatusLabel("pending_review")).toBe("En attente de validation");
    expect(eventModerationStatusLabel("approved")).toBe("Approuvé");
    expect(eventModerationStatusLabel("rejected")).toBe("Rejeté");
  });

  it("labels visibility", () => {
    expect(eventVisibilityLabel("public")).toBe("Public");
    expect(eventVisibilityLabel(null)).toBe("Public");
  });

  it("formats event dates", () => {
    expect(formatEventDate(null)).toBe("—");
    expect(formatEventDate("2026-06-15T18:00:00.000Z")).not.toBe("—");
  });

  it("builds admin event paths", () => {
    expect(buildAdminEventDetailPath("evt-1")).toBe("/events/evt-1");
    expect(buildEventsListPath({ status: "pending_review" })).toBe(
      "/events?status=pending_review",
    );
    expect(buildEventsListPath()).toBe("/events");
  });
});
