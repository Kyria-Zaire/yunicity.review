import { describe, expect, it } from "vitest";

import type { MapEventItem, Neighborhood, Tribe } from "@yunicity/types";

import {
  buildMapSelectedPanelPayload,
  buildNeighborhoodMapMarkers,
  buildTribeMapMarkers,
  filterEventsForMapLayer,
  filterNeighborhoodMarkersForLayer,
  filterTribeMarkersForLayer,
  isRealMapCoordinate,
  mapLivingTerritoryHasNoFakeMetrics,
  parseMapLayer,
  resolveMapLayerVisibility,
} from "./map-living-territory";

function hood(overrides: Partial<Neighborhood> = {}): Neighborhood {
  return {
    id: "h1",
    city: "Reims",
    slug: "centre-ville",
    display_name: "Centre-ville",
    short_description: "Cœur historique",
    ambiance: "Vivant et culturel",
    cover_image_url: null,
    accent_color: null,
    latitude: 49.2583,
    longitude: 4.0317,
    radius_meters: 800,
    is_featured: true,
    is_active: true,
    created_at: "",
    updated_at: "",
    ...overrides,
  };
}

function tribe(overrides: Partial<Tribe> = {}): Tribe {
  return {
    id: "t1",
    slug: "running-reims",
    name: "Running Reims",
    description: "Groupe sport doux autour du centre-ville",
    city: "Reims",
    category: "sport_local",
    visibility: "public",
    persistence_kind: "persistent",
    cover_image_url: null,
    is_featured: false,
    member_limit: 100,
    active_member_count: 12,
    is_archived: false,
    viewer_is_member: false,
    viewer_role: null,
    viewer_notifications_muted: false,
    viewer_has_pending_join_request: false,
    created_at: "",
    updated_at: "",
    ...overrides,
  };
}

describe("map-living-territory layers", () => {
  it("parse les slugs URL de couche", () => {
    expect(parseMapLayer("lieux")).toBe("lieux");
    expect(parseMapLayer("quartiers")).toBe("quartiers");
    expect(parseMapLayer(null)).toBe("all");
  });

  it("filtre les marqueurs selon la couche", () => {
    const visibility = resolveMapLayerVisibility("moments");
    expect(filterEventsForMapLayer([{ id: "e1" } as MapEventItem], visibility)).toHaveLength(1);
    expect(filterNeighborhoodMarkersForLayer([{ id: "n", slug: "a" } as never], visibility)).toHaveLength(
      0,
    );
    expect(filterTribeMarkersForLayer([{ id: "t", slug: "b" } as never], visibility)).toHaveLength(0);
  });
});

describe("map-living-territory coordinates", () => {
  it("rejette les coordonnées invalides ou hors zone", () => {
    expect(isRealMapCoordinate(null, 4)).toBe(false);
    expect(isRealMapCoordinate(0, 0)).toBe(false);
    expect(isRealMapCoordinate(48, 2)).toBe(false);
    expect(isRealMapCoordinate(49.2583, 4.0317)).toBe(true);
  });

  it("n’affiche que les quartiers avec coords réelles", () => {
    const markers = buildNeighborhoodMapMarkers([
      hood(),
      hood({ id: "h2", slug: "sans-gps", latitude: null, longitude: null }),
    ]);
    expect(markers).toHaveLength(1);
    expect(markers[0]?.slug).toBe("centre-ville");
  });

  it("ancre les tribus au quartier ou centre-ville sans GPS fake", () => {
    const markers = buildTribeMapMarkers({
      city: "Reims",
      tribes: [tribe(), tribe({ id: "t2", slug: "photo-lovers", description: "Amateurs photo" })],
      neighborhoods: [hood()],
    });
    expect(markers.some((m) => m.slug === "running-reims" && !m.isApproximate)).toBe(true);
    expect(markers.some((m) => m.slug === "photo-lovers" && m.isApproximate)).toBe(true);
  });
});

describe("map-living-territory selected panel", () => {
  it("construit un payload événement sans métriques inventées", () => {
    const event: MapEventItem = {
      id: "ev1",
      title: "Concert calme",
      description: null,
      city: "Reims",
      district: null,
      starts_at: new Date(Date.now() + 86_400_000).toISOString(),
      ends_at: null,
      location_name: "Place Drouet",
      latitude: 49.26,
      longitude: 4.03,
      neighborhood_summary: null,
    };
    const panel = buildMapSelectedPanelPayload({
      selection: { kind: "event", id: "ev1" },
      city: "Reims",
      events: [event],
      placesBySlug: new Map(),
      neighborhoods: [],
      tribeMarkers: [],
    });
    expect(panel?.kind).toBe("event");
    expect(panel && "title" in panel && panel.title).toBe("Concert calme");
    expect(mapLivingTerritoryHasNoFakeMetrics([panel?.kind === "event" ? panel.meta : ""])).toBe(true);
  });
});
