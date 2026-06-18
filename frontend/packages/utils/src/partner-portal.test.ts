import { describe, expect, it } from "vitest";

import type { OrganizationMeItem, PartnerPublic } from "@yunicity/types";

import {
  buildPartnerPortalCreatorContentHref,
  buildPartnerPortalEventsHref,
  buildPartnerPortalOffersHref,
  buildPartnerPortalOverviewHref,
  buildPartnerPortalPublicHref,
  buildPartnerPortalQrHref,
  filterPartnerPortalOrganizations,
  isPartnerPortalManager,
  partnerPortalCreatorContentStatusLabel,
  partnerPortalModerationStatusLabel,
  partnerPortalOfferStatusLabel,
  partnerPortalReadinessChecklist,
  partnerPortalStatusLabel,
} from "./partner-portal";

const baseOrg: OrganizationMeItem = {
  id: "org-1",
  slug: "belga-queen",
  name: "Belga Queen",
  type: "commerce",
  city: "Reims",
  verification_status: "verified",
  visibility: "public",
  onboarding_completed: true,
  member_role: "owner",
  member_status: "active",
};

const basePartner: PartnerPublic = {
  id: "p1",
  organization_id: "org-1",
  name: "Belga Queen",
  slug: "belga-queen",
  public_partner_label: null,
  category: "nightlife",
  city: "Reims",
  description: "Brasserie",
  logo_url: "/logo.svg",
  cover_image_url: "/banner.svg",
  is_featured: true,
  partner_status: "active",
  partnership_type: "nightlife",
  address: "1 rue Test",
  postal_code: "51100",
  latitude: 49.25,
  longitude: 4.03,
  website_url: null,
  phone: null,
  instagram_url: null,
  is_verified: true,
  created_at: new Date().toISOString(),
};

describe("partner portal permissions", () => {
  it("filters manager organizations", () => {
    expect(isPartnerPortalManager(baseOrg)).toBe(true);
    expect(
      filterPartnerPortalOrganizations([
        baseOrg,
        { ...baseOrg, id: "x", member_role: "member" },
      ]),
    ).toHaveLength(1);
  });
});

describe("partner portal labels", () => {
  it("maps partner and moderation labels", () => {
    expect(partnerPortalStatusLabel(basePartner)).toContain("actif");
    expect(partnerPortalOfferStatusLabel("pending_review")).toContain("validation");
    expect(partnerPortalModerationStatusLabel("pending_review")).toContain("attente");
    expect(partnerPortalCreatorContentStatusLabel("draft")).toBe("Brouillon");
  });
});

describe("partner portal hrefs", () => {
  it("builds portal routes", () => {
    expect(buildPartnerPortalOverviewHref()).toBe("/organizations/me/partner");
    expect(buildPartnerPortalOffersHref()).toContain("/offers");
    expect(buildPartnerPortalEventsHref()).toContain("/events");
    expect(buildPartnerPortalCreatorContentHref()).toContain("/creator-content");
    expect(buildPartnerPortalQrHref()).toContain("/passport");
    expect(buildPartnerPortalPublicHref(basePartner)).toBe("/places/belga-queen?city=Reims");
  });
});

describe("partnerPortalReadinessChecklist", () => {
  it("marks items done when data present", () => {
    const items = partnerPortalReadinessChecklist({
      partner: basePartner,
      offers: [
        {
          id: "o1",
          organization_id: "org-1",
          title: "Offre",
          description: null,
          offer_type: "custom",
          offer_status: "published",
          is_active: true,
          tier_code_required: null,
          max_redemptions_total: null,
          redemption_limit: 1,
          valid_from: null,
          valid_until: null,
          redemptions_count: 0,
          created_by_user_id: null,
          moderated_by_user_id: null,
          moderated_at: null,
          rejection_reason: null,
          is_flash: false,
          flash_ends_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          readiness: {
            readiness: "partial",
            is_passport_eligible: false,
            is_placeholder: false,
            value_category: "exclusive_access",
            value_category_label: "Accès exclusif",
            human_description: "Accès exclusif — Offre",
            checks: [],
          },
        },
      ],
      publicOffers: [],
      events: [
        {
          id: "e1",
          organization_id: "org-1",
          title: "Afterwork",
          description: null,
          event_type: "partner_event",
          city: "Reims",
          district: null,
          starts_at: new Date().toISOString(),
          ends_at: null,
          timezone: "Europe/Paris",
          location_name: "Belga",
          address: null,
          latitude: null,
          longitude: null,
          cover_image_url: null,
          moderation_status: "approved",
          is_cancelled: false,
          interested_by_me: false,
          organization: null,
          created_at: new Date().toISOString(),
        },
      ],
      creatorContents: [
        {
          id: "c1",
          organization_id: "org-1",
          organization: {
            id: "org-1",
            slug: "belga-queen",
            name: "Belga Queen",
            city: "Reims",
          },
          title: "Story",
          body: "Texte",
          media_url: null,
          status: "published",
          is_active: true,
          rejection_reason: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
    });
    expect(items.find((i) => i.id === "offer")?.done).toBe(true);
    expect(items.find((i) => i.id === "event")?.done).toBe(true);
    expect(items.find((i) => i.id === "creator")?.done).toBe(true);
    expect(items.find((i) => i.id === "qr")?.done).toBe(true);
  });
});
