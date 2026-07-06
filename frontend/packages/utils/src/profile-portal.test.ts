import { describe, expect, it } from "vitest";

import type { FeedPost, LocalEvent, Neighborhood, PassportMe, PassportStamp, ProfileMe, Tribe } from "@yunicity/types";

import {
  buildProfileActivityItems,
  buildProfileActivityTimeline,
  buildProfileHeroSubtitle,
  buildProfileLocalJourneyItems,
  buildProfileNeighborhoodCards,
  buildProfilePortalStats,
  buildProfileTribeCards,
  formatProfileImpactLabel,
  profilePortalHasNoFakeMetrics,
} from "./profile-portal";

const PROFILE: ProfileMe = {
  id: "p1",
  user_id: "u1",
  username: "kyria",
  display_name: "Kyria",
  bio: "Passionnée par Reims.",
  avatar_url: null,
  banner_url: null,
  city: "Reims",
  interests: ["culture"],
  visibility: "public",
  onboarding_completed: true,
  onboarding_step: null,
  preferred_language: "fr",
  notification_preferences: {},
  has_active_passport: false,
  created_at: "",
  updated_at: "",
};

const PASSPORT: PassportMe = {
  id: "pass1",
  user_id: "u1",
  city: "Reims",
  passport_number: "YUN-1",
  qr_token: "qr",
  status: "active",
  tier: {
    id: "t1",
    code: "basic",
    name: "Basique",
    description: null,
    display_order: 0,
    flags: {},
  },
  stats: { stamps_count: 2, redemptions_count: 0, last_stamp_at: null },
  reputation_score: 350,
  onboarding_completed: true,
  onboarding_step: null,
  activated_at: "2026-01-15T10:00:00.000Z",
  created_at: "",
  updated_at: "",
};

const STAMP: PassportStamp = {
  id: "s1",
  kind: "visit",
  stamped_at: "2026-05-20T14:00:00.000Z",
  slug: "boulingrin",
  title: "Boulingrin",
};

const TRIBE: Tribe = {
  id: "tr1",
  slug: "cafes-lecture",
  name: "Cafés & Lecture",
  description: "Lecture",
  city: "Reims",
  category: "cafe_culture",
  visibility: "public",
  persistence_kind: "default",
  cover_image_url: null,
  is_featured: false,
  member_limit: 50,
  active_member_count: 12,
  is_archived: false,
  viewer_is_member: true,
  viewer_role: "member",
  created_at: "",
  updated_at: "",
};

const HOOD: Neighborhood = {
  id: "h1",
  city: "Reims",
  slug: "boulingrin",
  display_name: "Boulingrin",
  short_description: null,
  ambiance: null,
  cover_image_url: null,
  accent_color: null,
  latitude: null,
  longitude: null,
  radius_meters: null,
  is_featured: true,
  is_active: true,
  created_at: "",
  updated_at: "",
};

function savedEvent(id: string, title: string): LocalEvent {
  return {
    id,
    organization_id: null,
    title,
    description: null,
    event_type: "market",
    city: "Reims",
    district: null,
    starts_at: "2026-12-01T10:00:00.000Z",
    ends_at: null,
    timezone: "Europe/Paris",
    location_name: "Centre",
    address: null,
    latitude: null,
    longitude: null,
    cover_image_url: null,
    moderation_status: "approved",
    is_cancelled: false,
    interested_by_me: false,
    interest_count: 0,
    organization: null,
    neighborhood_summary: null,
    created_at: "",
  };
}

