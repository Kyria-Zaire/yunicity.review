import { describe, expect, it } from "vitest";

import {
  culturalPlaceHasGallery,
  getCulturalPlaceImageCredit,
  hasCulturalPlaceImage,
  resolveCulturalPlaceHeroUrl,
  resolveCulturalPlaceImageUrl,
  resolveCulturalPlaceThumbnailUrl,
  usableCulturalGalleryImages,
} from "./cultural-place-media";

const base = {
  image_url: null,
  hero_image_url: null,
  thumbnail_image_url: null,
  image_credit: null,
  source_name: "",
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

  it("ignore les covers seed non déployées sur yunicity.city", () => {
    expect(
      resolveCulturalPlaceHeroUrl({
        ...base,
        hero_image_url: "https://yunicity.city/places/reims/frac-grand-est/cover.jpg",
      }),
    ).toBeNull();
  });
});

describe("resolveCulturalPlaceThumbnailUrl", () => {
  it("uses thumbnail first then hero then legacy", () => {
    expect(
      resolveCulturalPlaceThumbnailUrl({
        ...base,
        thumbnail_image_url: "https://example.com/thumb.jpg",
        hero_image_url: "https://example.com/hero.jpg",
      }),
    ).toBe("https://example.com/thumb.jpg");
  });

  it("returns null when all values are empty", () => {
    expect(
      resolveCulturalPlaceThumbnailUrl({
        ...base,
        thumbnail_image_url: " ",
        hero_image_url: "",
        image_url: "\n",
      }),
    ).toBeNull();
  });
});

describe("hasCulturalPlaceImage", () => {
  it("returns true when an image url can be resolved", () => {
    expect(
      hasCulturalPlaceImage({
        ...base,
        hero_image_url: "https://example.com/hero.jpg",
      }),
    ).toBe(true);
  });

  it("returns false when no image is available", () => {
    expect(hasCulturalPlaceImage(base)).toBe(false);
  });
});

describe("getCulturalPlaceImageCredit", () => {
  it("prefers explicit photo credit", () => {
    expect(
      getCulturalPlaceImageCredit({
        ...base,
        photo_credit: "Photo: Auteur",
        image_credit: "Image credit",
        source_name: "Wikimedia Commons",
      }),
    ).toBe("Photo: Auteur");
  });

  it("falls back to image credit and source name", () => {
    expect(
      getCulturalPlaceImageCredit({
        ...base,
        image_credit: "Image credit",
        source_name: "Wikimedia Commons",
      }),
    ).toBe("Image credit");
    expect(
      getCulturalPlaceImageCredit({
        ...base,
        image_credit: " ",
        source_name: "Wikimedia Commons",
      }),
    ).toBe("Wikimedia Commons");
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

  it("returns false when gallery is empty", () => {
    expect(
      culturalPlaceHasGallery({
        ...base,
        id: "2",
        slug: "y",
        name: "Y",
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
        gallery_images: [],
      }),
    ).toBe(false);
  });
});

describe("usableCulturalGalleryImages", () => {
  it("drops entries whose URL is a dead pending yunicity.city cover", () => {
    const result = usableCulturalGalleryImages([
      { url: "https://yunicity.city/places/reims/cathedrale-notre-dame/cover.jpg" },
      { url: "https://media.yunicity.city/places/reims/cathedrale-notre-dame/cover.jpg" },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]?.url).toBe(
      "https://media.yunicity.city/places/reims/cathedrale-notre-dame/cover.jpg",
    );
  });

  it("returns an empty array when the only entry is a dead cover (no visible 404)", () => {
    expect(
      usableCulturalGalleryImages([
        { url: "https://yunicity.city/places/reims/opera-de-reims/cover.jpg" },
      ]),
    ).toEqual([]);
  });

  it("keeps external editorial URLs and drops empty ones", () => {
    const result = usableCulturalGalleryImages([
      { url: "https://images.example/photo.jpg", alt: "x" },
      { url: "   " },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]?.url).toBe("https://images.example/photo.jpg");
  });

  it("tolerates null / undefined galleries", () => {
    expect(usableCulturalGalleryImages(null)).toEqual([]);
    expect(usableCulturalGalleryImages(undefined)).toEqual([]);
  });
});
