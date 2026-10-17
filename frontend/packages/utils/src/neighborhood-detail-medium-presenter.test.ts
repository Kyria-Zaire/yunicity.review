import { describe, expect, it } from "vitest";

import type { NeighborhoodDetail } from "@yunicity/types";

import {
  NEIGHBORHOOD_DETAIL_MEDIUM_TABS,
  buildNeighborhoodDetailMediumPillars,
  buildNeighborhoodDetailMediumTags,
  buildNeighborhoodDetailMediumTodayEvents,
} from "./neighborhood-detail-medium-presenter";

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
    events: [
      {
        id: "e1",
        title: "Visite de la basilique",
        starts_at: new Date().toISOString(),
        location_name: "Basilique",
        cover_image_url: null,
      },
    ],
    tribes: [],
    creators: [],
    passport_offers: [],
    contributions: [],
    stats: {
      places_count: 0,
      events_count: 1,
      tribes_count: 0,
      videos_count: 0,
      contributions_count: 0,
    },
    ...overrides,
  } as NeighborhoodDetail;
}

describe("neighborhood-detail-medium-presenter", () => {
  it("expose les 5 tabs medium", () => {
    expect(NEIGHBORHOOD_DETAIL_MEDIUM_TABS.map((tab) => tab.id)).toEqual([
      "overview",
      "feed",
      "places",
      "events",
      "practical",
    ]);
    expect(NEIGHBORHOOD_DETAIL_MEDIUM_TABS[0]?.anchor).toBe("#nd-medium-overview");
  });

  it("construit les tags depuis les moods hero", () => {
    const tags = buildNeighborhoodDetailMediumTags(detail());
    expect(tags).toHaveLength(3);
    expect(tags[0]?.label).toBe("Patrimoine");
  });

  it("construit la section aujourd’hui", () => {
    const today = buildNeighborhoodDetailMediumTodayEvents(detail());
    expect(today.featured?.title).toBe("Visite de la basilique");
  });

  it("construit les piliers avec hints éditoriaux", () => {
    const pillars = buildNeighborhoodDetailMediumPillars(
      detail({
        landmarks: [{ slug: "basilique", name: "Basilique Saint-Remi", category: "heritage", hero_image_url: null, photo_credit: null, image_license: null }],
        local_life: "Commerces de proximité",
        green_spaces: "Parc de la Patte d’Oie",
      }),
    );
    expect(pillars).toHaveLength(3);
    expect(pillars[0]?.description).toContain("Basilique");
    expect(pillars[1]?.description).toContain("Commerces");
  });
});
