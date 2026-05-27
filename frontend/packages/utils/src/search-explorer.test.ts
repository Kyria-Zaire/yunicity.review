import { describe, expect, it } from "vitest";

import { buildCalmLocalTrends, pickExplorerHero, searchPlaceholderForCity } from "./search-explorer";

describe("searchPlaceholderForCity", () => {
  it("inclut la ville", () => {
    expect(searchPlaceholderForCity("Reims")).toContain("Reims");
  });
});

describe("pickExplorerHero", () => {
  it("préfère un événement à venir", () => {
    const hero = pickExplorerHero(
      [
        {
          id: "1",
          organization_id: null,
          title: "Concert",
          description: null,
          event_type: null,
          city: "Reims",
          district: null,
          starts_at: new Date(Date.now() + 86_400_000).toISOString(),
          ends_at: null,
          timezone: "Europe/Paris",
          location_name: "Opéra",
          address: null,
          latitude: null,
          longitude: null,
          cover_image_url: null,
          moderation_status: "approved",
          is_cancelled: false,
          interested_by_me: false,
          organization: null,
          created_at: new Date().toISOString(),
        },
      ],
      [
        {
          id: "p1",
          slug: "cathedrale",
          name: "Cathédrale",
          short_description: "Patrimoine",
          city: "Reims",
          address: "Place",
          category: "cathedral",
          latitude: 49.25,
          longitude: 4.03,
          image_url: null,
          image_alt: null,
          source_name: "Yunicity",
          image_credit: null,
          neighborhood: null,
        },
      ],
    );
    expect(hero?.kind).toBe("event");
  });
});

describe("buildCalmLocalTrends", () => {
  it("compose quartiers, événements et tags éditoriaux", () => {
    const items = buildCalmLocalTrends({
      city: "Reims",
      neighborhoods: [
        {
          id: "n1",
          slug: "centre",
          display_name: "Centre-ville",
          city: "Reims",
          short_description: null,
          ambiance: "active",
          cover_image_url: null,
          accent_color: null,
          latitude: null,
          longitude: null,
          radius_meters: null,
          is_featured: true,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
      events: [],
      culturalPlaces: [],
    });
    expect(items.some((i) => i.id.startsWith("hood-"))).toBe(true);
    expect(items.some((i) => i.id.startsWith("tag-"))).toBe(true);
  });
});
