import { describe, expect, it } from "vitest";

import {
  ADMIN_OFFER_STATUS_LABELS,
  buildOfferDetailPath,
  buildOffersListPath,
  offerStatusBadgeVariant,
  offerStatusLabel,
} from "./admin-offer";

describe("admin-offer helpers", () => {
  it("labels offer statuses for staff", () => {
    expect(offerStatusLabel("pending_review")).toBe("En attente de validation");
    expect(offerStatusLabel("published")).toBe("Publiée");
    expect(ADMIN_OFFER_STATUS_LABELS.archived).toBe("Archivée");
  });

  it("maps badge variants", () => {
    expect(offerStatusBadgeVariant("draft")).toBe("neutral");
    expect(offerStatusBadgeVariant("published")).toBe("success");
    expect(offerStatusBadgeVariant("archived")).toBe("muted");
  });

  it("builds detail path", () => {
    expect(buildOfferDetailPath("abc-123")).toBe("/passport-offers/abc-123");
  });

  it("builds list path with query", () => {
    expect(buildOffersListPath()).toBe("/passport-offers");
    expect(buildOffersListPath({ status: "pending_review" })).toBe(
      "/passport-offers?status=pending_review",
    );
    expect(buildOffersListPath({ organization_id: "org-1", page: "2" })).toBe(
      "/passport-offers?organization_id=org-1&page=2",
    );
  });
});
