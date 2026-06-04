import { describe, expect, it } from "vitest";

import {
  buildAdminEventDetailPath,
  buildEventsListBackPath,
  buildEventsListPath,
  eventModerationStatusLabel,
  eventTemporalStatus,
  eventTemporalStatusLabel,
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

  it("builds list back path from detail query context", () => {
    const params = new URLSearchParams("status=approved&city=Lyon&page=2");
    expect(buildEventsListBackPath(params)).toBe("/events?status=approved&city=Lyon&page=2");
  });

  it("resolves temporal status from schedule", () => {
    const now = new Date("2026-06-15T12:00:00.000Z");
    expect(
      eventTemporalStatus("2026-06-20T12:00:00.000Z", "2026-06-21T12:00:00.000Z", now),
    ).toBe("upcoming");
    expect(
      eventTemporalStatus("2026-06-10T12:00:00.000Z", "2026-06-20T12:00:00.000Z", now),
    ).toBe("ongoing");
    expect(
      eventTemporalStatus("2026-06-01T12:00:00.000Z", "2026-06-10T12:00:00.000Z", now),
    ).toBe("past");
    expect(eventTemporalStatusLabel("upcoming")).toBe("À venir");
  });
});