describe("profile-portal", () => {
  it("buildProfilePortalStats agrège des compteurs réels", () => {
    const stats = buildProfilePortalStats({
      profile: PROFILE,
      passport: PASSPORT,
      stamps: [STAMP],
      tribes: [TRIBE],
      savedEvents: [],
      feedPosts: [],
    });
    expect(stats.find((s) => s.id === "neighborhoods")?.value).toBe(1);
    expect(stats.find((s) => s.id === "tribes")?.value).toBe(1);
    expect(stats.find((s) => s.id === "points")?.value).toBe(350);
  });

  it("buildProfileActivityItems filtre les posts du citoyen connecté", () => {
    const post: FeedPost = {
      id: "fp1",
      type: "post",
      author: { type: "citizen", id: "u1", display_name: "Kyria", username: "kyria", logo_url: null },
      city: "Reims",
      title: null,
      body: "Le marché du Boulingrin",
      media_url: null,
      location: null,
      like_count: 0,
      comment_count: 0,
      liked_by_me: false,
      offer: null,
      event: null,
      creator_content: null,
      neighborhood_summary: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const items = buildProfileActivityItems({
      profile: PROFILE,
      feedPosts: [post],
      savedEvents: [],
      culturalPlaces: [],
    });
    expect(items).toHaveLength(1);
    expect(items[0]?.kind).toBe("post");
  });

  it("buildProfileActivityTimeline inclut tampons et exclut événements sans date de sauvegarde", () => {
    const timeline = buildProfileActivityTimeline({
      profile: PROFILE,
      passport: PASSPORT,
      feedPosts: [],
      stamps: [STAMP],
      tribes: [TRIBE],
      savedEvents: [savedEvent("e1", "Marché")],
      culturalPlaces: [],
      neighborhoods: [HOOD],
      now: new Date("2026-05-28T12:00:00.000Z"),
    });
    expect(timeline.some((item) => item.kind === "stamp")).toBe(true);
    expect(timeline.some((item) => item.kind === "event_saved")).toBe(false);
    expect(timeline.every((item) => item.timestampLabel.length > 0)).toBe(true);
  });

  it("buildProfileLocalJourneyItems place tribu et événement sans date inventée", () => {
    const landmarks = buildProfileLocalJourneyItems({
      city: "Reims",
      tribes: [TRIBE],
      savedEvents: [savedEvent("e1", "Marché du centre")],
      culturalPlaces: [],
      stamps: [STAMP],
      passport: PASSPORT,
      feedPosts: [],
      profile: PROFILE,
    });
    expect(landmarks.some((l) => l.kind === "tribe")).toBe(true);
    expect(landmarks.some((l) => l.kind === "event_saved")).toBe(true);
    const joined = landmarks.map((l) => `${l.title} ${l.description}`).join(" ");
    expect(joined).not.toMatch(/il y a \d+ (min|h|jour)/i);
  });

  it("formatProfileImpactLabel humanise la progression à 0", () => {
    const label = formatProfileImpactLabel(0, null);
    expect(label.primary).toBe("Votre parcours commence");
    expect(label.showPercent).toBe(false);
    expect(label.primary).not.toMatch(/^0\s*%/);
  });

  it("formatProfileImpactLabel affiche le pourcentage au-dessus de 0", () => {
    const label = formatProfileImpactLabel(42, null);
    expect(label.showPercent).toBe(true);
    expect(label.primary).toContain("42");
  });

  it("buildProfileHeroSubtitle utilise les tribus rejointes", () => {
    expect(
      buildProfileHeroSubtitle({
        city: "Reims",
        tribes: [TRIBE],
        stampsCount: 0,
        levelTitle: "Explorateur local",
      }),
    ).toBe("Membre d’une tribu locale.");
  });

  it("buildProfileNeighborhoodCards utilise les tampons", () => {
    const cards = buildProfileNeighborhoodCards({
      city: "Reims",
      stamps: [STAMP],
      neighborhoods: [HOOD],
    });
    expect(cards[0]?.name).toBe("Boulingrin");
  });

  it("buildProfileTribeCards liste les tribus membres", () => {
    const cards = buildProfileTribeCards({
      city: "Reims",
      tribes: [TRIBE],
      events: [],
    });
    expect(cards).toHaveLength(1);
    expect(cards[0]?.memberCount).toBe(12);
  });

  it("profilePortalHasNoFakeMetrics rejette le jargon social", () => {
    expect(profilePortalHasNoFakeMetrics(["Exploratrice locale à Reims"])).toBe(true);
    expect(profilePortalHasNoFakeMetrics(["#1 sur 10 trending"])).toBe(false);
  });
});
