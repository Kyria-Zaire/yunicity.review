import { describe, expect, it } from "vitest";

import type { NeighborhoodDetail, NeighborhoodTimelineItem } from "@yunicity/types";

import {
  formatNeighborhoodV2AliasLine,
  formatNeighborhoodV2MoodLabels,
  buildNeighborhoodV2SeoDescription,
  hasNeighborhoodV2Life,
  hasNeighborhoodV2LocalLife,
  listNeighborhoodV2LifeFields,
  mapNeighborhoodDetailVideosToFeedItems,
  resolveNeighborhoodV2HeroImage,
  resolveNeighborhoodV2HeroImageCredit,
  resolveNeighborhoodV2HistoryStory,
  resolveNeighborhoodV2HistoryStoryForDisplay,
  sortNeighborhoodV2Timeline,
  truncateNeighborhoodV2Story,
} from "./neighborhood-v2-presenter";

const LANDMARK_COVER = "https://media.yunicity.city/places/reims/porte-de-paris/cover.jpg";
const REAL_CDN_COVER = "https://media.yunicity.city/neighborhoods/reims/centre-ville/hero.jpg";

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

const DETAIL_WITH_LANDMARK: NeighborhoodDetail = {
  ...BASE_DETAIL,
  landmarks: [
    {
      slug: "porte-de-paris",
      name: "Porte de Paris",
      category: "culture",
      hero_image_url: LANDMARK_COVER,
      photo_credit: "Mathieu Kappler / CC BY-SA 4.0 via Wikimedia Commons",
      image_license: "CC BY-SA 4.0",
    },
  ],
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

describe("neighborhood-v2-presenter — phase 3f", () => {
  it("keeps a pending cover when there is no landmark (12 quartiers inchangés)", () => {
    expect(resolveNeighborhoodV2HeroImage(BASE_DETAIL)).toBe(BASE_DETAIL.cover_image_url);
    expect(resolveNeighborhoodV2HeroImageCredit(BASE_DETAIL)).toBeNull();
  });

  it("derives the cover from the first landmark when the cover is pending", () => {
    expect(resolveNeighborhoodV2HeroImage(DETAIL_WITH_LANDMARK)).toBe(LANDMARK_COVER);
    const credit = resolveNeighborhoodV2HeroImageCredit(DETAIL_WITH_LANDMARK);
    expect(credit?.photo_credit).toContain("Mathieu Kappler");
    expect(credit?.image_license).toBe("CC BY-SA 4.0");
  });

  it("never overrides a real (non-pending) cover with a landmark image", () => {
    const detail: NeighborhoodDetail = {
      ...DETAIL_WITH_LANDMARK,
      cover_image_url: REAL_CDN_COVER,
      hero: { ...BASE_DETAIL.hero!, cover_image_url: REAL_CDN_COVER },
    };
    expect(resolveNeighborhoodV2HeroImage(detail)).toBe(REAL_CDN_COVER);
    expect(resolveNeighborhoodV2HeroImageCredit(detail)).toBeNull();
  });

  it("lists only non-empty life fields, in order", () => {
    const detail: NeighborhoodDetail = {
      ...BASE_DETAIL,
      neighborhood_type: "Quartier résidentiel",
      audience: "  ",
      green_spaces: "Parc de Champagne",
    };
    const fields = listNeighborhoodV2LifeFields(detail);
    expect(fields.map((f) => f.key)).toEqual(["neighborhood_type", "green_spaces"]);
    expect(fields[0]!.label).toBe("Type de quartier");
    expect(hasNeighborhoodV2Life(detail)).toBe(true);
    expect(hasNeighborhoodV2Life(BASE_DETAIL)).toBe(false);
  });

  it("counts community tags as local life", () => {
    expect(hasNeighborhoodV2LocalLife(BASE_DETAIL)).toBe(false);
    const detail: NeighborhoodDetail = {
      ...BASE_DETAIL,
      community_tags: [{ slug: "sport", label: "Sport", tribes: [] }],
    };
    expect(hasNeighborhoodV2LocalLife(detail)).toBe(true);
  });
});
