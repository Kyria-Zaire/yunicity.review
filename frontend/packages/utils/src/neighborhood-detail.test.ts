import { describe, expect, it } from "vitest";

import type { CulturalPlaceListItem, LocalEvent, Neighborhood } from "@yunicity/types";

import { buildMapNeighborhoodUrl } from "./explorer-links";
import {
  buildNeighborhoodMomentAtmosphereLine,
  neighborhoodAtmosphereHasNoEngagementMetrics,
} from "./neighborhood-atmosphere";
import {
  filterNeighborhoodCulturalPlaces,
  filterNeighborhoodUpcomingEvents,
  neighborhoodAmbianceBadge,
  neighborhoodDetailCopyHasNoFakeMetrics,
  neighborhoodHeroTagline,
} from "./neighborhood-detail";

const HOOD: Neighborhood = {
  id: "h1",
  city: "Reims",
  slug: "boulingrin",
  display_name: "Boulingrin",
  short_description: "Halles et terrasses animées.",
  ambiance: "lively",
  cover_image_url: null,
  accent_color: "#EEF0FF",
  latitude: 49.2565,
  longitude: 4.0285,
  radius_meters: 500,
  is_featured: true,
  is_active: true,
  created_at: "",
  updated_at: "",
};

function event(overrides: Partial<LocalEvent> = {}): LocalEvent {
  return {
    id: "e1",
    organization_id: null,
    title: "Marché",
    description: null,
    event_type: "market",
    city: "Reims",
    district: "Boulingrin",
    starts_at: "2026-06-10T10:00:00.000Z",
    ends_at: null,
    timezone: "Europe/Paris",
    location_name: "Boulingrin",
    address: null,
    latitude: null,
    longitude: null,
    cover_image_url: null,
    moderation_status: "approved",
    is_cancelled: false,
    interested_by_me: false,
    organization: null,
    neighborhood_summary: { slug: "boulingrin", display_name: "Boulingrin" },
    created_at: "",
    ...overrides,
  };
}

describe("neighborhood-detail", () => {
  it("neighborhoodAmbianceBadge mappe les ambiances", () => {
    expect(neighborhoodAmbianceBadge("cultural")).toBe("Vie culturelle");
    expect(neighborhoodAmbianceBadge(null)).toBe("Ambiance locale");
  });

  it("neighborhoodHeroTagline privilégie la description courte", () => {
    expect(neighborhoodHeroTagline(HOOD)).toBe("Halles et terrasses animées.");
  });

  it("filterNeighborhoodUpcomingEvents limite au quartier", () => {
    const other = event({
      id: "e2",
      district: "Saint-Remi",
      neighborhood_summary: { slug: "saint-remi", display_name: "Saint-Remi" },
    });
    const filtered = filterNeighborhoodUpcomingEvents(HOOD, [other, event()], 4);
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.id).toBe("e1");
  });

  it("filterNeighborhoodCulturalPlaces priorise le quartier", () => {
    const place: CulturalPlaceListItem = {
      id: "p1",
      slug: "halles",
      name: "Halles",
      short_description: "Repère",
      city: "Reims",
      address: "Rue",
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
      neighborhood: { slug: "boulingrin", display_name: "Boulingrin" },
    };
    const far = { ...place, id: "p2", slug: "far", neighborhood: null };
    expect(filterNeighborhoodCulturalPlaces(HOOD, [far, place]).map((p) => p.slug)).toEqual([
      "halles",
    ]);
  });

  it("buildNeighborhoodMomentAtmosphereLine reste éditorial sans métriques", () => {
    const line = buildNeighborhoodMomentAtmosphereLine(HOOD, [event()], [], {
      now: new Date("2026-05-27T14:00:00"),
      weatherCalm: true,
    });
    expect(neighborhoodDetailCopyHasNoFakeMetrics([line])).toBe(true);
    expect(line.length).toBeGreaterThan(10);
  });

  it("buildMapNeighborhoodUrl encode slug et ville", () => {
    expect(buildMapNeighborhoodUrl("boulingrin", { city: "Reims", route: true })).toBe(
      "/map?neighborhood=boulingrin&city=Reims&route=1",
    );
  });

  it("neighborhoodAtmosphereHasNoEngagementMetrics sur items carrousel", () => {
    const items = [
      {
        id: "1",
        neighborhoodSlug: "boulingrin",
        name: "Boulingrin",
        editorialLine: "Quartier plus calme aujourd’hui.",
        tags: ["calme" as const],
        imageUrl: null,
        accentColor: null,
        neighborhoodHref: "/neighborhoods/boulingrin?city=Reims",
        mapHref: "/map?city=Reims",
      },
    ];
    expect(neighborhoodAtmosphereHasNoEngagementMetrics(items)).toBe(true);
  });
});
