import type { PartnerPublic } from "@yunicity/types";
import { describe, expect, it } from "vitest";

import {
  assertPartnerPublicShape,
  isPublicPartner,
  partnerDisplayCategory,
  partnerStatusLabel,
  partnerTypeLabel,
} from "./partner-labels";

const SAMPLE: PartnerPublic = {
  id: "p1",
  organization_id: "o1",
  name: "Pittaya",
  slug: "pittaya",
  category: "asian_food",
  city: "Reims",
  description: null,
  logo_url: null,
  cover_image_url: null,
  is_featured: true,
  partner_status: "active",
  partnership_type: "restaurant",
  public_partner_label: "Cuisine asiatique",
  address: null,
  postal_code: null,
  latitude: null,
  longitude: null,
  website_url: null,
  phone: null,
  instagram_url: null,
  is_verified: true,
};

describe("partner-labels", () => {
  it("renders status label", () => {
    expect(partnerStatusLabel("active")).toBe("Partenaire actif");
    expect(partnerStatusLabel("signed")).toBe("Partenaire signé");
  });

  it("renders type label", () => {
    expect(partnerTypeLabel("restaurant")).toBe("Restaurant");
    expect(partnerTypeLabel("sports_club")).toBe("Club sportif");
  });

  it("detects public visibility", () => {
    expect(isPublicPartner("active")).toBe(true);
    expect(isPublicPartner("premium")).toBe(true);
    expect(isPublicPartner("founding_partner")).toBe(true);
    expect(isPublicPartner("signed")).toBe(false);
    expect(isPublicPartner("paused")).toBe(false);
  });

  it("displays category from partner data", () => {
    expect(partnerDisplayCategory(SAMPLE)).toBe("Cuisine asiatique");
    expect(
      partnerDisplayCategory({ category: null, partnership_type: "nightlife" }),
    ).toBe("Nightlife");
  });

  it("rejects internal fields on public type", () => {
    expect(() => assertPartnerPublicShape({ ...SAMPLE })).not.toThrow();
    expect(() =>
      assertPartnerPublicShape({ ...SAMPLE, notes_internal: "secret" } as Record<string, unknown>),
    ).toThrow(/notes_internal/);
  });
});
