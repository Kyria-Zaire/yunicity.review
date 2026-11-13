import { describe, expect, it } from "vitest";

import type { LocalEvent, Neighborhood, Tribe, TribeInvitationPending } from "@yunicity/types";

import {
  buildTribesDesktopInvitationCards,
  buildTribesDesktopRecommendedCards,
  buildTribesDesktopSpotlight,
  filterTribesForDesktopPortal,
  type TribesDesktopCategoryId,
} from "./tribe-desktop-presenter";

const NOW = new Date("2026-05-30T12:00:00.000Z");

const BASE_TRIBE: Tribe = {
  id: "t1",
  slug: "createurs-reims",
  name: "Créateurs de Reims",
  description: "Entrepreneuriat, design et numérique.",
  city: "Reims",
  category: "association",
  visibility: "public",
  persistence_kind: "default",
  cover_image_url: null,
  is_featured: true,
  member_limit: 80,
  active_member_count: 16,
  is_archived: false,
  viewer_is_member: false,
  viewer_role: null,
  viewer_notifications_muted: false,
  viewer_has_pending_join_request: false,
  created_at: "",
  updated_at: "",
};

const PRIVATE_TRIBE: Tribe = {
  ...BASE_TRIBE,
  id: "t2",
  slug: "parents-saint-remi",
  name: "Parents de Saint-Remi",
  visibility: "private_invite",
  is_featured: false,
};

const BASE_EVENT: LocalEvent = {
  id: "e1",
  organization_id: null,
  title: "Atelier créateurs",
  description: "Léa recherche un développeur front-end pour un projet local.",
  event_type: "meetup",
  city: "Reims",
  district: "Centre-ville",
  starts_at: "2026-06-05T18:30:00.000Z",
  ends_at: null,
  timezone: "Europe/Paris",
  location_name: "Coworking Reims",
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

const HOODS: Neighborhood[] = [
  {
    id: "h1",
    slug: "saint-remi",
    display_name: "Saint-Remi",
    city: "Reims",
    short_description: null,
    ambiance: null,
    cover_image_url: null,
    accent_color: null,
    latitude: null,
    longitude: null,
    radius_meters: null,
    is_active: true,
    is_featured: true,
    created_at: "",
    updated_at: "",
  },
];

describe("tribe-desktop-presenter", () => {
  it("buildTribesDesktopSpotlight met en avant la tribu featured", () => {
    const spotlight = buildTribesDesktopSpotlight({
      city: "Reims",
      tribes: [PRIVATE_TRIBE, BASE_TRIBE],
      events: [BASE_EVENT],
      now: NOW,
    });

    expect(spotlight?.title).toBe("Créateurs de Reims");
    expect(spotlight?.visibilityBadge).toBe("PUBLIQUE");
    expect(spotlight?.nextMeetupLabel).toMatch(/Vendredi/i);
  });

  it("buildTribesDesktopRecommendedCards exclut le spotlight", () => {
    const cards = buildTribesDesktopRecommendedCards({
      city: "Reims",
      tribes: [BASE_TRIBE, PRIVATE_TRIBE],
      events: [],
      excludeId: BASE_TRIBE.id,
      limit: 4,
      now: NOW,
    });

    expect(cards).toHaveLength(1);
    expect(cards[0]?.name).toBe("Parents de Saint-Remi");
    expect(cards[0]?.ctaVariant).toBe("request");
  });

  it("filterTribesForDesktopPortal combine nav, visibilité et recherche", () => {
    const filtered = filterTribesForDesktopPortal({
      tribes: [BASE_TRIBE, PRIVATE_TRIBE],
      navId: "discover",
      visibilityId: "public",
      categoryId: "creators",
      neighborhoodSlug: "all",
      neighborhoods: HOODS,
      searchQuery: "créateurs",
      invitationSlugs: [],
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.slug).toBe("createurs-reims");
  });

  it("filterTribesForDesktopPortal filtre les demandes envoyées", () => {
    const pending: Tribe = { ...BASE_TRIBE, viewer_has_pending_join_request: true };
    const filtered = filterTribesForDesktopPortal({
      tribes: [pending, PRIVATE_TRIBE],
      navId: "sent_requests",
      visibilityId: "all",
      categoryId: "for_you" satisfies TribesDesktopCategoryId,
      neighborhoodSlug: "all",
      neighborhoods: HOODS,
      searchQuery: "",
      invitationSlugs: [],
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.viewer_has_pending_join_request).toBe(true);
  });

  it("buildTribesDesktopInvitationCards mappe les invitations", () => {
    const invitations: TribeInvitationPending[] = [
      {
        id: "inv1",
        tribe_slug: "benevoles-reims",
        tribe_name: "Bénévoles de Reims",
        tribe_city: "Reims",
        expires_at: "2026-12-01T00:00:00.000Z",
      },
    ];

    const cards = buildTribesDesktopInvitationCards({ city: "Reims", invitations });
    expect(cards[0]?.tribeName).toBe("Bénévoles de Reims");
    expect(cards[0]?.href).toContain("/tribes/benevoles-reims");
  });
});
