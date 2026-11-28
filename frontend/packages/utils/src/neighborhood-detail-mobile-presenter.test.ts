import { describe, expect, it } from "vitest";

import type { NeighborhoodDetail } from "@yunicity/types";

import {
  NEIGHBORHOOD_DETAIL_MOBILE_TABS,
  buildNeighborhoodDetailMobilePillars,
  buildNeighborhoodDetailMobileTags,
} from "./neighborhood-detail-mobile-presenter";

function detail(overrides: Partial<NeighborhoodDetail> = {}): NeighborhoodDetail {
  return {
    id: "n1",
    city: "Reims",
    slug: "saint-remi",
    display_name: "Saint-Remi",
    short_description: "Un quartier d'histoire, de jardins et de bonnes adresses.",
    ambiance: "cultural",
    cover_image_url: null,
    accent_color: null,
    latitude: 49.24,
    longitude: 4.03,
    radius_meters: null,
    is_featured: true,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    hero: {
      id: "h1",
      slug: "saint-remi",
      display_name: "Saint-Remi",
      official_label: "Quartier",
      aliases: [],
      moods: ["heritage", "calm", "cultural"],
      featured_quote: "Un quartier d'histoire, de jardins et de bonnes adresses.",
      cover_image_url: null,
      hero_image_storage_key: null,
    },
    history: { long_story: "Histoire du quartier.", featured_quote: null },
    timeline: [],
    videos: [],
    places: [],
    events: [],
    tribes: [],
    creators: [],
    passport_offers: [],
    contributions: [],
    stats: {
      places_count: 0,
      events_count: 0,
      tribes_count: 0,
      videos_count: 0,
      contributions_count: 0,
    },
    ...overrides,
  } as NeighborhoodDetail;
}

describe("neighborhood-detail-mobile-presenter", () => {
  it("expose les 5 tabs maquette mobile", () => {
    expect(NEIGHBORHOOD_DETAIL_MOBILE_TABS.map((tab) => tab.id)).toEqual([
      "overview",
      "feed",
      "places",
      "events",
      "practical",
    ]);
    expect(NEIGHBORHOOD_DETAIL_MOBILE_TABS[0]?.anchor).toBe("#nd-mobile-overview");
    expect(NEIGHBORHOOD_DETAIL_MOBILE_TABS.map((tab) => tab.label)).toEqual([
      "Aperçu",
      "Fil local",
      "Lieux",
      "Événements",
      "Infos pratiques",
    ]);
  });

  it("construit les tags depuis les moods hero", () => {
    const tags = buildNeighborhoodDetailMobileTags(detail());
    expect(tags.length).toBeGreaterThan(0);
  });

  it("construit les piliers identité", () => {
    const pillars = buildNeighborhoodDetailMobilePillars(detail());
    expect(pillars).toHaveLength(3);
    expect(pillars[0]?.label).toBe("Patrimoine");
  });
});
