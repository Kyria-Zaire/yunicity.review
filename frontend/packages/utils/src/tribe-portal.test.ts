import { describe, expect, it } from "vitest";

import type {
  CulturalPlaceListItem,
  LocalEvent,
  Neighborhood,
  PartnerOffer,
  PassportMe,
  Tribe,
} from "@yunicity/types";

import {
  buildFeaturedTribe,
  buildNearbyActiveTribes,
  buildPassportProgressionCopy,
  buildTribeEditorialStory,
  buildTribeLifeSlices,
  buildTribeMomentsTimeline,
  buildTribePortalCards,
  filterTribePortalCardsByTheme,
  tribePortalHasNoFakeMetrics,
} from "./tribe-portal";

const BASE_TRIBE: Tribe = {
  id: "t1",
  slug: "club-lecteurs",
  name: "Club des Lecteurs",
  description: "Café, lecture et balades littéraires.",
  city: "Reims",
  category: "cafe_culture",
  visibility: "public",
  persistence_kind: "default",
  cover_image_url: null,
  is_featured: true,
  member_limit: 80,
  active_member_count: 16,
  is_archived: false,
  viewer_is_member: false,
  viewer_role: null,
  created_at: "",
  updated_at: "",
};

const BASE_EVENT: LocalEvent = {
  id: "e1",
  organization_id: null,
  title: "Rencontre Club des Lecteurs",
  description: "La tribu Club des Lecteurs se retrouve autour d’un café.",
  event_type: "meetup",
  city: "Reims",
  district: "Centre-ville",
  starts_at: "2026-06-01T18:30:00.000Z",
  ends_at: null,
  timezone: "Europe/Paris",
  location_name: "Médiathèque",
  address: null,
  latitude: null,
  longitude: null,
  cover_image_url: null,
  moderation_status: "approved",
  is_cancelled: false,
  interested_by_me: false,
  organization: null,
  neighborhood_summary: { slug: "centre-ville", display_name: "Centre-ville" },
  created_at: "",
};

const BASE_HOOD: Neighborhood = {
  id: "h1",
  city: "Reims",
  slug: "centre-ville",
  display_name: "Centre-ville",
  short_description: null,
  ambiance: "lively",
  cover_image_url: null,
  accent_color: null,
  latitude: 49.25,
  longitude: 4.03,
  radius_meters: null,
  is_featured: true,
  is_active: true,
  created_at: "",
  updated_at: "",
};

const BASE_PLACE: CulturalPlaceListItem = {
  id: "p1",
  slug: "bibliotheque-carnegie",
  name: "Bibliothèque Carnegie",
  short_description: "Lecture et patrimoine",
  city: "Reims",
  address: "2 Place Carnegie",
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
};

const BASE_OFFER: PartnerOffer = {
  id: "o1",
  organization_id: "org",
  title: "Offre lecture",
  description: null,
  offer_type: "discount",
  tier_code_required: null,
  valid_from: null,
  valid_until: null,
  organization: { id: "org", slug: "librairie", name: "Librairie locale", city: "Reims", logo_url: null },
};

describe("tribe-portal helpers", () => {
  it("selects featured tribe", () => {
    expect(buildFeaturedTribe([BASE_TRIBE])?.slug).toBe("club-lecteurs");
  });

  it("builds cards and filters by theme", () => {
    const cards = buildTribePortalCards({
      city: "Reims",
      tribes: [BASE_TRIBE],
      neighborhoods: [BASE_HOOD],
    });
    expect(cards).toHaveLength(1);
    expect(filterTribePortalCardsByTheme(cards, "lecture")).toHaveLength(1);
    expect(filterTribePortalCardsByTheme(cards, "sport-doux")).toHaveLength(0);
  });

  it("builds moments timeline from linked events", () => {
    const items = buildTribeMomentsTimeline({
      city: "Reims",
      tribes: [BASE_TRIBE],
      events: [BASE_EVENT],
    });
    expect(items).toHaveLength(1);
    expect(items[0]?.tribeName).toContain("Lecteurs");
  });

  it("builds nearby tribes and editorial story", () => {
    const nearby = buildNearbyActiveTribes({
      city: "Reims",
      tribes: [BASE_TRIBE],
      neighborhoods: [BASE_HOOD],
    });
    expect(nearby).toHaveLength(1);

    const story = buildTribeEditorialStory({
      city: "Reims",
      featuredTribe: BASE_TRIBE,
      events: [BASE_EVENT],
      neighborhoods: [BASE_HOOD],
      culturalPlaces: [BASE_PLACE],
    });
    expect(story.title).toContain("Club des Lecteurs");
  });

  it("creates passport progression copy and prevents fake metrics", () => {
    const passport = {
      tier: { name: "Niveau 4" },
      progression: { hint: "Encore 2 participations à une tribu pour atteindre le niveau 5." },
    } as PassportMe;
    const copy = buildPassportProgressionCopy(passport);
    expect(copy).toContain("Encore 2 participations");
    expect(tribePortalHasNoFakeMetrics([copy, "Cercle local calme"])).toBe(true);
  });

  it("builds life slices with max 4", () => {
    const slices = buildTribeLifeSlices({
      city: "Reims",
      tribes: [BASE_TRIBE],
      events: [BASE_EVENT],
      neighborhoods: [BASE_HOOD],
      offers: [BASE_OFFER],
      culturalPlaces: [BASE_PLACE],
      maxItems: 4,
    });
    expect(slices.length).toBeLessThanOrEqual(4);
  });
});

