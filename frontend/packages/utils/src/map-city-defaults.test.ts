import { describe, expect, it } from "vitest";

import { resolveCityLoadBbox, resolveCityMapCenter } from "./map-city-defaults";

// Garde-fou serveur : backend/app/core/map_constants.py -> MAP_BBOX_MAX_SURFACE_DEG2 = 0.25.
// Au-delà, /map/events renvoie 422 BBOX_TOO_LARGE. Un bbox « monde » l'avait déclenché (régression
// T5) : ce test verrouille que le bbox de chargement ville reste STRICTEMENT sous le seuil.
const MAP_BBOX_MAX_SURFACE_DEG2 = 0.25;

function surface(bbox: ReturnType<typeof resolveCityLoadBbox>): number {
  return (bbox.lat_max - bbox.lat_min) * (bbox.lon_max - bbox.lon_min);
}

describe("resolveCityLoadBbox", () => {
  it("reste sous le garde-fou serveur pour une ville connue", () => {
    expect(surface(resolveCityLoadBbox("Reims"))).toBeLessThan(MAP_BBOX_MAX_SURFACE_DEG2);
  });

  it("reste sous le garde-fou pour une ville inconnue (fallback ville par défaut)", () => {
    expect(surface(resolveCityLoadBbox("VilleInconnue"))).toBeLessThan(
      MAP_BBOX_MAX_SURFACE_DEG2,
    );
  });

  it("est centré sur le centre de la ville", () => {
    const center = resolveCityMapCenter("Reims");
    const bbox = resolveCityLoadBbox("Reims");
    expect((bbox.lat_min + bbox.lat_max) / 2).toBeCloseTo(center.latitude, 6);
    expect((bbox.lon_min + bbox.lon_max) / 2).toBeCloseTo(center.longitude, 6);
  });

  it("produit un bbox valide (min < max)", () => {
    const bbox = resolveCityLoadBbox("Reims");
    expect(bbox.lat_min).toBeLessThan(bbox.lat_max);
    expect(bbox.lon_min).toBeLessThan(bbox.lon_max);
  });
});
