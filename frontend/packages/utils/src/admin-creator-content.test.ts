import { describe, expect, it } from "vitest";

import {
  ADMIN_CREATOR_CONTENT_STATUS_FILTER_OPTIONS,
  adminCreatorContentAuthorLabel,
  adminCreatorContentStatusLabel,
  buildCreatorContentDetailPathWithListContext,
  buildCreatorContentListBackPath,
  buildCreatorContentListPath,
  buildCreatorContentPublicPath,
  canAdminApproveCreatorContent,
  canAdminArchiveCreatorContent,
  canAdminRejectCreatorContent,
  canApproveCreatorContent,
  canArchiveCreatorContent,
  canRejectCreatorContent,
  countCreatorContentKpis,
  creatorContentAdminActionLabel,
  creatorContentApproveSideEffectCopy,
  creatorContentApproveSideEffectWarningCopy,
  creatorContentStatusBadgeVariant,
  formatCreatorContentAdminActionStatusTransition,
  creatorContentStatusLabel,
  formatCreatorContentPublishedAt,
  isCreatorContentMediaImageUrl,
  shouldShowCreatorContentApproveSideEffectWarning,
} from "./admin-creator-content";

describe("adminCreatorContentStatusLabel", () => {
  it("maps known statuses", () => {
    expect(adminCreatorContentStatusLabel("pending_review")).toContain("attente");
    expect(adminCreatorContentStatusLabel("published")).toBe("Publié");
    expect(adminCreatorContentStatusLabel("rejected")).toBe("Refusé");
  });
});

describe("creatorContentAdminActionLabel", () => {
  it("maps staff audit actions", () => {
    expect(creatorContentAdminActionLabel("approve")).toBe("Approbation");
    expect(creatorContentAdminActionLabel("reject")).toBe("Rejet");
    expect(creatorContentAdminActionLabel("archive")).toBe("Archivage");
  });
});

describe("formatCreatorContentAdminActionStatusTransition", () => {
  it("formats status labels with arrow", () => {
    expect(
      formatCreatorContentAdminActionStatusTransition("pending_review", "published"),
    ).toBe("En attente de validation → Publié");
    expect(formatCreatorContentAdminActionStatusTransition(null, null)).toBe("— → —");
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

describe("creator content capabilities", () => {
  it("exposes alias helpers aligned with workflow", () => {
    expect(canApproveCreatorContent("pending_review")).toBe(true);
    expect(canRejectCreatorContent("published")).toBe(true);
    expect(canArchiveCreatorContent("published")).toBe(true);
    expect(canArchiveCreatorContent("pending_review")).toBe(false);
  });

  it("matches canAdmin* helpers", () => {
    expect(canApproveCreatorContent("draft")).toBe(canAdminApproveCreatorContent("draft"));
    expect(canArchiveCreatorContent("published")).toBe(
      canAdminArchiveCreatorContent("published"),
    );
  });
});

describe("buildCreatorContentPublicPath", () => {
  it("builds place href with optional web base", () => {
    expect(buildCreatorContentPublicPath("belga", "Reims")).toBe("/places/belga?city=Reims");
    expect(buildCreatorContentPublicPath("belga", "Reims", "https://app.yunicity.fr")).toBe(
      "https://app.yunicity.fr/places/belga?city=Reims",
    );
  });
});

describe("approve side-effect copy", () => {
  it("warns when approve is available", () => {
    expect(shouldShowCreatorContentApproveSideEffectWarning("pending_review")).toBe(true);
    expect(shouldShowCreatorContentApproveSideEffectWarning("published")).toBe(false);
    expect(creatorContentApproveSideEffectWarningCopy).toContain("organisation");
    expect(creatorContentApproveSideEffectCopy).toContain("feed");
  });
});

describe("formatCreatorContentPublishedAt", () => {
  it("returns dash when not published", () => {
    expect(
      formatCreatorContentPublishedAt({
        status: "pending_review",
        submitted_at: "2026-06-01T10:00:00Z",
        updated_at: "2026-06-01T11:00:00Z",
      }),
    ).toBe("—");
  });
});

describe("isCreatorContentMediaImageUrl", () => {
  it("detects image extensions", () => {
    expect(isCreatorContentMediaImageUrl("https://cdn.example/a.jpg")).toBe(true);
    expect(isCreatorContentMediaImageUrl("https://cdn.example/doc.pdf")).toBe(false);
  });
});
