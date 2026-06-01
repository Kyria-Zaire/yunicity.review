import { describe, expect, it } from "vitest";

import type { PartnerOfferPublic } from "@yunicity/types";

import {
  assertNoInternalOfferFields,
  buildPartnerOfferHref,
  formatPartnerOfferValidity,
  isPartnerOfferActive,
  partnerOfferBadgeLabel,
  partnerOfferTypeLabel,
} from "./partner-offer-public";

const BASE: PartnerOfferPublic = {
  id: "1",
  title: "Accueil Passport",
  slug: "belga-queen-accueil-passport",
  description: "Description pilote",
  value_label: "Avantage membre",
  offer_type: "custom",
  conditions: "Sur place",
  valid_from: null,
  valid_until: "2099-12-31T00:00:00Z",
  is_featured: true,
  tier_code_required: null,
  partner: {
    name: "Belga Queen",
    slug: "belga-queen",
    logo_url: null,
    cover_image_url: null,
    category: "nightlife",
    city: "Reims",
    is_verified: true,
    partner_status: "active",
  },
};

describe("partner-offer-public", () => {
  it("labels offer type and badge from value_label", () => {
    expect(partnerOfferTypeLabel("custom")).toBeTruthy();
    expect(partnerOfferBadgeLabel(BASE)).toBe("Avantage membre");
  });

  it("detects active vs expired offers", () => {
    expect(isPartnerOfferActive(BASE)).toBe(true);
    expect(
      isPartnerOfferActive({ ...BASE, valid_until: "2020-01-01T00:00:00Z" }),
    ).toBe(false);
  });

  it("formats validity in French", () => {
    expect(formatPartnerOfferValidity(BASE)).toContain("2099");
  });

  it("builds partner detail href with offer anchor", () => {
    expect(buildPartnerOfferHref(BASE)).toBe(
      "/places/belga-queen?city=Reims#passport-offer-belga-queen-accueil-passport",
    );
  });

  it("rejects internal field names in public payloads", () => {
    expect(() => assertNoInternalOfferFields({ title: "x", max_redemptions_total: 1 })).toThrow();
    expect(() => assertNoInternalOfferFields({ title: "x" })).not.toThrow();
  });
});
