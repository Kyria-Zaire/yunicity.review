import { describe, expect, it } from "vitest";

import type { CulturalPlaceListItem } from "@yunicity/types";

import {
  GENERIC_CULTURAL_UNSPLASH_PHOTO_ID,
  isGenericCulturalPlaceholderUrl,
  resolveCulturalPlaceDisplayUrl,
} from "./cultural-place-display-image";

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

  it("utilise l’override slug plutôt que le placeholder générique", () => {
    const url = resolveCulturalPlaceDisplayUrl(basePlace());
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

  it("utilise l’override FRAC plutôt qu’une cover seed pending", () => {
    const url = resolveCulturalPlaceDisplayUrl(
      basePlace({
        slug: "frac-grand-est",
        hero_image_url: "https://yunicity.city/places/reims/frac-grand-est/cover.jpg",
      }),
    );
    expect(url).toContain("unsplash.com");
    expect(url).not.toContain("yunicity.city/places");
  });
});
