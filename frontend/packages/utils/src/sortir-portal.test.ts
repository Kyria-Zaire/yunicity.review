import { describe, expect, it } from "vitest";

import type { LocalEvent, Tribe } from "@yunicity/types";

import {
  buildSortirFeaturedToday,
  buildSortirForYouCard,
  buildSortirHeroStats,
  buildSortirLiveEventCards,
  buildSortirTribeTonightItems,
  filterEventsBySortirCategory,
  filterSortirEventsByDesktopToggles,
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
    expect(cards[0]?.badge).toBe("MUSIQUE");
    expect(cards[0]?.badgeTone).toBe("concert");
    expect(cards[0]?.metaLine).not.toBe("Places limitées");
  });

  it("laisse musique / food / vie locale dans Ce soir hors à-la-une expo", () => {
    const now = new Date("2026-08-29T20:15:00.000Z");
    const exhibition = {
      ...BASE_EVENT,
      id: "feat",
      title: "Visite nocturne de la cathédrale",
      event_type: "exhibition",
      description: "Une découverte lumineuse du patrimoine rémois ce soir.",
      cover_image_url: "https://cdn.example/cathedrale.jpg",
      starts_at: "2026-08-29T18:30:00.000Z",
      ends_at: "2026-08-29T21:45:00.000Z",
    };
    const music = {
      ...BASE_EVENT,
      id: "music",
      title: "Live au Cryptoportique",
      event_type: "local_concert",
      description: "Concert live sous les voûtes gallo-romaines du centre.",
      cover_image_url: "https://cdn.example/music.png",
      starts_at: "2026-08-29T17:30:00.000Z",
      ends_at: "2026-08-29T21:45:00.000Z",
    };
    const food = {
      ...BASE_EVENT,
      id: "food",
      title: "Nocturne du Boulingrin",
      event_type: "local_market",
      description: "Marché nocturne, food trucks et ambiance locale aux Halles.",
      cover_image_url: "https://cdn.example/food.png",
      starts_at: "2026-08-29T16:00:00.000Z",
      ends_at: "2026-08-29T21:45:00.000Z",
    };
    const local = {
      ...BASE_EVENT,
      id: "local",
      title: "Apéro Place d'Erlon",
      event_type: "cafe_meetup",
      description: "Rencontre conviviale en terrasse au cœur de Reims.",
      cover_image_url: "https://cdn.example/local.png",
      starts_at: "2026-08-29T19:00:00.000Z",
      ends_at: "2026-08-29T21:45:00.000Z",
    };
    const events = [exhibition, music, food, local];
    const featured = buildSortirFeaturedToday({
      city: "Reims",
      events,
      culturalPlaces: [],
      now,
    });
    expect(featured.kind).toBe("events");
    const featuredId = featured.kind === "events" ? featured.items[0]?.id : undefined;
    expect(featuredId).toBe("feat");

    const tonight = buildSortirLiveEventCards({
      city: "Reims",
      events,
      culturalPlaces: [],
      categoryId: "tonight",
      maxItems: 12,
      now,
    })
      .filter((card) => card.id !== featuredId)
      .slice(0, 3);

    expect(tonight.map((card) => card.badge)).toEqual(["FOOD", "MUSIQUE", "VIE LOCALE"]);
  });

  it("uses interest count in live event meta line", () => {
    const cards = buildSortirLiveEventCards({
      city: "Reims",
      events: [{ ...BASE_EVENT, interest_count: 3 }],
      culturalPlaces: [],
    });
    expect(cards[0]?.metaLine).toBe("3 intéressés");
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
      viewer_notifications_muted: false,
      viewer_has_pending_join_request: false,
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

  it("prioritize à la une with cover image and rich description", () => {
    const plain = {
      ...BASE_EVENT,
      id: "plain-event",
      title: "Apéro simple",
      description: "Court.",
      starts_at: "2026-03-20T18:00:00.000Z",
      cover_image_url: null,
    };
    const spotlight = {
      ...BASE_EVENT,
      id: "spotlight-event",
      title: "Visite nocturne de la cathédrale",
      description: "Une découverte lumineuse du patrimoine rémois.",
      starts_at: "2026-03-20T20:30:00.000Z",
      cover_image_url: "https://example.com/cathedrale.jpg",
      event_type: "exhibition",
    };
    const featured = buildSortirFeaturedToday({
      city: "Reims",
      events: [plain, spotlight],
      culturalPlaces: [],
      now: new Date("2026-03-20T12:00:00.000Z"),
    });
    expect(featured.kind).toBe("events");
    if (featured.kind === "events") {
      expect(featured.items[0]?.title).toBe("Visite nocturne de la cathédrale");
      expect(featured.items[0]?.imageUrl).toContain("cathedrale");
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

  it("filtre Gratuit via titre / description", () => {
    const free = {
      ...BASE_EVENT,
      id: "free",
      title: "Visite gratuite du musée",
      description: "Entrée libre toute la journée.",
    };
    const paid = {
      ...BASE_EVENT,
      id: "paid",
      title: "Concert privé",
      description: "Billetterie sur place.",
    };
    const filtered = filterSortirEventsByDesktopToggles([free, paid], {
      free: true,
      nearby: false,
      accessible: false,
      indoor: false,
    });
    expect(filtered.map((event) => event.id)).toEqual(["free"]);
  });

  it("filtre À moins de 3 km avec origin geo", () => {
    const near = {
      ...BASE_EVENT,
      id: "near",
      latitude: 49.2583,
      longitude: 4.0317,
    };
    const far = {
      ...BASE_EVENT,
      id: "far",
      latitude: 49.5,
      longitude: 4.5,
    };
    const filtered = filterSortirEventsByDesktopToggles(
      [near, far],
      { free: false, nearby: true, accessible: false, indoor: false },
      { latitude: 49.2583, longitude: 4.0317 },
    );
    expect(filtered.map((event) => event.id)).toEqual(["near"]);
  });

  it("filtre Accessible et En intérieur via signaux texte", () => {
    const accessibleIndoor = {
      ...BASE_EVENT,
      id: "ok",
      title: "Expo accessible PMR",
      description: "Salle intérieure climatisée.",
      location_name: "Musée des Beaux-Arts",
    };
    const outdoor = {
      ...BASE_EVENT,
      id: "out",
      title: "Marché en plein air",
      description: "Sur le parvis extérieur.",
      location_name: "Parc de Champagne",
    };
    const filtered = filterSortirEventsByDesktopToggles([accessibleIndoor, outdoor], {
      free: false,
      nearby: false,
      accessible: true,
      indoor: true,
    });
    expect(filtered.map((event) => event.id)).toEqual(["ok"]);
  });
});
