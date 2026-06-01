import { describe, expect, it } from "vitest";

import type { FeedPost, LocalEvent, Tribe, TribeMember } from "@yunicity/types";

import {
  buildTribeDetailAboutFacts,
  buildTribeDetailBreadcrumbs,
  buildTribeDetailEventCards,
  buildTribeDetailHeroMeta,
  buildTribeDetailMemberPreviews,
  buildTribeDetailPostCards,
  buildTribeDetailQuickStats,
  buildTribeDetailTags,
  countTribeUpcomingEvents,
  tribeDetailPortalCopyIsSafe,
} from "./tribe-detail-portal";

const TRIBE: Tribe = {
  id: "t1",
  slug: "cafes-lecture",
  name: "Cafés & Lecture",
  description: "Pour les amoureux des livres et des bons cafés.",
  city: "Reims",
  category: "cafe_culture",
  visibility: "public",
  persistence_kind: "default",
  cover_image_url: null,
  is_featured: true,
  member_limit: 120,
  active_member_count: 24,
  is_archived: false,
  viewer_is_member: true,
  viewer_role: "member",
  created_at: "2024-01-12T10:00:00.000Z",
  updated_at: "",
};

function event(overrides: Partial<LocalEvent> = {}): LocalEvent {
  return {
    id: "e1",
    organization_id: null,
    title: "Lecture au Boulingrin",
    description: "Rencontre autour d'un roman local",
    event_type: "workshop",
    city: "Reims",
    district: "Centre-ville",
    starts_at: "2026-08-24T13:00:00.000Z",
    ends_at: "2026-08-24T15:00:00.000Z",
    timezone: "Europe/Paris",
    location_name: "Le Boulingrin",
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

describe("tribe-detail-portal", () => {
  it("buildTribeDetailHeroMeta utilise des compteurs réels", () => {
    const meta = buildTribeDetailHeroMeta(TRIBE);
    expect(meta).toContain("24 membres");
    expect(meta).toContain("Reims");
    expect(tribeDetailPortalCopyIsSafe([meta])).toBe(true);
  });

  it("buildTribeDetailQuickStats exclut la note tribu et les publications sans total", () => {
    const stats = buildTribeDetailQuickStats({
      tribe: TRIBE,
      eventsCount: 2,
      postsCount: null,
    });
    expect(stats.map((s) => s.id)).toEqual(["members", "events"]);
    expect(tribeDetailPortalCopyIsSafe(stats.map((s) => `${s.value} ${s.label}`))).toBe(true);
  });

  it("countTribeUpcomingEvents et buildTribeDetailEventCards filtrent par tribu", () => {
    const linked = event();
    const other = event({ id: "e2", title: "Exposition viniculture", description: "Dégustation en Champagne" });
    const count = countTribeUpcomingEvents(TRIBE, [linked, other], new Date("2026-01-01"));
    expect(count).toBe(1);
    const cards = buildTribeDetailEventCards({
      tribe: TRIBE,
      events: [linked, other],
      culturalPlaces: [],
      now: new Date("2026-01-01"),
    });
    expect(cards).toHaveLength(1);
    expect(cards[0]?.title).toBe("Lecture au Boulingrin");
  });

  it("buildTribeDetailAboutFacts inclut la date de création sans auteur inventé", () => {
    const facts = buildTribeDetailAboutFacts(TRIBE);
    const joined = facts.map((f) => `${f.label} ${f.value}`).join(" ");
    expect(joined).toMatch(/janvier 2024/i);
    expect(joined).not.toMatch(/Sophie|Créatrice/i);
  });

  it("buildTribeDetailMemberPreviews utilise les rôles API", () => {
    const members: TribeMember[] = [
      { user_id: "user-owner-1", role: "owner", joined_at: "2024-01-12" },
      { user_id: "user-mod-2", role: "moderator", joined_at: "2024-02-01" },
    ];
    const previews = buildTribeDetailMemberPreviews(members);
    expect(previews[0]?.roleLabel).toBe("Responsable");
    expect(previews[1]?.roleLabel).toBe("Modérateur");
  });

  it("buildTribeDetailPostCards formate les publications réelles", () => {
    const post: FeedPost = {
      id: "p1",
      type: "post",
      author: { type: "citizen", id: "u1", display_name: "Émilie", username: "emilie", logo_url: null },
      city: "Reims",
      title: null,
      body: "Quel livre vous a marqué ?",
      media_url: null,
      location: null,
      like_count: 24,
      comment_count: 18,
      liked_by_me: false,
      offer: null,
      event: null,
      neighborhood_summary: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const cards = buildTribeDetailPostCards([post]);
    expect(cards[0]?.authorLabel).toBe("Émilie");
    expect(cards[0]?.body).toContain("livre");
  });

  it("buildTribeDetailBreadcrumbs structure le fil d'Ariane", () => {
    const crumbs = buildTribeDetailBreadcrumbs(TRIBE);
    expect(crumbs[0]?.label).toBe("Tribus");
    expect(crumbs[2]?.label).toBe("Cafés & Lecture");
  });

  it("buildTribeDetailTags dérive des catégories réelles", () => {
    const tags = buildTribeDetailTags(TRIBE);
    expect(tags.length).toBeGreaterThan(0);
    expect(tags.some((tag) => tag.includes("Café") || tag.includes("culture"))).toBe(true);
  });
});
