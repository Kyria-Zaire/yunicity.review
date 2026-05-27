import type {
  CulturalPlaceListItem,
  LocalEvent,
  PartnerOffer,
  Tribe,
} from "@yunicity/types";
import { describe, expect, it } from "vitest";

import { EVENT_TYPE_FALLBACK_IMAGES } from "./event-hero-image";
import {
  FEATURED_CAROUSEL_MAX_ITEMS,
  buildFeaturedCarouselItems,
  featuredCarouselHasNoEngagementMetrics,
  featuredEventBadge,
} from "./events-featured-carousel";

const BASE_EVENT: LocalEvent = {
  id: "event-1",
  organization_id: null,
  title: "Marché local bio du Boulingrin",
  description: null,
  event_type: "market",
  city: "Reims",
  district: null,
  starts_at: "2026-06-01T18:00:00Z",
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
  created_at: "2026-05-01T00:00:00Z",
};

const BASE_PLACE: CulturalPlaceListItem = {
  id: "place-1",
  slug: "cathedrale-notre-dame",
  name: "Cathédrale Notre-Dame",
  short_description: "Chef-d'œuvre gothique",
  city: "Reims",
  address: "Place du Cardinal Luçon",
  category: "cathedral",
  latitude: 49.25,
  longitude: 4.03,
  image_alt: null,
  source_name: "seed",
  image_credit: null,
  neighborhood: null,
  image_url: "https://img.example/place.jpg",
  hero_image_url: null,
  thumbnail_image_url: null,
  gallery_images: [],
  editorial_excerpt: null,
  photo_credit: null,
  image_source: null,
};

const BASE_OFFER: PartnerOffer = {
  id: "offer-1",
  organization_id: "org-1",
  title: "Café offert",
  description: null,
  offer_type: "drink",
  tier_code_required: null,
  valid_from: "2026-05-01T00:00:00Z",
  valid_until: "2026-06-02T00:00:00Z",
  organization: {
    id: "org-1",
    slug: "cafe",
    name: "Café du Centre",
    city: "Reims",
    logo_url: "https://img.example/logo.jpg",
  },
};

const BASE_TRIBE: Tribe = {
  id: "t1",
  slug: "cafe-culture",
  name: "Café culture",
  description: "Rencontres",
  city: "Reims",
  category: "cafe_culture",
  visibility: "public",
  persistence_kind: "ongoing",
  cover_image_url: null,
  is_featured: false,
  member_limit: 50,
  active_member_count: 8,
  is_archived: false,
  viewer_is_member: false,
  viewer_role: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

describe("featuredEventBadge", () => {
  it("maps seed event types to French labels aligned with moment cards", () => {
    expect(featuredEventBadge(BASE_EVENT)).toBe("Marché local");
    expect(featuredEventBadge({ ...BASE_EVENT, event_type: "cafe_meetup" })).toBe("Café-rencontre");
    expect(featuredEventBadge({ ...BASE_EVENT, event_type: "meetup" })).toBe("Rencontre locale");
  });
});

describe("buildFeaturedCarouselItems", () => {
  it("uses event title and type badge, not cultural place category", () => {
    const items = buildFeaturedCarouselItems({
      city: "Reims",
      events: [BASE_EVENT],
      culturalPlaces: [BASE_PLACE],
      passportOffers: [],
      tribes: [],
      now: new Date("2026-05-27T12:00:00Z"),
    });
    const eventItem = items.find((i) => i.kind === "event");
    expect(eventItem?.title).toBe("Marché local bio du Boulingrin");
    expect(eventItem?.badge).toBe("Marché local");
    expect(eventItem?.badge).not.toBe("Monument");
    expect(eventItem?.badge).not.toBe("Patrimoine");
    expect(eventItem?.imageUrl).toBe(EVENT_TYPE_FALLBACK_IMAGES.market);
  });

  it("uses place name and category badge for culture cards", () => {
    const items = buildFeaturedCarouselItems({
      city: "Reims",
      events: [],
      culturalPlaces: [BASE_PLACE],
      passportOffers: [],
      tribes: [],
      now: new Date("2026-05-27T12:00:00Z"),
    });
    const cultureItem = items.find((i) => i.kind === "culture");
    expect(cultureItem?.title).toBe("Cathédrale Notre-Dame");
    expect(cultureItem?.badge).toBe("Patrimoine");
  });

  it("respects max items cap", () => {
    const events = Array.from({ length: 10 }, (_, i) => ({
      ...BASE_EVENT,
      id: `e${i}`,
      starts_at: `2026-06-0${(i % 9) + 1}T18:00:00Z`,
    }));
    const items = buildFeaturedCarouselItems({
      city: "Reims",
      events,
      culturalPlaces: [BASE_PLACE],
      passportOffers: [BASE_OFFER],
      tribes: [BASE_TRIBE],
      maxItems: 4,
      now: new Date("2026-05-27T12:00:00Z"),
    });
    expect(items.length).toBeLessThanOrEqual(4);
  });

  it("generates href per kind", () => {
    const items = buildFeaturedCarouselItems({
      city: "Reims",
      events: [BASE_EVENT],
      culturalPlaces: [BASE_PLACE],
      passportOffers: [BASE_OFFER],
      tribes: [BASE_TRIBE],
      now: new Date("2026-05-27T12:00:00Z"),
    });
    expect(items.find((i) => i.kind === "event")?.href).toBe("/events/event-1");
    expect(items.find((i) => i.kind === "culture")?.href).toContain("/map");
    expect(items.find((i) => i.kind === "passport")?.href).toBe("/passport");
    expect(items.find((i) => i.kind === "tribe")?.href).toContain("/tribes/cafe-culture");
  });

  it("never exceeds default max", () => {
    const items = buildFeaturedCarouselItems({
      city: "Reims",
      events: [BASE_EVENT, { ...BASE_EVENT, id: "e2" }],
      culturalPlaces: [BASE_PLACE, { ...BASE_PLACE, id: "p2", slug: "p2", name: "Autre lieu" }],
      passportOffers: [BASE_OFFER],
      tribes: [BASE_TRIBE, { ...BASE_TRIBE, id: "t2", slug: "t2" }],
      now: new Date("2026-05-27T12:00:00Z"),
    });
    expect(items.length).toBeLessThanOrEqual(FEATURED_CAROUSEL_MAX_ITEMS);
  });
});

describe("featuredCarouselHasNoEngagementMetrics", () => {
  it("rejects fake engagement copy", () => {
    expect(
      featuredCarouselHasNoEngagementMetrics([
        {
          id: "x",
          kind: "event",
          title: "Trending now",
          subtitle: "Hot",
          badge: "Moment",
          ctaLabel: "Voir",
          href: "/events/1",
          imageUrl: null,
        },
      ]),
    ).toBe(false);
  });
});
