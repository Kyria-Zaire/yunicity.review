import { describe, expect, it } from "vitest";

import {
  ADMIN_CREATOR_CONTENT_STATUS_FILTER_OPTIONS,
  adminCreatorContentAuthorLabel,
  adminCreatorContentStatusLabel,
  canAdminApproveCreatorContent,
  canAdminRejectCreatorContent,
} from "./admin-creator-content";

describe("adminCreatorContentStatusLabel", () => {
  it("maps known statuses", () => {
    expect(adminCreatorContentStatusLabel("pending_review")).toContain("attente");
    expect(adminCreatorContentStatusLabel("published")).toBe("Publié");
    expect(adminCreatorContentStatusLabel("rejected")).toBe("Refusé");
  });
});

describe("admin creator content moderation actions", () => {
  it("allows approve only from pending_review", () => {
    expect(canAdminApproveCreatorContent("pending_review")).toBe(true);
    expect(canAdminApproveCreatorContent("draft")).toBe(false);
    expect(canAdminApproveCreatorContent("published")).toBe(false);
  });

  it("allows reject from pending or published", () => {
    expect(canAdminRejectCreatorContent("pending_review")).toBe(true);
    expect(canAdminRejectCreatorContent("published")).toBe(true);
    expect(canAdminRejectCreatorContent("draft")).toBe(false);
  });
});

describe("adminCreatorContentAuthorLabel", () => {
  it("prefers display name then email", () => {
    expect(
      adminCreatorContentAuthorLabel({
        id: "1",
        display_name: "Marie",
        email: "m@example.com",
      }),
    ).toBe("Marie");
    expect(
      adminCreatorContentAuthorLabel({
        id: "1",
        display_name: null,
        email: "belga@partner.yunicity.dev",
      }),
    ).toBe("belga@partner.yunicity.dev");
  });
});

describe("status filters", () => {
  it("includes pending_review and all", () => {
    const values = ADMIN_CREATOR_CONTENT_STATUS_FILTER_OPTIONS.map((o) => o.value);
    expect(values).toContain("");
    expect(values).toContain("pending_review");
    expect(values).toContain("published");
  });
});
