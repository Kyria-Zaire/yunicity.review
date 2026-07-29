import type { Neighborhood } from "@yunicity/types";
import { describe, expect, it } from "vitest";

import { filterNeighborhoodsByAmbiance, type MapPortalAmbianceId } from "./map-portal";

function hood(slug: string, ambiance: string | null): Neighborhood {
  return {
    id: slug,
    city: "Reims",
    slug,
    display_name: slug,
    short_description: "",
    ambiance,
    cover_image_url: null,
    accent_color: null,
    latitude: null,
    longitude: null,
    radius_meters: null,
    is_featured: false,
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };
}

// Les 5 valeurs reelles de l'enum backend NeighborhoodAmbiance.
const ENUM_VALUES: MapPortalAmbianceId[] = ["calm", "lively", "cultural", "student", "green"];

const HOODS: Neighborhood[] = [
  hood("la-neuvillette", "calm"),
  hood("centre-ville", "lively"),
  hood("saint-remi", "cultural"),
  hood("croix-rouge", "student"),
  hood("murigny", "green"),
];

describe("filterNeighborhoodsByAmbiance", () => {
  it("sans filtre, renvoie tous les quartiers", () => {
    expect(filterNeighborhoodsByAmbiance(HOODS, [])).toEqual(HOODS);
  });

  it.each(ENUM_VALUES)(
    "le filtre '%s' renvoie exactement le quartier de cette ambiance",
    (ambiance) => {
      const result = filterNeighborhoodsByAmbiance(HOODS, [ambiance]);
      expect(result.map((h) => h.ambiance)).toEqual([ambiance]);
    },
  );

  it("AUCUNE des 5 valeurs d'enum ne vide la carte (regression du bug de sous-chaines FR)", () => {
    for (const ambiance of ENUM_VALUES) {
      expect(filterNeighborhoodsByAmbiance(HOODS, [ambiance]).length).toBeGreaterThan(0);
    }
  });

  it("filtre multiple = union (OR)", () => {
    const result = filterNeighborhoodsByAmbiance(HOODS, ["calm", "green"]);
    expect(result.map((h) => h.slug).sort()).toEqual(["la-neuvillette", "murigny"]);
  });

  it("ecarte un quartier sans ambiance", () => {
    expect(filterNeighborhoodsByAmbiance([hood("x", null)], ["calm"])).toEqual([]);
  });

  it("match insensible a la casse et aux espaces (normalisation cote donnee)", () => {
    expect(filterNeighborhoodsByAmbiance([hood("x", " GREEN ")], ["green"]).length).toBe(1);
  });
});
