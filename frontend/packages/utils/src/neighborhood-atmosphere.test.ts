import type { CulturalPlaceListItem, LocalEvent, Neighborhood } from "@yunicity/types";
import { describe, expect, it } from "vitest";

import { eventCalendarDayKey } from "./events-agenda";
import { NEIGHBORHOOD_EDITORIAL_IMAGE_BOULINGRIN } from "./editorial-fallback-images";
import {
  buildNeighborhoodAtmosphereEditorialLine,
  buildNeighborhoodAtmosphereItems,
  eventBelongsToNeighborhood,
  neighborhoodAtmosphereHasNoEngagementMetrics,
} from "./neighborhood-atmosphere";

const NOW = new Date("2026-05-27T14:00:00");
const TODAY_KEY = eventCalendarDayKey(NOW.toISOString());

const BASE_HOOD: Neighborhood = {
  id: "h1",
  city: "Reims",
  slug: "boulingrin",
  display_name: "Boulingrin",
  short_description: "Halles et terrasses",
  ambiance: "lively",
  cover_image_url: null,
  accent_color: "#EEF0FF",
  latitude: 49.2565,
  longitude: 4.0285,
  radius_meters: 500,
  is_featured: true,
  is_active: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const BASE_EVENT = (overrides: Partial<LocalEvent> = {}): LocalEvent => ({
  id: "e1",
  organization_id: null,
  title: "Marché",
  description: null,
  event_type: "market",
  city: "Reims",
  district: "Boulingrin",
  starts_at: `${TODAY_KEY}T10:00:00Z`,
  ends_at: null,
  timezone: "Europe/Paris",
  location_name: "Boulingrin",
  address: null,
  latitude: 49.25,
  longitude: 4.03,
  cover_image_url: null,
  moderation_status: "approved",
  is_cancelled: false,
  interested_by_me: false,
  organization: null,
  created_at: "2026-01-01T00:00:00Z",
  ...overrides,
});

const BASE_PLACE = (overrides: Partial<CulturalPlaceListItem> = {}): CulturalPlaceListItem => ({
  id: "p1",
  slug: "cathedrale",
  name: "Cathédrale",
  short_description: "Patrimoine",
  city: "Reims",
  address: "Place",
  category: "cathedral",
  latitude: 49.25,
  longitude: 4.03,
  image_alt: null,
  source_name: "seed",
  image_credit: null,
  neighborhood: { slug: "centre-ville", display_name: "Centre-ville" },
  image_url: "https://example.com/cathedral.jpg",
  hero_image_url: null,
  thumbnail_image_url: null,
  gallery_images: [],
  editorial_excerpt: null,
  photo_credit: null,
  image_source: null,
  ...overrides,
});

describe("eventBelongsToNeighborhood", () => {
  it("matches neighborhood_summary slug", () => {
    expect(
      eventBelongsToNeighborhood(
        BASE_EVENT({
          neighborhood_summary: { slug: "boulingrin", display_name: "Boulingrin" },
          district: null,
        }),
        BASE_HOOD,
      ),
    ).toBe(true);
  });

  it("matches district name", () => {
    expect(eventBelongsToNeighborhood(BASE_EVENT(), BASE_HOOD)).toBe(true);
  });
});

describe("buildNeighborhoodAtmosphereEditorialLine", () => {
  it("uses calm fallback when no activity today", () => {
    const line = buildNeighborhoodAtmosphereEditorialLine(
      { ...BASE_HOOD, ambiance: "calm" },
      {
        eventsToday: [],
        eveningEvents: [],
        lateEveningEvents: [],
        culturalToday: [],
        livelyToday: [],
        studentToday: [],
        upcomingWeek: [],
        places: [],
      },
      true,
    );
    expect(line).toBe("Quartier plus calme aujourd’hui.");
  });

  it("describes market vitality during the day", () => {
    const event = BASE_EVENT({ event_type: "market" });
    const line = buildNeighborhoodAtmosphereEditorialLine(
      BASE_HOOD,
      {
        eventsToday: [event],
        eveningEvents: [],
        lateEveningEvents: [],
        culturalToday: [],
        livelyToday: [event],
        studentToday: [],
        upcomingWeek: [event],
        places: [],
      },
      true,
    );
    expect(line).toContain("terrasses et marchés");
  });

  it("mentions evening energy after 20h", () => {
    const event = BASE_EVENT({
      event_type: "meetup",
      starts_at: `${TODAY_KEY}T20:30:00Z`,
    });
    const line = buildNeighborhoodAtmosphereEditorialLine(
      { ...BASE_HOOD, slug: "centre-ville", display_name: "Centre-ville" },
      {
        eventsToday: [event],
        eveningEvents: [event],
        lateEveningEvents: [event],
        culturalToday: [],
        livelyToday: [event],
        studentToday: [],
        upcomingWeek: [event],
        places: [],
      },
      true,
    );
    expect(line).toContain("20 h");
  });

  it("mentions cultural outings in the evening", () => {
    const event = BASE_EVENT({
      event_type: "exhibition",
      starts_at: `${TODAY_KEY}T19:00:00Z`,
      district: "Saint-Remi",
    });
    const line = buildNeighborhoodAtmosphereEditorialLine(
      { ...BASE_HOOD, slug: "saint-remi", display_name: "Saint-Remi", ambiance: "cultural" },
      {
        eventsToday: [event],
        eveningEvents: [event],
        lateEveningEvents: [],
        culturalToday: [event],
        livelyToday: [],
        studentToday: [],
        upcomingWeek: [event],
        places: [BASE_PLACE({ neighborhood: { slug: "saint-remi", display_name: "Saint-Remi" } })],
      },
      true,
    );
    expect(line).toContain("culturelles");
    expect(line).toContain("ce soir");
  });
});

describe("buildNeighborhoodAtmosphereItems", () => {
  it("builds items from real neighborhood and event data", () => {
    const items = buildNeighborhoodAtmosphereItems({
      city: "Reims",
      neighborhoods: [BASE_HOOD],
      events: [BASE_EVENT()],
      culturalPlaces: [],
      now: NOW,
    });
    expect(items).toHaveLength(1);
    expect(items[0]?.name).toBe("Boulingrin");
    expect(items[0]?.tags).toContain("calme");
    expect(items[0]?.neighborhoodHref).toContain("/neighborhoods/boulingrin");
    expect(items[0]?.mapHref).toContain("/map");
    expect(items[0]?.imageUrl).toBe(NEIGHBORHOOD_EDITORIAL_IMAGE_BOULINGRIN);
  });

  it("never injects engagement metrics", () => {
    const items = buildNeighborhoodAtmosphereItems({
      city: "Reims",
      neighborhoods: [BASE_HOOD, { ...BASE_HOOD, id: "h2", slug: "cernay", display_name: "Cernay", ambiance: "calm", is_featured: false }],
      events: [BASE_EVENT(), BASE_EVENT({ id: "e2", district: "Cernay", event_type: "student_event" })],
      culturalPlaces: [BASE_PLACE()],
      now: NOW,
    });
    expect(neighborhoodAtmosphereHasNoEngagementMetrics(items)).toBe(true);
    expect(items.every((item) => !/\d+\s*personnes/i.test(item.editorialLine))).toBe(true);
  });
});
