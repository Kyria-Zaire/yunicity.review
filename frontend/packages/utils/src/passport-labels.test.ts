import { describe, expect, it } from "vitest";

import {
  PARTNER_OFFER_STATUS_LABELS,
  PARTNER_OFFER_STATUS_MICROCOPY,
  PARTNER_OFFER_TYPE_LABELS,
  canEditPartnerOffer,
  canSubmitPartnerOffer,
} from "./passport-labels";
import { canManagePartnerOffers } from "./partner-offer-access";
import type { OrganizationMeItem } from "@yunicity/types";

describe("PARTNER_OFFER_STATUS_LABELS", () => {
  it("couvre les statuts workflow 305A", () => {
    expect(PARTNER_OFFER_STATUS_LABELS.draft).toBe("Brouillon");
    expect(PARTNER_OFFER_STATUS_LABELS.pending_review).toBe("En attente de validation");
    expect(PARTNER_OFFER_STATUS_LABELS.published).toBe("Visible dans Yunicity");
    expect(PARTNER_OFFER_STATUS_LABELS.rejected).toBe("À ajuster");
  });
});

describe("PARTNER_OFFER_STATUS_MICROCOPY", () => {
  it("expose des messages humains pour le partenaire", () => {
    expect(PARTNER_OFFER_STATUS_MICROCOPY.pending_review).toContain("Yunicity");
    expect(PARTNER_OFFER_STATUS_MICROCOPY.published).toContain("Reims");
    expect(PARTNER_OFFER_STATUS_MICROCOPY.rejected).toContain("ajustements");
  });
});

describe("PARTNER_OFFER_TYPE_LABELS", () => {
  it("expose les libellés français des types MVP", () => {
    expect(PARTNER_OFFER_TYPE_LABELS.drink).toBe("Boisson");
    expect(PARTNER_OFFER_TYPE_LABELS.event_access).toBe("Événement");
    expect(Object.keys(PARTNER_OFFER_TYPE_LABELS)).toHaveLength(6);
  });
});

describe("canEditPartnerOffer", () => {
  it("autorise brouillon et rejeté", () => {
    expect(canEditPartnerOffer("draft")).toBe(true);
    expect(canEditPartnerOffer("rejected")).toBe(true);
    expect(canEditPartnerOffer("published")).toBe(false);
  });
});

describe("canSubmitPartnerOffer", () => {
  it("autorise soumission depuis brouillon ou rejeté", () => {
    expect(canSubmitPartnerOffer("draft")).toBe(true);
    expect(canSubmitPartnerOffer("pending_review")).toBe(false);
  });
});

describe("canManagePartnerOffers", () => {
  const base: OrganizationMeItem = {
    id: "1",
    slug: "cafe",
    name: "Café",
    type: "commerce",
    city: "Reims",
    verification_status: "verified",
    visibility: "public",
    onboarding_completed: true,
    member_role: "owner",
    member_status: "active",
  };

  it("refuse org non vérifiée", () => {
    expect(
      canManagePartnerOffers({ ...base, verification_status: "pending" }),
    ).toBe(false);
  });

  it("refuse membre staff sans droits offre", () => {
    expect(canManagePartnerOffers({ ...base, member_role: "staff" })).toBe(false);
  });

  it("accepte owner org vérifiée", () => {
    expect(canManagePartnerOffers(base)).toBe(true);
  });
});
