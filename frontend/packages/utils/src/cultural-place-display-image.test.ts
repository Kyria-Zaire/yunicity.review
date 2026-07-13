import { describe, expect, it } from "vitest";

import type { CulturalPlaceListItem } from "@yunicity/types";

import {
  GENERIC_CULTURAL_UNSPLASH_PHOTO_ID,
  isGenericCulturalPlaceholderUrl,
  resolveCulturalPlaceDisplayUrl,
  resolveCulturalPlaceSlugImageOverride,
} from "./cultural-place-display-image";

/** Les 12 lieux culturels servis depuis R2/CDN par SEED-PROD-01B. */
const SEED_PROD_01B_SLUGS = [
  "cathedrale-notre-dame",
  "basilique-saint-remi",
  "cryptoportique",
  "frac-grand-est",
  "halles-boulingrin",
  "musee-des-beaux-arts",
  "musee-saint-remi",
  "opera-de-reims",
  "palais-du-tau",
  "parc-de-champagne",
  "planetarium-de-reims",
  "porte-de-mars",
] as const;

const GENERIC_URL = `https://images.unsplash.com/${GENERIC_CULTURAL_UNSPLASH_PHOTO_ID}?w=800`;

const basePlace = (overrides: Partial<CulturalPlaceListItem> = {}): CulturalPlaceListItem =>
  ({
    id: "1",
    slug: "cryptoportique",
    name: "Cryptoportique",
    short_description: "Galerie souterraine",
    city: "Reims",
    address: "Reims",
    category: "heritage",
    latitude: 49.25,
    longitude: 4.03,
    image_url: null,
    hero_image_url: GENERIC_URL,
    thumbnail_image_url: GENERIC_URL,
    gallery_images: [],
    editorial_excerpt: null,
    photo_credit: null,
    image_source: null,
    image_alt: null,
    source_name: "Wikimedia",
    image_credit: null,
    neighborhood: null,
    ...overrides,
  }) as CulturalPlaceListItem;

describe("cultural-place-display-image", () => {
  it("détecte le placeholder Unsplash générique", () => {
    expect(isGenericCulturalPlaceholderUrl(GENERIC_URL)).toBe(true);
    expect(isGenericCulturalPlaceholderUrl("https://cdn.example.com/photo.jpg")).toBe(false);
  });

  it("utilise l’override slug plutôt que le placeholder générique (lieu hors des 12)", () => {
    // domaine-pommery n'est PAS traité par SEED-PROD-01B → override conservé.
    const url = resolveCulturalPlaceDisplayUrl(basePlace({ slug: "domaine-pommery" }));
    expect(url).toBeTruthy();
    expect(url).not.toContain(GENERIC_CULTURAL_UNSPLASH_PHOTO_ID);
  });

  it("conserve l’URL API si elle n’est pas générique", () => {
    const url = resolveCulturalPlaceDisplayUrl(
      basePlace({
        slug: "lieu-sans-override-test",
        hero_image_url: "https://example.com/unique-mars.jpg",
        thumbnail_image_url: null,
      }),
    );
    expect(url).toBe("https://example.com/unique-mars.jpg");
  });

  it("retourne null pour déclencher le gradient premium", () => {
    const url = resolveCulturalPlaceDisplayUrl(
      basePlace({
        slug: "lieu-inconnu",
        hero_image_url: GENERIC_URL,
        thumbnail_image_url: GENERIC_URL,
      }),
    );
    expect(url).toBeNull();
  });

  it("résout la cover CDN media.yunicity.city (frac-grand-est, plus d’override)", () => {
    const cover = "https://media.yunicity.city/places/reims/frac-grand-est/cover.jpg";
    const url = resolveCulturalPlaceDisplayUrl(
      basePlace({ slug: "frac-grand-est", hero_image_url: cover, thumbnail_image_url: cover }),
    );
    expect(url).toBe(cover);
  });

  // SEED-PROD-01B : les 12 lieux sont servis par l'API cultural_places, jamais par un override.
  it.each(SEED_PROD_01B_SLUGS)(
    "%s : résolu depuis l’API media.yunicity.city (ni override, ni filtre pending)",
    (slug) => {
      const cover = `https://media.yunicity.city/places/reims/${slug}/cover.jpg`;
      const url = resolveCulturalPlaceDisplayUrl(
        basePlace({ slug, hero_image_url: cover, thumbnail_image_url: cover }),
      );
      expect(url).toBe(cover);
    },
  );

  it.each(SEED_PROD_01B_SLUGS)("%s : n’a plus d’override hardcodé", (slug) => {
    expect(resolveCulturalPlaceSlugImageOverride(slug)).toBeNull();
  });

  it("conserve les overrides des lieux hors des 12 (ex. domaine-pommery)", () => {
    expect(resolveCulturalPlaceSlugImageOverride("domaine-pommery")).toBeTruthy();
  });
});
