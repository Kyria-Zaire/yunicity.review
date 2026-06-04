import { describe, expect, it } from "vitest";

import {
  ADMIN_OFFER_STATUS_LABELS,
  buildOfferDetailPath,
  buildOfferDetailPathWithListContext,
  buildOffersListBackPath,
  buildOffersListPath,
  buildPartnerDetailPath,
  canApproveOffer,
  canArchiveOffer,
  canRejectOffer,
  offerRedemptionChannelLabel,
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

  it("gates moderation actions by workflow status", () => {
    expect(canApproveOffer("pending_review")).toBe(true);
    expect(canApproveOffer("published")).toBe(false);
    expect(canRejectOffer("pending_review")).toBe(true);
    expect(canRejectOffer("published")).toBe(false);
    expect(canArchiveOffer("published")).toBe(true);
    expect(canArchiveOffer("draft")).toBe(false);
  });

  it("builds detail and partner paths", () => {
    expect(buildOfferDetailPath("abc-123")).toBe("/passport-offers/abc-123");
    expect(buildPartnerDetailPath("org-1")).toBe("/partners/organizations/org-1");
    expect(
      buildOfferDetailPathWithListContext("offer-1", { status: "pending_review", page: "2" }),
    ).toBe("/passport-offers/offer-1?status=pending_review&page=2");
  });

  it("builds list path with query", () => {
    expect(buildOffersListPath()).toBe("/passport-offers");
    expect(buildOffersListPath({ status: "pending_review" })).toBe(
      "/passport-offers?status=pending_review",
    );
  });

  it("rebuilds list back path from detail context", () => {
    const params = new URLSearchParams("status=published&organization_id=org-1&page=2");
    expect(buildOffersListBackPath(params)).toBe(
      "/passport-offers?status=published&organization_id=org-1&page=2",
    );
  });

  it("labels redemption channels for staff", () => {
    expect(offerRedemptionChannelLabel("self")).toBe("App citoyen");
    expect(offerRedemptionChannelLabel("scan")).toBe("Scan partenaire");
    expect(offerRedemptionChannelLabel("unknown")).toBe("Inconnu");
  });
});
