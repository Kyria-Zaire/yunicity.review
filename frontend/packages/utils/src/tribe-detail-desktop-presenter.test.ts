import { describe, expect, it } from "vitest";

import type { FeedPost, Tribe } from "@yunicity/types";

import {
  TRIBE_DETAIL_DESKTOP_TABS,
  buildTribeDetailDesktopEssentialRules,
  buildTribeDetailDesktopFeaturedCard,
  buildTribeDetailDesktopGalleryUrls,
  buildTribeDetailDesktopJoinBenefits,
  buildTribeDetailDesktopLocationMeta,
  buildTribeDetailDesktopProjectUrls,
} from "./tribe-detail-desktop-presenter";

const TRIBE: Tribe = {
  id: "t1",
  slug: "createurs-reims",
  name: "Créateurs de Reims",
  description: "Un espace pour partager ses projets.",
  city: "Reims",
  category: "other",
  visibility: "public",
  persistence_kind: "default",
  cover_image_url: "https://example.com/cover.jpg",
  is_featured: false,
  member_limit: 100,
  active_member_count: 12,
  is_archived: false,
  viewer_is_member: false,
  viewer_role: null,
  viewer_notifications_muted: false,
  viewer_has_pending_join_request: false,
  created_at: "2024-01-12T10:00:00.000Z",
  updated_at: "",
};

describe("tribe-detail-desktop-presenter", () => {
  it("expose les onglets desktop de la maquette", () => {
    expect(TRIBE_DETAIL_DESKTOP_TABS.map((tab) => tab.id)).toEqual([
      "overview",
      "discussions",
      "events",
      "members",
      "about",
    ]);
  });

  it("buildTribeDetailDesktopLocationMeta inclut ville et catégorie", () => {
    const meta = buildTribeDetailDesktopLocationMeta(TRIBE);
    expect(meta).toContain("Reims");
  });

  it("buildTribeDetailDesktopGalleryUrls déduplique cover et médias", () => {
    const posts: FeedPost[] = [
      {
        id: "p1",
        type: "post",
        author: { type: "citizen", id: "u1", display_name: "Léa", username: "lea", logo_url: null },
        city: "Reims",
        title: null,
        body: "Hello",
        media_url: "https://example.com/post.jpg",
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
      },
    ];
    const urls = buildTribeDetailDesktopGalleryUrls(TRIBE, posts);
    expect(urls).toEqual(["https://example.com/cover.jpg", "https://example.com/post.jpg"]);
  });

  it("buildTribeDetailDesktopFeaturedCard utilise la première publication ou un welcome", () => {
    const welcome = buildTribeDetailDesktopFeaturedCard(TRIBE, []);
    expect(welcome.title).toContain("Bienvenue");
    expect(welcome.authorLabel).toContain("Créateurs de Reims");
  });

  it("buildTribeDetailDesktopJoinBenefits et rules sont stables", () => {
    expect(buildTribeDetailDesktopJoinBenefits()).toHaveLength(3);
    expect(buildTribeDetailDesktopEssentialRules()).toHaveLength(3);
    expect(buildTribeDetailDesktopProjectUrls([])).toEqual([]);
  });
});
