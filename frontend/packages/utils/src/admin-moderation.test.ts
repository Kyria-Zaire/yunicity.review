import { describe, expect, it } from "vitest";

import {
  adminReportReasonLabel,
  adminReportReporterLabel,
  adminReportStatusLabel,
  adminReportTargetTypeLabel,
  buildModerationDetailPath,
  buildModerationListPath,
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
  });
});
