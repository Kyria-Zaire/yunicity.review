import { describe, expect, it } from "vitest";

import type { NeighborhoodDetail } from "@yunicity/types";

import {
  buildNeighborhoodDetailDesktopAmbianceLine,
  buildNeighborhoodDetailDesktopGalleryUrls,
  buildNeighborhoodDetailDesktopHeroImage,
  buildNeighborhoodDetailDesktopPillars,
  buildNeighborhoodDetailDesktopTags,
  buildNeighborhoodDetailDesktopTodayEvents,
  NEIGHBORHOOD_DETAIL_DESKTOP_TABS,
} from "./neighborhood-detail-desktop-presenter";

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

describe("neighborhood-detail-desktop-presenter", () => {
  it("expose les 5 tabs maquette", () => {
    expect(NEIGHBORHOOD_DETAIL_DESKTOP_TABS.map((tab) => tab.id)).toEqual([
      "overview",
      "feed",
      "places",
      "events",
      "practical",
    ]);
  });

  it("construit les tags depuis les moods hero", () => {
    const tags = buildNeighborhoodDetailDesktopTags(detail());
    expect(tags).toHaveLength(3);
    expect(tags[0]?.label).toBe("Patrimoine");
  });

  it("construit la section aujourd’hui", () => {
    const today = buildNeighborhoodDetailDesktopTodayEvents(detail());
    expect(today.featured?.title).toBe("Visite de la basilique");
    expect(today.featured?.whenLabel).toContain("Aujourd’hui");
  });

  it("formate la ligne d’ambiance", () => {
    expect(buildNeighborhoodDetailDesktopAmbianceLine(detail())).toContain("et");
  });

  it("construit les piliers avec descriptions", () => {
    const pillars = buildNeighborhoodDetailDesktopPillars(detail());
    expect(pillars).toHaveLength(3);
    expect(pillars[0]?.description).toContain("Basilique");
  });

  it("ignore le hero.jpg pending et utilise la photo Wikimedia du quartier", () => {
    const image = buildNeighborhoodDetailDesktopHeroImage(
      detail({
        slug: "centre-ville",
        cover_image_url: "/neighborhoods/reims/centre-ville/hero.jpg",
        hero: {
          id: "h1",
          slug: "centre-ville",
          display_name: "Centre-ville",
          official_label: "Quartier",
          aliases: [],
          moods: ["lively"],
          featured_quote: null,
          cover_image_url: "/neighborhoods/reims/centre-ville/hero.jpg",
          hero_image_storage_key: "neighborhoods/reims/centre-ville/hero.jpg",
        },
      }),
    );
    expect(image).toContain("commons.wikimedia.org");
    expect(image).not.toContain("hero.jpg");
  });

  it("n’ajoute pas les placeholders pending dans la galerie", () => {
    const urls = buildNeighborhoodDetailDesktopGalleryUrls(
      detail({
        slug: "centre-ville",
        cover_image_url: "/neighborhoods/reims/centre-ville/hero.jpg",
        places: [
          {
            id: "p1",
            slug: "cathedrale",
            name: "Cathédrale",
            category: "heritage",
            image_url: "/neighborhoods/reims/centre-ville/hero.jpg",
            is_partner: false,
          },
        ],
      }),
    );
    expect(urls.every((url) => !url.includes("/neighborhoods/reims/"))).toBe(true);
    expect(urls[0]).toContain("commons.wikimedia.org");
  });
});
