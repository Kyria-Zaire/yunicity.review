import { describe, expect, it } from "vitest";

import type { Tribe } from "@yunicity/types";

import {
  buildCalmLocalTrends,
  buildLocalTrendItems,
  filterLocalNeighborhoods,
  filterLocalTribes,
  filterUpcomingEvents,
  LOCAL_TREND_MAX_ITEMS,
  pickExplorerHero,
  searchPlaceholderForCity,
} from "./search-explorer";

const baseNeighborhood = {
  id: "n1",
  slug: "centre",
  display_name: "Centre-ville",
  city: "Reims",
  short_description: "Cœur historique",
  ambiance: "active" as const,
  cover_image_url: null,
  accent_color: null,
  latitude: null,
  longitude: null,
  radius_meters: null,
  is_featured: true,
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const baseEvent = {
  id: "e1",
  organization_id: null,
  title: "Concert au parc",
  description: null,
  event_type: null,
  city: "Reims",
  district: null,
  starts_at: new Date(Date.now() + 86_400_000).toISOString(),
  ends_at: null,
  timezone: "Europe/Paris",
  location_name: "Parc",
  address: null,
  latitude: null,
  longitude: null,
  cover_image_url: "https://example.com/cover.jpg",
  moderation_status: "approved" as const,
  is_cancelled: false,
  interested_by_me: false,
  organization: null,
  created_at: new Date().toISOString(),
};

const basePlace = {
  id: "p1",
  slug: "opera",
  name: "Opéra",
  short_description: "Scène locale",
  city: "Reims",
  address: "Rue",
  category: "theatre" as const,
  latitude: 49.25,
  longitude: 4.03,
  image_url: null,
  hero_image_url: null,
  thumbnail_image_url: "https://example.com/thumb.jpg",
  gallery_images: [],
  editorial_excerpt: null,
  photo_credit: null,
  image_source: null,
  image_alt: null,
  source_name: "Yunicity",
  image_credit: null,
  neighborhood: null,
};

const baseOffer = {
  id: "o1",
  organization_id: "org1",
  title: "Café offert",
  description: null,
  offer_type: "discount" as const,
  tier_code_required: null,
  valid_from: null,
  valid_until: null,
  organization: {
    id: "org1",
    slug: "cafe-local",
    name: "Café Local",
    city: "Reims",
    logo_url: null,
  },
};

const baseTribe: Tribe = {
  id: "t1",
  slug: "runners",
  name: "Runners Reims",
  description: "Course à pied le dimanche",
  city: "Reims",
  category: "sport",
  visibility: "public",
  persistence_kind: "persistent",
  cover_image_url: null,
  is_featured: false,
  member_limit: 100,
  active_member_count: 12,
  is_archived: false,
  viewer_is_member: false,
  viewer_role: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe("searchPlaceholderForCity", () => {
  it("inclut la ville", () => {
    expect(searchPlaceholderForCity("Reims")).toContain("Reims");
  });
});

describe("pickExplorerHero", () => {
  it("préfère un événement à venir", () => {
    const hero = pickExplorerHero([baseEvent], [basePlace]);
    expect(hero?.kind).toBe("event");
  });
});

describe("buildLocalTrendItems", () => {
  it("compose dans l'ordre éditorial event → lieu → quartier → passport → tribu", () => {
    const items = buildLocalTrendItems({
      city: "Reims",
      neighborhoods: [baseNeighborhood],
      events: [baseEvent],
      culturalPlaces: [basePlace],
      tribes: [baseTribe],
      passportOffers: [baseOffer],
    });

    expect(items).toHaveLength(LOCAL_TREND_MAX_ITEMS);
    expect(items[0]?.type).toBe("event");
    expect(items[1]?.type).toBe("cultural_place");
    expect(items[2]?.type).toBe("neighborhood");
    expect(items[3]?.type).toBe("passport_offer");
    expect(items[4]?.type).toBe("tribe");
  });

  it("génère des hrefs valides", () => {
    const items = buildLocalTrendItems({
      city: "Reims",
      neighborhoods: [baseNeighborhood],
      events: [baseEvent],
      culturalPlaces: [],
      tribes: [],
      passportOffers: [],
    });
    expect(items[0]?.href).toBe("/map?event=e1");
    expect(items[1]?.href).toContain("/neighborhoods/centre");
  });

  it("respecte la limite max de 5 items", () => {
    const items = buildLocalTrendItems({
      city: "Reims",
      neighborhoods: [baseNeighborhood, { ...baseNeighborhood, id: "n2", slug: "b" }],
      events: [baseEvent, { ...baseEvent, id: "e2" }],
      culturalPlaces: [basePlace, { ...basePlace, id: "p2" }],
      tribes: [baseTribe, { ...baseTribe, id: "t2" }],
      passportOffers: [baseOffer, { ...baseOffer, id: "o2" }],
    });
    expect(items.length).toBeLessThanOrEqual(LOCAL_TREND_MAX_ITEMS);
  });

  it("n'inclut pas de métriques fake", () => {
    const items = buildLocalTrendItems({
      city: "Reims",
      neighborhoods: [baseNeighborhood],
      events: [baseEvent],
      culturalPlaces: [basePlace],
      tribes: [baseTribe],
      passportOffers: [baseOffer],
    });
    for (const item of items) {
      expect(item.meta.toLowerCase()).not.toContain("trending");
      expect(item.meta.toLowerCase()).not.toContain("viral");
      expect(item.subtitle).not.toMatch(/\d+\s*k?\s*vues/i);
      expect(item.title).not.toMatch(/\d+\s*k?\s*vues/i);
    }
  });

  it("retourne un tableau vide si aucune source", () => {
    expect(
      buildLocalTrendItems({
        city: "Reims",
        neighborhoods: [],
        events: [],
        culturalPlaces: [],
        tribes: [],
        passportOffers: [],
      }),
    ).toHaveLength(0);
  });

  it("fallback tag éditorial uniquement si d'autres tendances existent", () => {
    const empty = buildLocalTrendItems({
      city: "Reims",
      neighborhoods: [],
      events: [],
      culturalPlaces: [],
      tribes: [],
      passportOffers: [],
    });
    expect(empty).toHaveLength(0);

    const withEventNoTribe = buildLocalTrendItems({
      city: "Reims",
      neighborhoods: [],
      events: [baseEvent],
      culturalPlaces: [],
      tribes: [],
      passportOffers: [],
    });
    expect(withEventNoTribe[0]?.type).toBe("event");
    expect(withEventNoTribe.some((i) => i.type === "editorial_tag")).toBe(true);
  });
});

describe("buildCalmLocalTrends", () => {
  it("compose quartiers et tags éditoriaux (compat)", () => {
    const items = buildCalmLocalTrends({
      city: "Reims",
      neighborhoods: [baseNeighborhood],
      events: [],
      culturalPlaces: [],
    });
    expect(items.some((i) => i.id.startsWith("hood-"))).toBe(true);
  });
});

describe("filterUpcomingEvents", () => {
  it("exclut les événements passés et annulés", () => {
    const past = {
      ...baseEvent,
      id: "past",
      starts_at: new Date(Date.now() - 86_400_000).toISOString(),
    };
    const cancelled = { ...baseEvent, id: "cancel", is_cancelled: true };
    const upcoming = filterUpcomingEvents([past, cancelled, baseEvent]);
    expect(upcoming).toHaveLength(1);
    expect(upcoming[0]?.id).toBe("e1");
  });
});

describe("filterLocalNeighborhoods", () => {
  it("filtre par nom ou slug", () => {
    const filtered = filterLocalNeighborhoods([baseNeighborhood], "centre");
    expect(filtered).toHaveLength(1);
    expect(filterLocalNeighborhoods([baseNeighborhood], "xyz")).toHaveLength(0);
  });

  it("retourne tout si query trop courte", () => {
    expect(filterLocalNeighborhoods([baseNeighborhood], "c")).toHaveLength(1);
  });
});

describe("filterLocalTribes", () => {
  it("filtre par nom", () => {
    expect(filterLocalTribes([baseTribe], "runners")).toHaveLength(1);
    expect(filterLocalTribes([baseTribe], "yoga")).toHaveLength(0);
  });
});
