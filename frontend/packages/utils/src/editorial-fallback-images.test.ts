import { describe, expect, it } from "vitest";

import type { LocalEvent, Neighborhood, Tribe } from "@yunicity/types";

import {
  EDITORIAL_IMAGE_ATELIER_PHOTO_URBAIN,
  EDITORIAL_IMAGE_CAFE_RENCONTRE_ENTREPRENEURS,
  EDITORIAL_IMAGE_CAFES_LECTURE,
  EDITORIAL_IMAGE_MUSIQUE_LOCALE,
  NEIGHBORHOOD_EDITORIAL_IMAGE_BOULINGRIN,
  NEIGHBORHOOD_EDITORIAL_IMAGE_CENTRE_VILLE,
  resolveEventEditorialImage,
  resolveNeighborhoodEditorialImage,
  resolveTribeEditorialImage,
} from "./editorial-fallback-images";

const baseEvent = (overrides: Partial<LocalEvent>): LocalEvent => ({
  id: "e1",
  organization_id: null,
  title: "Test",
  description: null,
  event_type: "meetup",
  city: "Reims",
  district: null,
  starts_at: "2026-06-01T18:00:00Z",
  ends_at: null,
  timezone: "Europe/Paris",
  location_name: "Reims",
  address: null,
  latitude: null,
  longitude: null,
  cover_image_url: null,
  moderation_status: "approved",
  is_cancelled: false,
  interested_by_me: false,
  organization: null,
  created_at: "2026-01-01T00:00:00Z",
  ...overrides,
});

const baseTribe = (overrides: Partial<Tribe>): Tribe => ({
  id: "t1",
  slug: "cafes-lecture",
  name: "Cafés & lecture",
  description: "Test",
  city: "Reims",
  category: "cafe_culture",
  visibility: "public",
  persistence_kind: "ongoing",
  cover_image_url: null,
  is_featured: true,
  member_limit: 50,
  active_member_count: 1,
  is_archived: false,
  viewer_is_member: false,
  viewer_role: null,
  viewer_notifications_muted: false,
  viewer_has_pending_join_request: false,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  ...overrides,
});

describe("resolveEventEditorialImage", () => {
  it("maps demo event titles to Unsplash URLs", () => {
    expect(
      resolveEventEditorialImage(
        baseEvent({ title: "Café-rencontre des entrepreneurs", event_type: "meetup" }),
      ),
    ).toBe(EDITORIAL_IMAGE_CAFE_RENCONTRE_ENTREPRENEURS);
    expect(
      resolveEventEditorialImage(baseEvent({ title: "Atelier photo urbain", event_type: "workshop" })),
    ).toBe(EDITORIAL_IMAGE_ATELIER_PHOTO_URBAIN);
  });
});

const baseNeighborhood = (overrides: Partial<Neighborhood>): Neighborhood => ({
  id: "h1",
  city: "Reims",
  slug: "centre-ville",
  display_name: "Centre-ville",
  short_description: null,
  ambiance: "lively",
  cover_image_url: null,
  accent_color: null,
  latitude: null,
  longitude: null,
  radius_meters: null,
  is_featured: true,
  is_active: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  ...overrides,
});

describe("resolveNeighborhoodEditorialImage", () => {
  it("maps Reims neighborhood slugs to Wikimedia Commons URLs", () => {
    expect(resolveNeighborhoodEditorialImage(baseNeighborhood({ slug: "centre-ville" }))).toBe(
      NEIGHBORHOOD_EDITORIAL_IMAGE_CENTRE_VILLE,
    );
    expect(NEIGHBORHOOD_EDITORIAL_IMAGE_CENTRE_VILLE).toContain("commons.wikimedia.org");
    expect(resolveNeighborhoodEditorialImage(baseNeighborhood({ slug: "boulingrin" }))).toBe(
      NEIGHBORHOOD_EDITORIAL_IMAGE_BOULINGRIN,
    );
    expect(resolveNeighborhoodEditorialImage(baseNeighborhood({ slug: "cernay-jean-jaures" }))).toContain(
      "commons.wikimedia.org",
    );
    expect(resolveNeighborhoodEditorialImage(baseNeighborhood({ slug: "chatillons" }))).toContain(
      "commons.wikimedia.org",
    );
    expect(resolveNeighborhoodEditorialImage(baseNeighborhood({ slug: "courlancy" }))).toContain(
      "commons.wikimedia.org",
    );
  });

  it("prefers cover_image_url when present", () => {
    const cover = "https://example.com/hood.jpg";
    expect(
      resolveNeighborhoodEditorialImage(baseNeighborhood({ slug: "boulingrin", cover_image_url: cover })),
    ).toBe(cover);
  });

  it("ignore les hero.jpg seed placeholders et utilise l’éditorial slug", () => {
    expect(
      resolveNeighborhoodEditorialImage(
        baseNeighborhood({
          slug: "centre-ville",
          cover_image_url: "https://yunicity.city/neighborhoods/reims/centre-ville/hero.jpg",
        }),
      ),
    ).toBe(NEIGHBORHOOD_EDITORIAL_IMAGE_CENTRE_VILLE);
  });
});

describe("resolveTribeEditorialImage", () => {
  it("maps demo tribe slugs to Unsplash URLs", () => {
    expect(resolveTribeEditorialImage(baseTribe({ slug: "cafes-lecture" }))).toBe(
      EDITORIAL_IMAGE_CAFES_LECTURE,
    );
    expect(resolveTribeEditorialImage(baseTribe({ slug: "musique-locale", category: "music" }))).toBe(
      EDITORIAL_IMAGE_MUSIQUE_LOCALE,
    );
  });
});
