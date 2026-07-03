import { describe, expect, it } from "vitest";

import {
  isPendingYunicityHostedCoverUrl,
  resolveMapNeighborhoodImageUrl,
  resolveMapPlaceImageUrl,
} from "./map-media-url";

describe("isPendingYunicityHostedCoverUrl", () => {
  it("detects prod seed cultural place covers", () => {
    expect(
      isPendingYunicityHostedCoverUrl(
        "https://yunicity.city/places/reims/cathedrale-notre-dame/cover.jpg",
      ),
    ).toBe(true);
  });

  it("detects prod seed neighborhood hero paths", () => {
    expect(
      isPendingYunicityHostedCoverUrl(
        "https://yunicity.city/neighborhoods/reims/boulingrin/hero.jpg",
      ),
    ).toBe(true);
  });

  it("allows external editorial URLs", () => {
    expect(
      isPendingYunicityHostedCoverUrl(
        "https://images.unsplash.com/photo-1444084316824-dc26d6657664",
      ),
    ).toBe(false);
  });
});

describe("resolveMapPlaceImageUrl", () => {
  it("skips pending hosted covers and returns null", () => {
    expect(
      resolveMapPlaceImageUrl({
        hero_image_url: "https://yunicity.city/places/reims/palais-du-tau/cover.jpg",
        image_url: null,
        thumbnail_image_url: null,
      }),
    ).toBeNull();
  });

  it("returns the first usable remote image", () => {
    const remote = "https://images.example/place.jpg";
    expect(
      resolveMapPlaceImageUrl({
        hero_image_url: null,
        image_url: remote,
        thumbnail_image_url: null,
      }),
    ).toBe(remote);
  });
});

describe("resolveMapNeighborhoodImageUrl", () => {
  it("falls back to editorial image when cover is a pending hosted path", () => {
    const url = resolveMapNeighborhoodImageUrl({
      slug: "boulingrin",
      cover_image_url: "https://yunicity.city/neighborhoods/reims/boulingrin/hero.jpg",
    });
    expect(url).toContain("bing.com");
  });
});
