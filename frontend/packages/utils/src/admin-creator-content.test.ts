import { describe, expect, it } from "vitest";

import {
  ADMIN_CREATOR_CONTENT_STATUS_FILTER_OPTIONS,
  adminCreatorContentAuthorLabel,
  adminCreatorContentStatusLabel,
  buildCreatorContentDetailPathWithListContext,
  buildCreatorContentListBackPath,
  buildCreatorContentListPath,
  canAdminApproveCreatorContent,
  canAdminRejectCreatorContent,
  countCreatorContentKpis,
  creatorContentStatusBadgeVariant,
  creatorContentStatusLabel,
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
        display_name: "Marie",
        email: "m@example.com",
      }),
    ).toBe("Marie");
    expect(
      adminCreatorContentAuthorLabel({
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

describe("creator content paths", () => {
  it("builds list path with query params", () => {
    expect(
      buildCreatorContentListPath({
        status: "pending_review",
        organization_id: "org-1",
        page: "2",
      }),
    ).toBe("/creator-content?status=pending_review&organization_id=org-1&page=2");
  });

  it("preserves list context on detail and back navigation", () => {
    const listQuery = new URLSearchParams({
      status: "pending_review",
      page: "2",
    });
    const detail = buildCreatorContentDetailPathWithListContext("abc-123", listQuery);
    expect(detail).toBe("/creator-content/abc-123?status=pending_review&page=2");
    const back = new URLSearchParams(detail.split("?")[1] ?? "");
    expect(buildCreatorContentListBackPath(back)).toBe(
      "/creator-content?status=pending_review&page=2",
    );
  });
});

describe("creatorContentStatusLabel", () => {
  it("maps published to approved wording for KPIs", () => {
    expect(creatorContentStatusLabel("published")).toBe("Approuvé");
    expect(creatorContentStatusLabel("pending_review")).toContain("attente");
  });
});

describe("creatorContentStatusBadgeVariant", () => {
  it("returns known variants", () => {
    expect(creatorContentStatusBadgeVariant("rejected")).toBe("rejected");
    expect(creatorContentStatusBadgeVariant("unknown-status")).toBe("unknown");
  });
});

describe("countCreatorContentKpis", () => {
  it("counts statuses on loaded items", () => {
    const counts = countCreatorContentKpis([
      { status: "pending_review" },
      { status: "published" },
      { status: "published" },
      { status: "rejected" },
    ]);
    expect(counts.total).toBe(4);
    expect(counts.pendingReview).toBe(1);
    expect(counts.approved).toBe(2);
    expect(counts.rejected).toBe(1);
  });
});
