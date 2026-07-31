import { describe, expect, it } from "vitest";

import type { CulturalPlaceListItem, LocalEvent, Neighborhood, Tribe } from "@yunicity/types";

import {
  buildCityNeighborhoodPulse,
  buildNeighborhoodCards,
  buildNeighborhoodFeaturedCards,
  buildNeighborhoodLifeSlices,
  buildNeighborhoodListCards,
  buildNeighborhoodsPortalStats,
  filterNeighborhoodCardsByMood,
  neighborhoodPortalHasNoFakeMetrics,
  resolveNeighborhoodFeaturedHeadline,
  resolveNeighborhoodsPortalHeroImage,
} from "./neighborhood-portal";
import { NEIGHBORHOODS_PORTAL_HERO_IMAGE_URL } from "./editorial-fallback-images";

const HOOD: Neighborhood = {
  id: "h1",
  city: "Reims",
  slug: "boulingrin",
  display_name: "Boulingrin",
  short_description: "Halles et terrasses.",
  ambiance: "lively",
  cover_image_url: null,
  accent_color: null,
  latitude: 49.25,
  longitude: 4.03,
  radius_meters: 500,
  is_featured: true,
  is_active: true,
  created_at: "",
  updated_at: "",
};

function event(overrides: Partial<LocalEvent> = {}): LocalEvent {
  return {
    id: "e1",
    organization_id: null,
    title: "Marché local",
    description: null,
    event_type: "market",
    city: "Reims",
    district: "Boulingrin",
    starts_at: "2026-06-01T10:00:00.000Z",
    ends_at: null,
    timezone: "Europe/Paris",
    location_name: "Halles",
    address: null,
    latitude: null,
    longitude: null,
    cover_image_url: null,
    moderation_status: "approved",
    is_cancelled: false,
    interested_by_me: false,
    interest_count: 0,
    organization: null,
    neighborhood_summary: { slug: "boulingrin", display_name: "Boulingrin" },
    created_at: "",
    ...overrides,
  };
}

const PLACE: CulturalPlaceListItem = {
  id: "p1",
  slug: "halles",
  name: "Halles du Boulingrin",
  short_description: "Marché couvert",
  city: "Reims",
  address: "Rue de Mars",
  category: "patrimoine",
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
  neighborhood: { slug: "boulingrin", display_name: "Boulingrin" },
};

const TRIBE: Tribe = {
  id: "t1",
  slug: "photo-reims",
  name: "Photo Reims",
  description: "Sorties photo",
  city: "Reims",
  category: "photography",
  visibility: "public",
  persistence_kind: "default",
  cover_image_url: null,
  is_featured: true,
  member_limit: 120,
  active_member_count: 12,
  is_archived: false,
  viewer_is_member: false,
  viewer_role: null,
  viewer_notifications_muted: false,
  viewer_has_pending_join_request: false,
  created_at: "",
  updated_at: "",
};

const OFFER = {
  id: "o1",
  slug: "brunch-local",
  title: "Brunch local",
  description: null,
  value_label: null,
  offer_type: "discount" as const,
  conditions: null,
  tier_code_required: null,
  valid_from: null,
  valid_until: null,
  is_featured: false,
  partner: {
    name: "Café du Centre",
    slug: "cafe-centre",
    logo_url: null,
    cover_image_url: null,
    category: null,
    city: "Reims",
    is_verified: true,
    partner_status: "active" as const,
  },
};

