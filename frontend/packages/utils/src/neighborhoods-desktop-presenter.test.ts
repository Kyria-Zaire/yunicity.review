import { describe, expect, it } from "vitest";

import type { LocalEvent, Neighborhood } from "@yunicity/types";

import {
  NEIGHBORHOODS_DESKTOP_DEFAULT_FILTERS,
  buildNeighborhoodsDesktopGridCards,
  buildNeighborhoodsDesktopHeroCard,
  buildNeighborhoodsDesktopMapCenter,
  buildNeighborhoodsDesktopMapPreviewUrl,
  filterNeighborhoodsForDesktop,
  formatNeighborhoodsDesktopEventLine,
  neighborhoodsDesktopFiltersAreActive,
  resolveNeighborhoodsDesktopImage,
} from "./neighborhoods-desktop-presenter";
import { NEIGHBORHOOD_EDITORIAL_IMAGE_CENTRE_VILLE } from "./editorial-fallback-images";

function hood(overrides: Partial<Neighborhood> = {}): Neighborhood {
  return {
    id: "n1",
    city: "Reims",
    slug: "saint-remi",
    display_name: "Saint-Remi",
    short_description: "Histoire — Un quartier d'histoire et de jardins.",
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
    ...overrides,
  };
}

function event(overrides: Partial<LocalEvent> = {}): LocalEvent {
  const start = new Date();
  start.setHours(16, 0, 0, 0);
  return {
    id: "e1",
    organization_id: null,
    title: "Visite de la basilique",
    description: null,
    event_type: "exhibition",
    city: "Reims",
    district: null,
    starts_at: start.toISOString(),
    ends_at: null,
    timezone: "Europe/Paris",
    location_name: "Basilique",
    address: null,
    latitude: null,
    longitude: null,
    cover_image_url: null,
    moderation_status: "approved",
    is_cancelled: false,
    interested_by_me: false,
    organization: null,
    neighborhood_summary: { slug: "saint-remi", display_name: "Saint-Remi" },
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

describe("neighborhoods-desktop-presenter", () => {
  it("formate une ligne événement aujourd'hui", () => {
    const line = formatNeighborhoodsDesktopEventLine(event());
    expect(line).toContain("Aujourd'hui");
    expect(line).toContain("Visite de la basilique");
  });

  it("construit le hero featured", () => {
    const hero = buildNeighborhoodsDesktopHeroCard({
      city: "Reims",
      neighborhoods: [hood(), hood({ id: "n2", slug: "boulingrin", display_name: "Boulingrin", is_featured: false })],
      events: [event()],
      culturalPlaces: [],
    });
    expect(hero?.slug).toBe("saint-remi");
    expect(hero?.href).toContain("/neighborhoods/saint-remi");
    expect(hero?.imageUrl).toBeTruthy();
  });

  it("filtre par ambiance culturelle", () => {
    const filtered = filterNeighborhoodsForDesktop(
      [
        hood(),
        hood({
          id: "n2",
          slug: "chemin-vert",
          display_name: "Chemin Vert",
          ambiance: "green",
          is_featured: false,
        }),
      ],
      [],
      [],
      { ...NEIGHBORHOODS_DESKTOP_DEFAULT_FILTERS, ambiances: ["cultural"] },
    );
    expect(filtered.map((item) => item.slug)).toEqual(["saint-remi"]);
  });

  it("filtre la recherche textuelle", () => {
    const filtered = filterNeighborhoodsForDesktop(
      [hood(), hood({ id: "n2", slug: "boulingrin", display_name: "Boulingrin", is_featured: false })],
      [],
      [],
      { ...NEIGHBORHOODS_DESKTOP_DEFAULT_FILTERS, query: "bouling" },
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.slug).toBe("boulingrin");
  });

  it("détecte des filtres actifs", () => {
    expect(neighborhoodsDesktopFiltersAreActive(NEIGHBORHOODS_DESKTOP_DEFAULT_FILTERS)).toBe(false);
    expect(
      neighborhoodsDesktopFiltersAreActive({
        ...NEIGHBORHOODS_DESKTOP_DEFAULT_FILTERS,
        query: "saint",
      }),
    ).toBe(true);
  });

  it("exclut le hero de la grille", () => {
    const cards = buildNeighborhoodsDesktopGridCards({
      city: "Reims",
      neighborhoods: [
        hood(),
        hood({ id: "n2", slug: "boulingrin", display_name: "Boulingrin", is_featured: false }),
        hood({ id: "n3", slug: "centre-ville", display_name: "Centre-ville", is_featured: false }),
      ],
      events: [],
      culturalPlaces: [],
      excludeSlug: "saint-remi",
    });
    expect(cards.every((card) => card.slug !== "saint-remi")).toBe(true);
  });

  it("construit une preview Mapbox multi-pins", () => {
    const url = buildNeighborhoodsDesktopMapPreviewUrl(
      [
        hood(),
        hood({ id: "n2", slug: "boulingrin", latitude: 49.26, longitude: 4.04 }),
      ],
      "pk.test",
      { width: 640, height: 280 },
    );
    expect(url).toContain("api.mapbox.com");
    expect(url).toContain("pin-s+");
    expect(url).toContain("/auto/");
    expect(url).toContain("access_token=pk.test");
  });

  it("calcule le centre moyen des quartiers", () => {
    const center = buildNeighborhoodsDesktopMapCenter([
      hood({ latitude: 49.24, longitude: 4.02 }),
      hood({ id: "n2", latitude: 49.26, longitude: 4.04 }),
    ]);
    expect(center?.latitude).toBeCloseTo(49.25);
    expect(center?.longitude).toBeCloseTo(4.03);
  });

  it("retourne null sans token Mapbox", () => {
    expect(buildNeighborhoodsDesktopMapPreviewUrl([hood()], "")).toBeNull();
  });

  it("préfère l’image éditoriale slug aux covers API cassées", () => {
    const url = resolveNeighborhoodsDesktopImage(
      hood({
        slug: "centre-ville",
        display_name: "Centre-ville",
        cover_image_url: "https://media.dev.yunicity.city/neighborhoods/reims/centre-ville/hero.jpg",
      }),
    );
    expect(url).toBe(NEIGHBORHOOD_EDITORIAL_IMAGE_CENTRE_VILLE);
  });

  it("fournit une image pour chaque carte grille Reims connue", () => {
    const cards = buildNeighborhoodsDesktopGridCards({
      city: "Reims",
      neighborhoods: [
        hood({ id: "n1", slug: "centre-ville", display_name: "Centre-ville", is_featured: false }),
        hood({ id: "n2", slug: "cernay-jean-jaures", display_name: "Cernay – Jean-Jaurès", is_featured: false }),
        hood({ id: "n3", slug: "saint-remi", display_name: "Saint-Remi", is_featured: false }),
        hood({ id: "n4", slug: "cernay", display_name: "Cernay", is_featured: false }),
      ],
      events: [],
      culturalPlaces: [],
      maxItems: 4,
    });
    expect(cards).toHaveLength(4);
    expect(cards.every((card) => Boolean(card.imageUrl))).toBe(true);
    expect(cards.find((card) => card.slug === "centre-ville")?.imageUrl).toBe(
      NEIGHBORHOOD_EDITORIAL_IMAGE_CENTRE_VILLE,
    );
  });
});
