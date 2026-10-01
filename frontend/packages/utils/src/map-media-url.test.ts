import { describe, expect, it } from "vitest";

import { NEIGHBORHOOD_EDITORIAL_IMAGE_BOULINGRIN } from "./editorial-fallback-images";
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

  // SEED-PROD-01B — anti-régression : le CDN média légitime ne doit JAMAIS être filtré,
  // même s'il partage le chemin /places/reims/.../cover.jpg avec l'ancien hôte cassé.
  it("NEVER filters the media.yunicity.city CDN (prod)", () => {
    expect(
      isPendingYunicityHostedCoverUrl(
        "https://media.yunicity.city/places/reims/cathedrale-notre-dame/cover.jpg",
      ),
    ).toBe(false);
    expect(
      isPendingYunicityHostedCoverUrl(
        "https://media.yunicity.city/neighborhoods/reims/boulingrin/hero.jpg",
      ),
    ).toBe(false);
  });

  it("NEVER filters the media CDN of other envs (media.<env>.yunicity.city)", () => {
    for (const host of [
      "media.dev.yunicity.city",
      "media.recette.yunicity.city",
      "media.preprod.yunicity.city",
    ]) {
      expect(
        isPendingYunicityHostedCoverUrl(`https://${host}/places/reims/opera-de-reims/cover.jpg`),
      ).toBe(false);
    }
  });

  it("still filters the legacy web-app static host (yunicity.city + www)", () => {
    expect(
      isPendingYunicityHostedCoverUrl("https://www.yunicity.city/places/reims/palais-du-tau/cover.jpg"),
    ).toBe(true);
    // dev-relative path (no host) resolves to the web app → still pending.
    expect(isPendingYunicityHostedCoverUrl("/places/reims/palais-du-tau/cover.jpg")).toBe(true);
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

  it("returns the media.yunicity.city CDN cover (no longer pending, SEED-PROD-01B)", () => {
    const cover = "https://media.yunicity.city/places/reims/frac-grand-est/cover.jpg";
    expect(
      resolveMapPlaceImageUrl({
        hero_image_url: cover,
        image_url: null,
        thumbnail_image_url: null,
      }),
    ).toBe(cover);
  });
});

describe("resolveMapNeighborhoodImageUrl", () => {
  // L'assertion porte sur le COMPORTEMENT — retomber sur l'image éditoriale du
  // quartier — et non sur l'hébergeur qui la sert. Les sources éditoriales ont
  // déjà migré une fois (stock tiers en 404/403 → Wikimedia Commons) ; coupler le
  // test à un domaine le rendait rouge à chaque changement de source légitime.
  it("falls back to the neighborhood editorial image when cover is a pending hosted path", () => {
    const url = resolveMapNeighborhoodImageUrl({
      slug: "boulingrin",
      cover_image_url: "https://yunicity.city/neighborhoods/reims/boulingrin/hero.jpg",
    });
    expect(url).toBe(NEIGHBORHOOD_EDITORIAL_IMAGE_BOULINGRIN);
  });

  it("keeps a real cover untouched", () => {
    const cover = "https://media.yunicity.city/neighborhoods/reims/boulingrin/cover.jpg";
    expect(resolveMapNeighborhoodImageUrl({ slug: "boulingrin", cover_image_url: cover })).toBe(
      cover,
    );
  });
});
