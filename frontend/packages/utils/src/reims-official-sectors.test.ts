import { describe, expect, it } from "vitest";

import { resolveNeighborhoodEditorialImage } from "./editorial-fallback-images";
import { buildNeighborhoodMapMarkers } from "./map-living-territory";
import { neighborhoodHref } from "./neighborhood-labels";
import { NEIGHBORHOOD_PORTAL_THEME_SLUGS } from "./neighborhood-portal";
import { keepOfficialSectors } from "./neighborhood-sectors";
import { buildPlacesDesktopQuartierTiles } from "./places-desktop-presenter";

/**
 * Les 12 secteurs officiels de Reims (referentiel metier valide) — miroir frontend du lock
 * backend `tests/test_reims_official_sectors.py`. Les deux doivent bouger ensemble.
 */
const REIMS_OFFICIAL_SECTOR_SLUGS = [
  "saint-remi",
  "courlancy",
  "centre-ville",
  "cernay-jean-jaures",
  "clairmarais",
  "chatillons",
  "chemin-vert",
  "croix-rouge",
  "la-neuvillette",
  "orgeval",
  "maison-blanche",
  "murigny",
] as const;

/** Fusionnes dans cernay-jean-jaures (QUARTIER-01 phase 3c) : jamais des secteurs. */
const MERGED_SLUGS = ["cernay", "jean-jaures", "boulingrin"] as const;

const hood = (slug: string) => ({ slug, cover_image_url: null });

describe("secteurs officiels de Reims", () => {
  it("compte exactement 12 secteurs", () => {
    expect(REIMS_OFFICIAL_SECTOR_SLUGS).toHaveLength(12);
    expect(new Set(REIMS_OFFICIAL_SECTOR_SLUGS).size).toBe(12);
  });

  it("aucun secteur ne porte un slug fusionne", () => {
    for (const merged of MERGED_SLUGS) {
      expect(REIMS_OFFICIAL_SECTOR_SLUGS).not.toContain(merged);
    }
  });
});

describe("mapping secteur -> image", () => {
  it("chaque secteur resout une image editoriale", () => {
    for (const slug of REIMS_OFFICIAL_SECTOR_SLUGS) {
      expect(resolveNeighborhoodEditorialImage(hood(slug)), `image manquante: ${slug}`).toBeTruthy();
    }
  });

  it("deux secteurs ne partagent jamais la meme image", () => {
    const urls = REIMS_OFFICIAL_SECTOR_SLUGS.map((slug) =>
      resolveNeighborhoodEditorialImage(hood(slug)),
    );
    expect(new Set(urls).size).toBe(REIMS_OFFICIAL_SECTOR_SLUGS.length);
  });

  it("ignore une cover yunicity.city en attente et retombe sur l'editorial", () => {
    const pending = {
      slug: "cernay-jean-jaures",
      cover_image_url: "/neighborhoods/reims/cernay-jean-jaures/hero.jpg",
    };
    expect(resolveNeighborhoodEditorialImage(pending)).toBe(
      resolveNeighborhoodEditorialImage(hood("cernay-jean-jaures")),
    );
  });

  it("un slug fusionne resout encore une image (atterrissage de redirect / donnee ancienne)", () => {
    for (const merged of MERGED_SLUGS) {
      expect(resolveNeighborhoodEditorialImage(hood(merged)), merged).toBeTruthy();
    }
  });
});

describe("points d'entree vers un secteur", () => {
  it("construit le lien canonique /neighborhoods/<slug>", () => {
    expect(neighborhoodHref("cernay-jean-jaures", "Reims")).toBe(
      "/neighborhoods/cernay-jean-jaures?city=Reims",
    );
  });

  it("les tuiles quartiers de /places ne pointent que sur des secteurs actifs", () => {
    for (const tile of buildPlacesDesktopQuartierTiles("Reims")) {
      expect(REIMS_OFFICIAL_SECTOR_SLUGS, `tuile perimee: ${tile.slug}`).toContain(tile.slug);
      expect(tile.href).toBe(neighborhoodHref(tile.slug, "Reims"));
      expect(tile.imageUrl).toBeTruthy();
    }
  });

  it("les themes du portail ne referencent aucun secteur fusionne", () => {
    for (const slug of NEIGHBORHOOD_PORTAL_THEME_SLUGS) {
      expect(REIMS_OFFICIAL_SECTOR_SLUGS, `theme perime: ${slug}`).toContain(slug);
    }
  });
});

/**
 * Regression MAP-12-QUARTIERS-01 : mesure sur l'API QA live, `GET /neighborhoods?city=Reims`
 * renvoyait total=15 avec les 3 secteurs fusionnes encore `is_active: true` (base non
 * re-seedee). La Map demandait page_size=12 et recevait donc les 12 PREMIERS sur 15, ordonnes
 * `is_featured DESC, display_name ASC` : Maison-Blanche, Murigny et Orgeval tombaient hors
 * page pendant que Boulingrin, Cernay et Jean-Jaurès occupaient leur place.
 */
const LIVE_API_PAYLOAD_ORDER = [
  ["boulingrin", "Boulingrin", true],
  ["centre-ville", "Centre-ville", true],
  ["cernay-jean-jaures", "Cernay – Jean-Jaurès", true],
  ["saint-remi", "Saint-Remi", true],
  ["cernay", "Cernay", false],
  ["chatillons", "Châtillons", false],
  ["chemin-vert", "Chemin-Vert", false],
  ["clairmarais", "Clairmarais", false],
  ["courlancy", "Courlancy", false],
  ["croix-rouge", "Croix-Rouge", false],
  ["jean-jaures", "Jean-Jaurès", false],
  ["la-neuvillette", "La Neuvillette", false],
  ["maison-blanche", "Maison-Blanche", false],
  ["murigny", "Murigny", false],
  ["orgeval", "Orgeval", false],
] as const;

const liveNeighborhoods = () =>
  LIVE_API_PAYLOAD_ORDER.map(([slug, display_name, is_featured], index) => ({
    id: `h${index}`,
    city: "Reims",
    slug,
    display_name,
    short_description: display_name,
    ambiance: "calme",
    cover_image_url: null,
    accent_color: null,
    latitude: 49.25 + index / 1000,
    longitude: 4.02 + index / 1000,
    radius_meters: 700,
    is_featured,
    // Reproduit fidelement l'environnement fautif : AUCUN secteur fusionne n'est desactive.
    is_active: true,
    created_at: "",
    updated_at: "",
  }));

describe("regression : 12 secteurs sur la Map, ni plus ni moins", () => {
  it("ecarte les secteurs fusionnes meme quand la base les dit encore actifs", () => {
    const kept = keepOfficialSectors(liveNeighborhoods());
    expect(kept).toHaveLength(12);
    expect(kept.map((h) => h.slug).sort()).toEqual([...REIMS_OFFICIAL_SECTOR_SLUGS].sort());
  });

  it("produit exactement 12 marqueurs a partir des 15 lignes renvoyees par l'API", () => {
    const markers = buildNeighborhoodMapMarkers(liveNeighborhoods() as never);
    expect(markers).toHaveLength(12);
    expect(markers.map((m) => m.slug).sort()).toEqual([...REIMS_OFFICIAL_SECTOR_SLUGS].sort());
  });

  it("conserve les 3 secteurs que la troncature page_size=12 faisait disparaitre", () => {
    const kept = keepOfficialSectors(liveNeighborhoods()).map((h) => h.slug);
    for (const slug of ["maison-blanche", "murigny", "orgeval"]) {
      expect(kept, `secteur perdu par la troncature: ${slug}`).toContain(slug);
    }
  });
});
