import type { LocalVideoFeedItem } from "@yunicity/types";
import { describe, expect, it } from "vitest";

import {
  DEFAULT_VIDEOS_PORTAL_SIDEBAR_FILTERS,
  extractVideoPortalCreators,
  filterVideosPortalItems,
  pickFeaturedVideos,
  sortVideosPortalItems,
} from "./local-video-portal";

function makeItem(overrides: Partial<LocalVideoFeedItem> = {}): LocalVideoFeedItem {
  return {
    id: "v1",
    author_user_id: "u1",
    author: { id: "u1", full_name: "Alice", username: "alice", avatar_url: null },
    city: "Reims",
    neighborhood_id: "n1",
    neighborhood_name: "Centre",
    neighborhood_slug: "centre",
    video_type: "moment",
    title: "Test",
    description: null,
    cultural_place_id: null,
    cultural_place_slug: null,
    cultural_place_name: null,
    local_event_id: null,
    tribe_id: null,
    organization_id: null,
    media_url: "https://media.example/v.mp4",
    thumbnail_url: "https://media.example/t.jpg",
    duration_seconds: 90,
    media_width: null,
    media_height: null,
    mime_type: "video/mp4",
    latitude: null,
    longitude: null,
    status: "published",
    published_at: "2026-07-01T10:00:00.000Z",
    created_at: "2026-07-01T09:00:00.000Z",
    distance_meters: null,
    walk_minutes: null,
    like_count: 3,
    comment_count: 1,
    view_count: 0,
    liked_by_me: false,
    ...overrides,
  };
}

describe("local-video-portal", () => {
  it("filters by category and location", () => {
    const items = [
      makeItem({ id: "a", video_type: "moment", neighborhood_slug: "centre" }),
      makeItem({ id: "b", video_type: "lieu", neighborhood_slug: "erp" }),
    ];
    const filtered = filterVideosPortalItems(
      items,
      { ...DEFAULT_VIDEOS_PORTAL_SIDEBAR_FILTERS, category: "lieu", location: "erp" },
      "all",
    );
    expect(filtered.map((item) => item.id)).toEqual(["b"]);
  });

  it("sorts by popularity when requested", () => {
    const items = [
      makeItem({ id: "low", like_count: 1 }),
      makeItem({ id: "high", like_count: 10 }),
    ];
    const sorted = sortVideosPortalItems(items, "popular", "all");
    expect(sorted.map((item) => item.id)).toEqual(["high", "low"]);
  });

  // VIDEO-03 — le backend classe le feed par pertinence territoriale
  // (quartier, puis ville, puis repli). Un tri par récence appliqué ensuite en
  // mémoire détruirait ce classement : la vidéo du quartier du spectateur
  // repasserait derrière une vidéo de l'autre bout de la ville publiée cinq
  // minutes plus tôt. Le tri par défaut doit donc rendre l'ordre du serveur
  // intact.
  it("preserves the server order by default", () => {
    const items = [
      makeItem({ id: "quartier", published_at: "2026-06-01T10:00:00.000Z" }),
      makeItem({ id: "ville", published_at: "2026-07-02T10:00:00.000Z" }),
    ];
    const sorted = sortVideosPortalItems(items, "relevance", "all");
    expect(sorted.map((item) => item.id)).toEqual(["quartier", "ville"]);
  });

  it("still sorts by recency when the viewer explicitly asks for it", () => {
    const items = [
      makeItem({ id: "quartier", published_at: "2026-06-01T10:00:00.000Z" }),
      makeItem({ id: "ville", published_at: "2026-07-02T10:00:00.000Z" }),
    ];
    const sorted = sortVideosPortalItems(items, "recent", "all");
    expect(sorted.map((item) => item.id)).toEqual(["ville", "quartier"]);
  });

  it("keeps the new tab on recency whatever the sort", () => {
    const items = [
      makeItem({ id: "vieille", published_at: "2026-06-01T10:00:00.000Z" }),
      makeItem({ id: "recente", published_at: "2026-07-02T10:00:00.000Z" }),
    ];
    const sorted = sortVideosPortalItems(items, "relevance", "new");
    expect(sorted.map((item) => item.id)).toEqual(["recente", "vieille"]);
  });

  it("keeps the trending tab on likes whatever the sort", () => {
    const items = [
      makeItem({ id: "peu", like_count: 1 }),
      makeItem({ id: "beaucoup", like_count: 10 }),
    ];
    const sorted = sortVideosPortalItems(items, "relevance", "trending");
    expect(sorted.map((item) => item.id)).toEqual(["beaucoup", "peu"]);
  });

  it("keeps the nearby tab on distance whatever the sort", () => {
    const items = [
      makeItem({ id: "loin", distance_meters: 500 }),
      makeItem({ id: "pres", distance_meters: 100 }),
    ];
    const sorted = sortVideosPortalItems(items, "relevance", "nearby");
    expect(sorted.map((item) => item.id)).toEqual(["pres", "loin"]);
  });

  it("filters mine tab to current user", () => {
    const items = [
      makeItem({ id: "mine", author_user_id: "u1" }),
      makeItem({ id: "other", author_user_id: "u2" }),
    ];
    const filtered = filterVideosPortalItems(items, DEFAULT_VIDEOS_PORTAL_SIDEBAR_FILTERS, "mine", "u1");
    expect(filtered.map((item) => item.id)).toEqual(["mine"]);
  });

  it("picks featured videos from newest playable items", () => {
    const items = [
      makeItem({ id: "old", published_at: "2026-06-01T10:00:00.000Z" }),
      makeItem({ id: "new", published_at: "2026-07-02T10:00:00.000Z" }),
    ];
    expect(pickFeaturedVideos(items, 1).map((item) => item.id)).toEqual(["new"]);
  });

  it("filters nearby tab to geolocated items", () => {
    const items = [
      makeItem({ id: "near", distance_meters: 120 }),
      makeItem({ id: "far", distance_meters: null }),
    ];
    const filtered = filterVideosPortalItems(items, DEFAULT_VIDEOS_PORTAL_SIDEBAR_FILTERS, "nearby");
    expect(filtered.map((item) => item.id)).toEqual(["near"]);
  });

  it("sorts nearby tab by distance", () => {
    const items = [
      makeItem({ id: "b", distance_meters: 500 }),
      makeItem({ id: "a", distance_meters: 100 }),
    ];
    const sorted = sortVideosPortalItems(items, "recent", "nearby");
    expect(sorted.map((item) => item.id)).toEqual(["a", "b"]);
  });

  it("extracts unique creators", () => {
    const items = [
      makeItem({ id: "v1", author_user_id: "u1", author: { id: "u1", full_name: "Alice", username: "alice", avatar_url: null } }),
      makeItem({ id: "v2", author_user_id: "u1", author: { id: "u1", full_name: "Alice", username: "alice", avatar_url: null } }),
      makeItem({ id: "v3", author_user_id: "u2", author: { id: "u2", full_name: "Bob", username: "bob", avatar_url: null } }),
    ];
    expect(extractVideoPortalCreators(items)).toHaveLength(2);
  });
});
