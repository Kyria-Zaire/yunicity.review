import { describe, expect, it } from "vitest";

import {
  buildAdminEventDetailPath,
  buildEventsListBackPath,
  buildEventsListPath,
  canAdminApproveEvent,
  canAdminRejectEvent,
  canCancelEvent,
  eventAdminActionLabel,
  eventCancelledBadgeLabel,
  eventCancelWarningCopy,
  eventModerationStatusLabel,
  eventTemporalStatus,
  eventTemporalStatusLabel,
  eventVisibilityLabel,
  formatEventAdminActionStatusTransition,
  formatEventDate,
  validateEventCancelReason,
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

  it("labels event admin audit actions", () => {
    expect(eventAdminActionLabel("approve")).toBe("Approbation");
    expect(eventAdminActionLabel("reject")).toBe("Rejet");
    expect(eventAdminActionLabel("cancel")).toBe("Annulation");
  });

  it("gates cancel for approved non-cancelled events only", () => {
    expect(
      canCancelEvent({ moderation_status: "approved", is_cancelled: false }),
    ).toBe(true);
    expect(
      canCancelEvent({ moderation_status: "pending_review", is_cancelled: false }),
    ).toBe(false);
    expect(canCancelEvent({ moderation_status: "rejected", is_cancelled: false })).toBe(
      false,
    );
    expect(canCancelEvent({ moderation_status: "approved", is_cancelled: true })).toBe(
      false,
    );
  });

  it("blocks approve/reject when event is cancelled", () => {
    expect(canAdminApproveEvent("pending_review", true)).toBe(false);
    expect(canAdminRejectEvent("approved", true)).toBe(false);
    expect(canAdminApproveEvent("pending_review", false)).toBe(true);
    expect(canAdminRejectEvent("approved", false)).toBe(true);
  });

  it("validates cancel reason length", () => {
    expect(validateEventCancelReason("")).toBe("Le motif est obligatoire.");
    expect(validateEventCancelReason("ab")).toBe(
      "Le motif doit contenir au moins 3 caractères.",
    );
    expect(validateEventCancelReason("Motif valide")).toBeNull();
  });

  it("exposes cancel copy constants", () => {
    expect(eventCancelledBadgeLabel).toBe("Annulé");
    expect(eventCancelWarningCopy).toContain("410");
  });

  it("formats event admin action status transitions", () => {
    expect(formatEventAdminActionStatusTransition("pending_review", "approved")).toBe(
      "En attente de validation → Approuvé",
    );
    expect(formatEventAdminActionStatusTransition(null, null)).toBe("— → —");
  });
});
