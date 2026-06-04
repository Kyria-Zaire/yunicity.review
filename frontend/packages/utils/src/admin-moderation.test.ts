import { describe, expect, it } from "vitest";

import {
  adminReportReasonLabel,
  adminReportReporterLabel,
  adminReportSafetyGuidance,
  adminReportStatusLabel,
  adminReportTargetTypeLabel,
  buildModerationDetailPath,
  buildModerationListBackPath,
  buildModerationListPath,
  buildModerationReportDetailPath,
  canDismissReport,
  canResolveReport,
  formatReportDate,
  reportReasonLabel,
  reportResolutionActionCopy,
  reportResolutionStatusLabel,
  reportStatusLabel,
  shortReportId,
  targetTypeLabel,
  validateReportResolutionReason,
} from "./admin-moderation";
describe("adminReportStatusLabel", () => {
  it("maps known statuses", () => {
    expect(adminReportStatusLabel("pending")).toBe("En attente");
    expect(adminReportStatusLabel("dismissed")).toBe("Classé sans suite");
  });
});

describe("adminReportReasonLabel", () => {
  it("maps known reasons", () => {
    expect(adminReportReasonLabel("spam")).toBe("Spam");
    expect(adminReportReasonLabel("inappropriate")).toContain("inapproprié");
  });
});

describe("adminReportTargetTypeLabel", () => {
  it("maps post types", () => {
    expect(adminReportTargetTypeLabel("post")).toBe("Publication");
    expect(adminReportTargetTypeLabel("partner_creator")).toContain("créateur");
  });
});

describe("adminReportReporterLabel", () => {
  it("prefers display name", () => {
    expect(
      adminReportReporterLabel({
        display_name: "Marie",
        email: "m@example.com",
      }),
    ).toBe("Marie");
  });
});

describe("moderation paths", () => {
  it("defaults list path to pending", () => {
    expect(buildModerationListPath()).toBe("/moderation?status=pending");
    expect(buildModerationListPath({ status: "all", page: "2" })).toBe(
      "/moderation?status=all&page=2",
    );
  });

  it("builds detail path with list context", () => {
    const params = new URLSearchParams({ status: "pending", page: "1" });
    expect(buildModerationDetailPath("abc-123", params)).toBe(
      "/moderation/abc-123?status=pending&page=1",
    );
    expect(buildModerationReportDetailPath("abc-123", params)).toBe(
      "/moderation/abc-123?status=pending&page=1",
    );
  });

  it("builds list back path from search params", () => {
    const params = new URLSearchParams({
      status: "pending",
      reason: "spam",
      page: "2",
    });
    expect(buildModerationListBackPath(params)).toBe(
      "/moderation?status=pending&reason=spam&page=2",
    );
    expect(buildModerationListBackPath(null)).toBe("/moderation?status=pending");
  });
});

describe("07C helper aliases", () => {
  it("exposes stable label aliases", () => {
    expect(reportStatusLabel("pending")).toBe(adminReportStatusLabel("pending"));
    expect(reportReasonLabel("spam")).toBe(adminReportReasonLabel("spam"));
    expect(targetTypeLabel("post")).toBe(adminReportTargetTypeLabel("post"));
  });

  it("shortens report ids", () => {
    expect(shortReportId("abcdef12-3456")).toBe("abcdef12…");
    expect(shortReportId("short")).toBe("short");
  });

  it("formats report dates", () => {
    expect(formatReportDate(null)).toBe("—");
    expect(formatReportDate("2026-01-15T10:00:00.000Z")).not.toBe("—");
  });

  it("provides safety guidance per reason", () => {
    expect(adminReportSafetyGuidance("spam")).toContain("Vérifiez le contenu");
    expect(adminReportSafetyGuidance("other")).toContain("autre");
  });
});

describe("report resolution guards", () => {
  it("allows resolve only when pending", () => {
    expect(canResolveReport("pending")).toBe(true);
    expect(canResolveReport("reviewed")).toBe(false);
    expect(canResolveReport("dismissed")).toBe(false);
    expect(canResolveReport("action_taken")).toBe(false);
  });

  it("allows dismiss only when pending", () => {
    expect(canDismissReport("pending")).toBe(true);
    expect(canDismissReport("dismissed")).toBe(false);
  });
});

describe("validateReportResolutionReason", () => {
  it("requires reason when hide_post is true", () => {
    expect(validateReportResolutionReason("", true).valid).toBe(false);
    expect(validateReportResolutionReason("ab", true).valid).toBe(false);
    expect(validateReportResolutionReason("abc", true)).toEqual({
      valid: true,
      normalized: "abc",
    });
  });

  it("allows optional note when hide_post is false", () => {
    expect(validateReportResolutionReason("", false)).toEqual({
      valid: true,
      normalized: null,
    });
    expect(validateReportResolutionReason("  note  ", false)).toEqual({
      valid: true,
      normalized: "note",
    });
  });
});

describe("reportResolutionActionCopy", () => {
  it("returns French copy for staff actions", () => {
    expect(reportResolutionActionCopy("dismiss").title).toContain("sans suite");
    expect(reportResolutionActionCopy("dismiss").confirmLabel).toBe("Classer sans suite");
    expect(reportResolutionActionCopy("resolve_hide").description).toContain("feed");
  });

  it("maps resolution status labels via status helper", () => {
    expect(reportResolutionStatusLabel("action_taken")).toBe("Action prise");
  });
});
