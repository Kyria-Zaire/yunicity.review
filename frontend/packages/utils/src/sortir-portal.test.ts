import { describe, expect, it } from "vitest";

import type { LocalEvent, Tribe } from "@yunicity/types";

import {
  buildSortirFeaturedToday,
  buildSortirForYouCard,
  buildSortirHeroStats,
  buildSortirLiveEventCards,
  buildSortirTribeTonightItems,
  filterEventsBySortirCategory,
  isEventTonight,
  isNewLocalUserContext,
} from "./sortir-portal";

const BASE_EVENT: LocalEvent = {
  id: "e1",
  organization_id: null,
  title: "Concert Jazz",
  description: "Soirée jazz au centre-ville.",
  event_type: "local_concert",
  city: "Reims",
  district: "Centre-ville",
  starts_at: "2026-05-28T20:00:00.000Z",
  ends_at: null,
  timezone: "Europe/Paris",
  location_name: "Le Millésime",
  address: null,
  latitude: null,
  longitude: null,
  cover_image_url: null,
  moderation_status: "approved",
  is_cancelled: false,
  interested_by_me: false,
  interest_count: 0,
  organization: null,
  neighborhood_summary: { slug: "centre-ville", display_name: "Centre-ville" },
  created_at: "",
};

describe("sortir-portal", () => {
  it("detects tonight events from local evening hour", () => {
    const now = new Date("2026-05-28T16:00:00.000Z");
    expect(isEventTonight(BASE_EVENT, now)).toBe(true);
  });

  it("filters concerts category", () => {
    const exhibition = { ...BASE_EVENT, id: "e2", event_type: "exhibition" };
    const filtered = filterEventsBySortirCategory([BASE_EVENT, exhibition], "concerts");
    expect(filtered.map((event) => event.id)).toEqual(["e1"]);
  });

  it("builds live event cards from API events", () => {
    const cards = buildSortirLiveEventCards({
      city: "Reims",
      events: [BASE_EVENT],
      culturalPlaces: [],
    });
    expect(cards[0]?.title).toBe("Concert Jazz");
    expect(cards[0]?.href).toBe("/events/e1");
  });

  it("builds for-you card from profile interests", () => {
    const card = buildSortirForYouCard({
      city: "Reims",
      events: [BASE_EVENT],
      culturalPlaces: [],
      interests: ["music"],
      now: new Date("2026-05-28T12:00:00.000Z"),
    });
    expect(card?.title).toBe("Concert Jazz");
    expect(card?.interestTags).toContain("Musique");
  });

  it("builds tribe tonight items only for member tribes", () => {
    const tribe: Tribe = {
      id: "t1",
      slug: "jazz-reims",
      name: "Jazz Reims",
      description: "",
      city: "Reims",
      category: "music",
      visibility: "public",
      persistence_kind: "default",
      cover_image_url: null,
      is_featured: false,
      member_limit: 50,
      active_member_count: 3,
      is_archived: false,
      viewer_is_member: true,
      viewer_role: "member",
      created_at: "",
      updated_at: "",
    };
    const items = buildSortirTribeTonightItems({
      city: "Reims",
      events: [{ ...BASE_EVENT, title: "Rencontre Jazz Reims" }],
      tribes: [tribe],
      now: new Date("2026-05-28T16:00:00.000Z"),
    });
    expect(items.length).toBeGreaterThan(0);
    expect(items[0]?.tribeName).toBe("Jazz Reims");
  });

  it("builds hero stats from real array counts without fake metrics", () => {
    const stats = buildSortirHeroStats({
      neighborhoods: [{ slug: "a" }, { slug: "b" }] as never,
      culturalPlaces: [],
      tribes: [{ is_archived: false }] as never,
      events: [],
    });
    expect(stats.find((s) => s.id === "neighborhoods")?.label).toBe("2 quartiers à explorer");
    expect(stats.find((s) => s.id === "places")?.label).toBe("Lieux à découvrir");
    expect(stats.find((s) => s.id === "events")?.label).toBe("À venir côté agenda");
    expect(stats.every((s) => s.count >= 0)).toBe(true);
  });

  it("returns featured today fallback without fake events", () => {
    const featured = buildSortirFeaturedToday({
      city: "Reims",
      events: [],
      culturalPlaces: [],
    });
    expect(featured.kind).toBe("fallback");
    if (featured.kind === "fallback") {
      expect(featured.links.map((l) => l.id)).toEqual([
        "neighborhoods",
        "places",
        "tribes",
        "map",
      ]);
      expect(featured.links.every((l) => l.href.startsWith("/"))).toBe(true);
    }
  });

  it("returns featured today events when upcoming events exist", () => {
    const featured = buildSortirFeaturedToday({
      city: "Reims",
      events: [BASE_EVENT],
      culturalPlaces: [],
    });
    expect(featured.kind).toBe("events");
    if (featured.kind === "events") {
      expect(featured.items[0]?.title).toBe("Concert Jazz");
    }
  });

  it("detects new local user context", () => {
    expect(
      isNewLocalUserContext({
        savedEventCount: 0,
        joinedTribeCount: 0,
        interestCount: 0,
        passportStampsCount: 0,
      }),
    ).toBe(true);
    expect(
      isNewLocalUserContext({
        savedEventCount: 1,
        joinedTribeCount: 0,
        interestCount: 0,
        passportStampsCount: 0,
      }),
    ).toBe(false);
    expect(
      isNewLocalUserContext({
        savedEventCount: 0,
        joinedTribeCount: 0,
        interestCount: 2,
        passportStampsCount: 0,
      }),
    ).toBe(false);
  });
});
