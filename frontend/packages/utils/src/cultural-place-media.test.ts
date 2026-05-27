import { describe, expect, it } from "vitest";

import {
  culturalPlaceHasGallery,
  resolveCulturalPlaceHeroUrl,
  resolveCulturalPlaceImageUrl,
} from "./cultural-place-media";

const base = {
  image_url: null,
  hero_image_url: null,
  thumbnail_image_url: null,
  gallery_images: [],
  editorial_excerpt: null,
  photo_credit: null,
  image_source: null,
};

describe("resolveCulturalPlaceImageUrl", () => {
  it("prefers thumbnail then hero then legacy", () => {
    expect(
      resolveCulturalPlaceImageUrl({
        ...base,
        thumbnail_image_url: "https://example.com/thumb.jpg",
        hero_image_url: "https://example.com/hero.jpg",
        image_url: "https://example.com/legacy.jpg",
      }),
    ).toBe("https://example.com/thumb.jpg");
  });

  it("falls back to hero when thumbnail missing", () => {
    expect(
      resolveCulturalPlaceImageUrl({
        ...base,
        hero_image_url: "https://example.com/hero.jpg",
        image_url: "https://example.com/legacy.jpg",
      }),
    ).toBe("https://example.com/hero.jpg");
  });

  it("returns null when no media", () => {
    expect(resolveCulturalPlaceImageUrl(base)).toBeNull();
  });
});

describe("resolveCulturalPlaceHeroUrl", () => {
  it("uses hero before legacy", () => {
    expect(
      resolveCulturalPlaceHeroUrl({
        ...base,
        hero_image_url: "https://example.com/hero.jpg",
        image_url: "https://example.com/legacy.jpg",
      }),
    ).toBe("https://example.com/hero.jpg");
  });
});

describe("culturalPlaceHasGallery", () => {
  it("detects gallery items", () => {
    expect(
      culturalPlaceHasGallery({
        ...base,
        id: "1",
        slug: "x",
        name: "X",
        short_description: "",
        city: "Reims",
        address: "",
        category: "museum",
        latitude: 0,
        longitude: 0,
        image_alt: null,
        source_name: "",
        image_credit: null,
        neighborhood: null,
        gallery_images: [{ url: "https://example.com/a.jpg" }],
      }),
    ).toBe(true);
  });
});
