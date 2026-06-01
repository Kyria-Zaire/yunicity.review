import { describe, expect, it } from "vitest";

import type { CulturalPlaceListItem, Neighborhood } from "@yunicity/types";

import type { TransitCarouselItem } from "./map-labels";
import {
  NEIGHBORHOOD_DETAIL_TABS,
  buildNeighborhoodDetailBriefFacts,
  buildNeighborhoodDetailBreadcrumbs,
  buildNeighborhoodDetailPlaceCards,
  buildNeighborhoodDetailQuickStats,
  formatNeighborhoodApproxArea,
  neighborhoodDetailPortalCopyIsSafe,
  resolveNeighborhoodPracticalAddress,
  resolveNeighborhoodPresentationText,
  shouldTruncateNeighborhoodPresentation,
  summarizeTransitLines,
  truncateNeighborhoodPresentation,
} from "./neighborhood-detail-portal";

const HOOD: Neighborhood = {
  id: "h1",
  city: "Reims",
  slug: "centre-ville",
  display_name: "Centre-ville",
  short_description:
    "Le Centre-ville de Reims est le cœur historique et vivant de la cité des sacres.",
  ambiance: "lively",
  cover_image_url: null,
  accent_color: "#EEF0FF",
  latitude: 49.2583,
  longitude: 4.0317,
  radius_meters: 500,
  is_featured: true,
  is_active: true,
  created_at: "",
  updated_at: "",
};

function place(overrides: Partial<CulturalPlaceListItem> = {}): CulturalPlaceListItem {
  return {
    id: "p1",
    slug: "cathedrale",
    name: "Cathédrale Notre-Dame",
    short_description: "Joyau gothique",
    city: "Reims",
    address: "Place du Cardinal Luçon, 51100 Reims",
    category: "Patrimoine",
    latitude: 49.2534,
    longitude: 4.0339,
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
    neighborhood: { slug: "centre-ville", display_name: "Centre-ville" },
    ...overrides,
  };
}

describe("neighborhood-detail-portal", () => {
  it("formatNeighborhoodApproxArea calcule depuis le rayon", () => {
    expect(formatNeighborhoodApproxArea(500)).toBe("0,8 km²");
    expect(formatNeighborhoodApproxArea(null)).toBeNull();
  });

  it("buildNeighborhoodDetailBreadcrumbs structure le fil d’Ariane", () => {
    const crumbs = buildNeighborhoodDetailBreadcrumbs(HOOD);
    expect(crumbs).toHaveLength(3);
    expect(crumbs[2]?.label).toBe("Centre-ville");
    expect(crumbs[0]?.href).toContain("/neighborhoods");
  });

  it("buildNeighborhoodDetailQuickStats utilise des données réelles", () => {
    const stats = buildNeighborhoodDetailQuickStats(HOOD, 3);
    expect(stats.some((s) => s.value === "3")).toBe(true);
    expect(stats.some((s) => s.label.includes("Superficie"))).toBe(true);
    expect(neighborhoodDetailPortalCopyIsSafe(stats.map((s) => `${s.value} ${s.label}`))).toBe(true);
  });

  it("buildNeighborhoodDetailBriefFacts évite population et avis fictifs", () => {
    const facts = buildNeighborhoodDetailBriefFacts({
      hood: HOOD,
      eventsCount: 2,
      placesCount: 5,
      organizationsCount: 1,
      tribesCount: 2,
    });
    const joined = facts.map((f) => `${f.label} ${f.value}`).join(" ");
    expect(joined).not.toMatch(/habitants|avis|parking/i);
    expect(neighborhoodDetailPortalCopyIsSafe([joined])).toBe(true);
  });

  it("resolveNeighborhoodPracticalAddress privilégie une adresse de lieu", () => {
    expect(resolveNeighborhoodPracticalAddress(HOOD, [place()])).toContain("Luçon");
    expect(resolveNeighborhoodPracticalAddress(HOOD, [])).toBe("Centre-ville, Reims");
  });

  it("présentation tronque les textes longs", () => {
    const longText = "a".repeat(300);
    expect(shouldTruncateNeighborhoodPresentation(longText)).toBe(true);
    expect(truncateNeighborhoodPresentation(longText).endsWith("…")).toBe(true);
    expect(resolveNeighborhoodPresentationText(HOOD)).toContain("cœur historique");
  });

  it("buildNeighborhoodDetailPlaceCards mappe les lieux culturels", () => {
    const cards = buildNeighborhoodDetailPlaceCards([place()], "Reims");
    expect(cards[0]?.name).toBe("Cathédrale Notre-Dame");
    expect(cards[0]?.href).toContain("cathedrale");
  });

  it("summarizeTransitLines agrège tram et bus", () => {
    const items: TransitCarouselItem[] = [
      {
        id: "1",
        routeShortName: "A",
        routeType: "tram",
        stopName: "Langlet",
        headsign: null,
        departureLabel: "5 min",
      },
      {
        id: "2",
        routeShortName: "3",
        routeType: "bus",
        stopName: "Langlet",
        headsign: null,
        departureLabel: "8 min",
      },
    ];
    expect(summarizeTransitLines(items)).toEqual({ tram: "Tram A", bus: "Bus 3" });
  });

  it("NEIGHBORHOOD_DETAIL_TABS couvre les ancres principales", () => {
    expect(NEIGHBORHOOD_DETAIL_TABS.map((tab) => tab.id)).toEqual([
      "about",
      "places",
      "events",
      "practical",
    ]);
  });
});
