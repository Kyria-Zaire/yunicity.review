import type { PartnerPublic } from "@yunicity/types";
import { describe, expect, it } from "vitest";

import {
  assertPartnerPublicShape,
  isPublicPartner,
} from "./partner-labels";
import {
  buildPartnerPlaceCards,
  filterPartnerOffersForOrganization,
  hasPartnerCoordinates,
  partnerBadgeLabel,
  partnerContactActions,
  partnerMapHref,
  partnerPublicHref,
  resolvePartnerImage,
} from "./partner-detail";
import { buildPublicPlaceHref } from "./place-routing";

const BASE: PartnerPublic = {
  id: "p1",
  organization_id: "org-1",
  name: "Pittaya",
  slug: "pittaya",
  category: "asian_food",
  city: "Reims",
  description: "Cuisine asiatique",
  logo_url: "https://cdn.example/logo.png",
  cover_image_url: null,
  is_featured: true,
  partner_status: "active",
  partnership_type: "restaurant",
  public_partner_label: "Cuisine asiatique",
  address: null,
  postal_code: null,
  latitude: null,
  longitude: null,
  website_url: "https://pittaya.example",
  phone: "03 26 00 00 00",
  instagram_url: "https://instagram.com/pittaya",
  is_verified: true,
  created_at: "2025-10-15T12:00:00Z",
};

describe("partner-detail", () => {
  it("builds public href and map href", () => {
    expect(partnerPublicHref(BASE)).toBe("/places/pittaya?city=Reims");
    expect(partnerMapHref(BASE)).toBe("/map?partner=pittaya&city=Reims");
    expect(buildPublicPlaceHref("pittaya", "Reims")).toBe(partnerPublicHref(BASE));
  });

  it("detects missing coordinates", () => {
    expect(hasPartnerCoordinates(BASE)).toBe(false);
    expect(
      hasPartnerCoordinates({ latitude: 49.25, longitude: 4.03 }),
    ).toBe(true);
  });

  it("exposes map action disabled without coordinates", () => {
    const actions = partnerContactActions(BASE);
    const mapAction = actions.find((a) => a.id === "map");
    expect(mapAction?.disabled).toBe(true);
    expect(mapAction?.disabledReason).toMatch(/géolocalisée/i);
  });

  it("renders status badge labels", () => {
    expect(partnerBadgeLabel("active")).toBe("Partenaire Yunicity");
    expect(partnerBadgeLabel("founding_partner")).toBe("Partenaire fondateur");
    expect(partnerBadgeLabel("premium")).toBe("Partenaire premium");
  });

  it("builds partner cards for public partners only", () => {
    const cards = buildPartnerPlaceCards([
      BASE,
      { ...BASE, id: "p2", slug: "hidden", partner_status: "signed" },
    ]);
    expect(cards).toHaveLength(1);
    expect(cards[0]?.href).toBe("/places/pittaya?city=Reims");
    expect(isPublicPartner("signed")).toBe(false);
  });

  it("resolves hero image from logo fallback", () => {
    expect(resolvePartnerImage(BASE, "logo")).toBe("https://cdn.example/logo.png");
    expect(resolvePartnerImage(BASE, "hero")).toBeTruthy();
  });

  it("card variant prefers the logo over the (placeholder) banner", () => {
    const withBoth = {
      ...BASE,
      logo_url: "https://cdn.example/logo.png",
      cover_image_url: "https://cdn.example/banner.svg",
    };
    expect(resolvePartnerImage(withBoth, "card")).toBe("https://cdn.example/logo.png");
  });

  it("card variant falls back to the cover when there is no logo", () => {
    const coverOnly = {
      ...BASE,
      logo_url: null,
      cover_image_url: "https://cdn.example/banner.svg",
    };
    expect(resolvePartnerImage(coverOnly, "card")).toBe("https://cdn.example/banner.svg");
  });

  it("hero variant is unchanged: cover-first (full-screen partner banner)", () => {
    const withBoth = {
      ...BASE,
      logo_url: "https://cdn.example/logo.png",
      cover_image_url: "https://cdn.example/banner.svg",
    };
    expect(resolvePartnerImage(withBoth, "hero")).toBe("https://cdn.example/banner.svg");
  });

  it("filters offers by organization without inventing data", () => {
    const offers = filterPartnerOffersForOrganization(
      [
        {
          id: "o1",
          organization_id: "org-1",
          title: "Offre",
          description: null,
          offer_type: "drink",
          tier_code_required: null,
          valid_from: null,
          valid_until: null,
          organization: { id: "org-1", name: "Pittaya", slug: "pittaya", city: "Reims", logo_url: null },
        },
        {
          id: "o2",
          organization_id: "org-2",
          title: "Autre",
          description: null,
          offer_type: "discount",
          tier_code_required: null,
          valid_from: null,
          valid_until: null,
          organization: { id: "org-2", name: "Autre", slug: "autre", city: "Reims", logo_url: null },
        },
      ],
      "org-1",
    );
    expect(offers).toHaveLength(1);
    expect(offers[0]?.organization_id).toBe("org-1");
  });

  it("rejects internal fields on public shape", () => {
    expect(() => assertPartnerPublicShape({ ...BASE } as Record<string, unknown>)).not.toThrow();
  });
});
