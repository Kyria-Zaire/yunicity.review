import { describe, expect, it } from "vitest";

import type {
  CulturalPlaceListItem,
  LocalEvent,
  Neighborhood,
  PartnerOffer,
  Tribe,
  TribeMember,
} from "@yunicity/types";

import {
  buildTribeAgenda,
  buildTribeLifestyleSlices,
  buildTribeMapHref,
  buildTribeNarrative,
  buildTribePortraits,
  tribeDetailHasNoFakeMetrics,
} from "./tribe-detail";

function tribe(overrides: Partial<Tribe> = {}): Tribe {
  return {
    id: "t1",
    slug: "club-lecteurs",
    name: "Club des Lecteurs",
    description: "Rencontres autour des livres à Reims",
    city: "Reims",
    category: "cafe_culture",
    visibility: "public",
    persistence_kind: "local",
    cover_image_url: null,
    is_featured: true,
    member_limit: 120,
    active_member_count: 24,
    is_archived: false,
    viewer_is_member: false,
    viewer_role: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function event(overrides: Partial<LocalEvent> = {}): LocalEvent {
  return {
    id: "e1",
    organization_id: null,
    title: "Soirée Club des Lecteurs",
    description: "Lecture et échange au centre-ville",
    event_type: "workshop",
    city: "Reims",
    district: "Centre-ville",
    starts_at: "2026-08-10T18:30:00.000Z",
    ends_at: "2026-08-10T20:30:00.000Z",
    timezone: "Europe/Paris",
    location_name: "Bibliothèque Carnegie",
    address: "Place Carnegie",
    latitude: 49.25,
    longitude: 4.03,
    cover_image_url: null,
    moderation_status: "approved",
    is_cancelled: false,
    interested_by_me: false,
    organization: null,
    neighborhood_summary: { slug: "centre-ville", display_name: "Centre-ville" },
    created_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function place(overrides: Partial<CulturalPlaceListItem> = {}): CulturalPlaceListItem {
  return {
    id: "p1",
    slug: "carnegie",
    name: "Bibliothèque Carnegie",
    short_description: "Lieu calme pour lire",
    city: "Reims",
    address: "Place Carnegie",
    category: "library",
    latitude: 49.25,
    longitude: 4.03,
    image_url: null,
    hero_image_url: null,
    thumbnail_image_url: null,
    gallery_images: [],
    editorial_excerpt: null,
    photo_credit: null,
    image_source: null,
    image_alt: null,
    source_name: "seed",
    image_credit: null,
    neighborhood: { slug: "centre-ville", display_name: "Centre-ville" },
    ...overrides,
  };
}

function hood(overrides: Partial<Neighborhood> = {}): Neighborhood {
  return {
    id: "n1",
    city: "Reims",
    slug: "centre-ville",
    display_name: "Centre-ville",
    short_description: "Cœur vivant",
    ambiance: "cultural",
    cover_image_url: null,
    accent_color: null,
    latitude: 49.25,
    longitude: 4.03,
    radius_meters: 600,
    is_featured: true,
    is_active: true,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("tribe-detail helpers", () => {
  it("construit un récit humain depuis des données réelles", () => {
    const text = buildTribeNarrative({
      tribe: tribe(),
      events: [event()],
      places: [place()],
      neighborhoods: [hood()],
    });
    expect(text.toLowerCase()).toContain("club des lecteurs");
    expect(text.length).toBeGreaterThan(20);
  });

  it("construit un agenda lié à la tribu", () => {
    const agenda = buildTribeAgenda({
      tribe: tribe(),
      events: [event(), event({ id: "e2", title: "Concert jazz local" })],
      city: "Reims",
    });
    expect(agenda.length).toBe(1);
    expect(agenda[0]?.href).toBe("/events/e1");
  });

  it("génère des portraits humains avec fallback calme", () => {
    const portraitsFallback = buildTribePortraits({
      tribe: tribe(),
      members: [],
      neighborhoods: [hood()],
      places: [place()],
    });
    expect(portraitsFallback.length).toBe(1);

    const members: TribeMember[] = [{ user_id: "abcdef123456", role: "member", joined_at: "2026-01-01" }];
    const portraitsMembers = buildTribePortraits({
      tribe: tribe(),
      members,
      neighborhoods: [hood()],
      places: [place()],
    });
    expect(portraitsMembers[0]?.name).toContain("Membre");
  });

  it("construit des slices lifestyle réalistes", () => {
    const offers: PartnerOffer[] = [];
    const slices = buildTribeLifestyleSlices({
      city: "Reims",
      tribe: tribe(),
      events: [event()],
      places: [place()],
      offers,
    });
    expect(slices.length).toBeGreaterThan(0);
  });

  it("construit le lien map tribu et détecte les fake metrics", () => {
    expect(buildTribeMapHref("club-lecteurs", "Reims")).toContain("/map?tribe=club-lecteurs");
    expect(tribeDetailHasNoFakeMetrics(["Rencontres locales calmes"])).toBe(true);
    expect(tribeDetailHasNoFakeMetrics(["Trending 12k users"])).toBe(false);
  });
});