describe("neighborhood-portal", () => {
  it("buildCityNeighborhoodPulse produit des lignes éditoriales réelles", () => {
    const pulse = buildCityNeighborhoodPulse({
      city: "Reims",
      neighborhoods: [HOOD],
      events: [event()],
      culturalPlaces: [PLACE],
      weatherCalm: true,
    });
    expect(pulse).toHaveLength(1);
    expect(pulse[0]?.href).toContain("/neighborhoods/boulingrin");
    expect(neighborhoodPortalHasNoFakeMetrics(pulse.map((item) => item.line))).toBe(true);
  });

  it("buildNeighborhoodCards inclut href et signaux sans score", () => {
    const cards = buildNeighborhoodCards({
      city: "Reims",
      neighborhoods: [HOOD],
      events: [event()],
      culturalPlaces: [PLACE],
      tribes: [TRIBE],
      offers: [OFFER],
    });
    expect(cards).toHaveLength(1);
    expect(cards[0]?.href).toContain("/neighborhoods/boulingrin");
    expect(cards[0]?.signals.length).toBeGreaterThan(0);
    expect(neighborhoodPortalHasNoFakeMetrics([cards[0]!.tagline, cards[0]!.ambianceLabel])).toBe(true);
  });

  it("filterNeighborhoodCardsByMood filtre par envie", () => {
    const cards = buildNeighborhoodCards({
      city: "Reims",
      neighborhoods: [HOOD],
      events: [event()],
      culturalPlaces: [PLACE],
      tribes: [],
      offers: [],
    });
    expect(filterNeighborhoodCardsByMood(cards, "famille")).toHaveLength(1);
    expect(filterNeighborhoodCardsByMood(cards, "cafe-lecture")).toHaveLength(0);
  });

  it("buildNeighborhoodLifeSlices limite à 4 items", () => {
    const slices = buildNeighborhoodLifeSlices({
      city: "Reims",
      events: [event()],
      culturalPlaces: [PLACE],
      tribes: [TRIBE],
      offers: [OFFER],
      maxItems: 4,
    });
    expect(slices).toHaveLength(4);
  });

  it("fallback calme sans données", () => {
    const pulse = buildCityNeighborhoodPulse({
      city: "Reims",
      neighborhoods: [HOOD],
      events: [],
      culturalPlaces: [],
      weatherCalm: true,
    });
    expect(pulse[0]?.line.toLowerCase()).toContain("calme");
  });

  it("resolveNeighborhoodsPortalHeroImage utilise l’URL éditoriale fixe", () => {
    expect(resolveNeighborhoodsPortalHeroImage([], [])).toBe(NEIGHBORHOODS_PORTAL_HERO_IMAGE_URL);
  });

  it("buildNeighborhoodsPortalStats agrège des compteurs réels", () => {
    const cafePlace: CulturalPlaceListItem = {
      ...PLACE,
      id: "p2",
      slug: "cafe-boul",
      name: "Café du marché",
      category: "gastronomie",
    };
    const stats = buildNeighborhoodsPortalStats({
      neighborhoods: [HOOD],
      events: [event()],
      culturalPlaces: [PLACE, cafePlace],
    });
    expect(stats.neighborhoodsCount).toBe(1);
    expect(stats.activeMomentsCount).toBe(1);
    expect(stats.cafesCount).toBe(1);
    expect(stats.eventsThisWeek).toBeGreaterThanOrEqual(0);
  });

  it("buildNeighborhoodFeaturedCards expose stats par quartier", () => {
    const cards = buildNeighborhoodFeaturedCards({
      city: "Reims",
      neighborhoods: [HOOD],
      events: [event()],
      culturalPlaces: [PLACE],
    });
    expect(cards).toHaveLength(1);
    expect(cards[0]?.headline).toBe(resolveNeighborhoodFeaturedHeadline(HOOD));
    expect(cards[0]?.momentsCount).toBe(1);
    expect(cards[0]?.href).toContain("/neighborhoods/boulingrin");
  });

  it("buildNeighborhoodListCards exclut les slugs à la une", () => {
    const other: Neighborhood = {
      ...HOOD,
      id: "h2",
      slug: "cernay",
      display_name: "Cernay",
      is_featured: false,
    };
    const list = buildNeighborhoodListCards({
      city: "Reims",
      neighborhoods: [HOOD, other],
      events: [event()],
      excludeSlugs: ["boulingrin"],
    });
    expect(list).toHaveLength(1);
    expect(list[0]?.slug).toBe("cernay");
  });
});

