import { describe, expect, it } from "vitest";

import type { NeighborhoodDetail, NeighborhoodTimelineItem } from "@yunicity/types";

import {
  formatNeighborhoodV2AliasLine,
  formatNeighborhoodV2MoodLabels,
  buildNeighborhoodV2SeoDescription,
  mapNeighborhoodDetailVideosToFeedItems,
  resolveNeighborhoodV2HistoryStory,
  resolveNeighborhoodV2HistoryStoryForDisplay,
  sortNeighborhoodV2Timeline,
  truncateNeighborhoodV2Story,
} from "./neighborhood-v2-presenter";

const BASE_DETAIL: NeighborhoodDetail = {
  id: "hood-1",
  city: "Reims",
  slug: "boulingrin",
  display_name: "Boulingrin",
  short_description: null,
  ambiance: null,
  cover_image_url: "/neighborhoods/reims/boulingrin/hero.jpg",
  accent_color: null,
  latitude: null,
  longitude: null,
  radius_meters: null,
  is_featured: true,
  is_active: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  hero: {
    id: "hood-1",
    slug: "boulingrin",
    display_name: "Boulingrin",
    official_label: "Quartier officiel",
    aliases: [{ id: "a1", name: "Halles du Boulingrin", slug: "halles", is_primary: false }],
    moods: ["gourmet", "festive"],
    featured_quote: "Les halles retrouvent leur rythme.",
    cover_image_url: "/neighborhoods/reims/boulingrin/hero.jpg",
    hero_image_storage_key: null,
  },
  history: {
    long_story: "Depuis le début du XXe siècle, Boulingrin rassemble marchés et terrasses.",
    featured_quote: "On venait le dimanche pour le marché.",
  },
  videos: [
    {
      id: "vid-1",
      title: "Marché du matin",
      thumbnail_url: "https://cdn.example/thumb.jpg",
      duration_seconds: 42,
      neighborhood_slug: "boulingrin",
      published_at: "2026-02-01T10:00:00Z",
      video_type: "quartier",
      author: {
        id: "user-1",
        username: "camille",
        full_name: "Camille R.",
        avatar_url: null,
      },
    },
  ],
  places: [],
  events: [],
  tribes: [],
  creators: [],
  passport_offers: [],
  contributions: [],
  stats: null,
};

describe("neighborhood-v2-presenter", () => {
  it("formats mood labels in French", () => {
    expect(formatNeighborhoodV2MoodLabels(["gourmet", "unknown"])).toEqual(["Gourmand", "unknown"]);
  });

  it("formats alias line", () => {
    expect(formatNeighborhoodV2AliasLine(BASE_DETAIL.hero!.aliases)).toBe(
      "Alias · Halles du Boulingrin",
    );
  });

  it("truncates long story at word boundary", () => {
    const long = "Mot ".repeat(80) + "final";
    const truncated = truncateNeighborhoodV2Story(long, 250);
    expect(truncated.endsWith("…")).toBe(true);
    expect(truncated.length).toBeLessThanOrEqual(252);
  });

  it("resolves history from detail blocks", () => {
    const history = resolveNeighborhoodV2HistoryStory(BASE_DETAIL);
    expect(history?.long_story).toContain("XXe siècle");
    expect(history?.featured_quote).toContain("dimanche");
  });

  it("sorts timeline ascending by year", () => {
    const items: NeighborhoodTimelineItem[] = [
      { id: "2", year: 1980, title: "B", description: null, display_order: 1 },
      { id: "1", year: 1900, title: "A", description: null, display_order: 0 },
    ];
    expect(sortNeighborhoodV2Timeline(items).map((item) => item.year)).toEqual([1900, 1980]);
  });

  it("maps detail videos to feed items for teaser rail", () => {
    const items = mapNeighborhoodDetailVideosToFeedItems(BASE_DETAIL);
    expect(items).toHaveLength(1);
    expect(items[0]?.id).toBe("vid-1");
    expect(items[0]?.neighborhood_name).toBe("Boulingrin");
    expect(items[0]?.thumbnail_url).toBe("https://cdn.example/thumb.jpg");
  });

  it("keeps distinct history pull-quote when hero quote differs", () => {
    const history = resolveNeighborhoodV2HistoryStoryForDisplay(BASE_DETAIL);
    expect(history?.long_story).toContain("XXe siècle");
    expect(history?.featured_quote).toBe("On venait le dimanche pour le marché.");
  });

  it("dedupes history pull-quote when identical to hero quote", () => {
    const detail: NeighborhoodDetail = {
      ...BASE_DETAIL,
      hero: {
        ...BASE_DETAIL.hero!,
        featured_quote: "On venait le dimanche pour le marché.",
      },
    };
    const history = resolveNeighborhoodV2HistoryStoryForDisplay(detail);
    expect(history?.featured_quote).toBeNull();
  });

  it("builds SEO description from featured quote first", () => {
    expect(buildNeighborhoodV2SeoDescription(BASE_DETAIL)).toBe("Les halles retrouvent leur rythme.");
  });
});
