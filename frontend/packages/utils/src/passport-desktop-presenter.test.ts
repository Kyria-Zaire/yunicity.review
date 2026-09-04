import { describe, expect, it } from "vitest";

import type { PartnerOfferPublic } from "@yunicity/types";

import {
  filterPassportOffersTab,
  formatPassportDesktopLevelName,
  formatPassportDesktopOfferAvailability,
  formatPassportDesktopPartnerLocation,
  isPartnerOfferFlash,
  matchesPassportOfferCategory,
  pickPassportDesktopFlashOffer,
  resolvePassportOfferCategoryBadge,
  resolvePassportDesktopCategoryTone,
} from "./passport-desktop-presenter";

function offer(overrides: Partial<PartnerOfferPublic> = {}): PartnerOfferPublic {
  return {
    id: "o1",
    slug: "degustation",
    title: "Dégustation découverte",
    description: null,
    offer_type: "gift",
    value_label: "Dégustation découverte",
    conditions: null,
    valid_from: "2026-08-01T00:00:00Z",
    valid_until: "2026-09-02T17:00:00Z",
    is_featured: true,
    tier_code_required: null,
    partner: {
      name: "Belga Queen",
      slug: "belga-queen",
      category: "food",
      city: "Reims",
      logo_url: null,
      cover_image_url: null,
      is_verified: true,
      partner_status: "active",
    },
    ...overrides,
  };
}

describe("passport desktop presenter", () => {
  it("maps partner category to a Passport badge, or skips unknown", () => {
    expect(resolvePassportOfferCategoryBadge({ category: "food" })).toBe("Food");
    expect(resolvePassportOfferCategoryBadge({ category: "asian_food" })).toBe("Food");
    expect(resolvePassportOfferCategoryBadge({ category: null })).toBeNull();
  });

  it("marks an offer as flash when it expires within 7 days", () => {
    const now = new Date("2026-08-30T10:00:00Z");
    expect(
      isPartnerOfferFlash({ valid_from: null, valid_until: "2026-09-02T17:00:00Z" }, now),
    ).toBe(true);
    expect(
      isPartnerOfferFlash({ valid_from: null, valid_until: "2026-10-30T17:00:00Z" }, now),
    ).toBe(false);
  });

  it("formats flash availability with date and time", () => {
    const now = new Date("2026-08-30T10:00:00Z");
    const label = formatPassportDesktopOfferAvailability(
      { valid_from: null, valid_until: "2026-09-02T17:00:00Z" },
      now,
    );
    expect(label).toContain("Disponible jusqu'au");
    expect(label).toContain("·");
  });

  it("uses the street fragment for partner location", () => {
    expect(
      formatPassportDesktopPartnerLocation({
        address: "Place Drouet d'Erlon, Reims",
        city: "Reims",
      }),
    ).toBe("Place Drouet d'Erlon");
    expect(formatPassportDesktopPartnerLocation({ address: null, city: "Reims" })).toBe(
      "Centre-ville",
    );
  });

  it("filters offers tab by category, query and availability", () => {
    const now = new Date("2026-08-30T10:00:00Z");
    const food = offer({ id: "food", partner: { ...offer().partner, category: "food" } });
    const culture = offer({
      id: "culture",
      title: "Visite partenaire",
      partner: { ...offer().partner, name: "Musée Saint-Remi", category: "culture" },
    });
    const expired = offer({
      id: "old",
      valid_until: "2026-08-01T00:00:00Z",
    });

    expect(matchesPassportOfferCategory(food, "food")).toBe(true);
    expect(filterPassportOffersTab({
      offers: [food, culture, expired],
      query: "musée",
      categoryId: "all",
      availableNow: false,
      savedIds: new Set(),
      savedOnly: false,
      now,
    }).map((item) => item.id)).toEqual(["culture"]);

    expect(filterPassportOffersTab({
      offers: [food, expired],
      query: "",
      categoryId: "all",
      availableNow: true,
      savedIds: new Set(),
      savedOnly: false,
      now,
    }).map((item) => item.id)).toEqual(["food"]);
  });

  it("resolves category tones, level names and flash featured offer", () => {
    expect(resolvePassportDesktopCategoryTone("Food")).toBe("text-orange-600");
    expect(resolvePassportDesktopCategoryTone("Bien-être")).toBe("text-emerald-600");
    expect(formatPassportDesktopLevelName("Ambassadeur")).toBe("Ambassadeur local");
    expect(pickPassportDesktopFlashOffer([offer()], new Date("2026-08-30T10:00:00Z"))?.id).toBe(
      "o1",
    );
  });
});
