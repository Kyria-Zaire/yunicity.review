import { describe, expect, it } from "vitest";

import type { CulturalPlaceListItem, CulturalPlaceStatsResponse } from "@yunicity/types";

import {
  buildPlacesPortalStatCards,
  filterPlacesBySearch,
  isPlaceWithinNewBadgeWindow,
  placesPortalHasNoFakeMetrics,
  pickFeaturedPlaces,
  selectPlacesNewBadgeIds,
  shouldShowPlaceNewBadge,
} from "./places-portal";

const BASE_PLACE = (overrides: Partial<CulturalPlaceListItem> = {}): CulturalPlaceListItem => ({
  id: "1",
  slug: "test",
  name: "Le Boulingrin",
  short_description: "Marché couvert",
  city: "Reims",
  address: "Reims",
  category: "market",
  latitude: 49.25,
  longitude: 4.03,
  image_url: null,
  hero_image_url: null,
  thumbnail_image_url: null,
  gallery_images: [],
  editorial_excerpt: null,
  photo_credit: null,
  image_source: null,
  image_alt: null,
  source_name: "seed",
  image_credit: null,
  neighborhood: { slug: "centre", display_name: "Centre-ville" },
  is_featured: true,
  created_at: new Date().toISOString(),
  ...overrides,
});

describe("places-portal", () => {
  it("n’affiche pas de fausses métriques", () => {
    const stats: CulturalPlaceStatsResponse = {
      city: "Reims",
      total_places: 15,
      new_this_month: 2,
      category_count: 8,
    };
    const cards = buildPlacesPortalStatCards(stats);
    expect(placesPortalHasNoFakeMetrics(cards.map((card) => card.value))).toBe(true);
    expect(cards.find((card) => card.id === "reviews")?.value).toBe("Bientôt");
  });

  it("filtre par recherche", () => {
    const places = [
      BASE_PLACE(),
      BASE_PLACE({ id: "2", slug: "autre", name: "Bibliothèque Carnegie", category: "library" }),
    ];
    expect(filterPlacesBySearch(places, "boulingrin")).toHaveLength(1);
  });

  it("met en avant les lieux featured", () => {
    const places = pickFeaturedPlaces([
      BASE_PLACE({ is_featured: false, name: "Zzz" }),
      BASE_PLACE({ is_featured: true, name: "Aaa" }),
    ]);
    expect(places[0]?.is_featured).toBe(true);
  });

  it("limite les badges NOUVEAU à 4 lieux de moins de 7 jours", () => {
    const now = Date.now();
    const day = 86_400_000;
    const places = Array.from({ length: 6 }, (_, index) =>
      BASE_PLACE({
        id: `p${index}`,
        created_at: new Date(now - index * day).toISOString(),
      }),
    );
    const badgeIds = selectPlacesNewBadgeIds(places, now);
    expect(badgeIds.size).toBe(4);
    expect(shouldShowPlaceNewBadge(places[0]!, badgeIds)).toBe(true);
    expect(shouldShowPlaceNewBadge(places[5]!, badgeIds)).toBe(false);
  });

  it("n’attribue pas NOUVEAU au-delà de 7 jours", () => {
    const old = BASE_PLACE({
      created_at: new Date(Date.now() - 10 * 86_400_000).toISOString(),
    });
    expect(isPlaceWithinNewBadgeWindow(old)).toBe(false);
  });
});
