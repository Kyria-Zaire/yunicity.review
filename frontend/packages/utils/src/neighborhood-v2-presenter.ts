import type {
  LocalVideoFeedItem,
  NeighborhoodDetail,
  NeighborhoodDetailHistory,
  NeighborhoodTimelineItem,
} from "@yunicity/types";

import { resolveNeighborhoodHeroImage } from "./neighborhood-detail";

export const NEIGHBORHOOD_V2_NOT_FOUND = "Ce quartier n'existe pas encore.";
export const NEIGHBORHOOD_V2_BACK_TO_LIST = "Retour aux quartiers";
export const NEIGHBORHOOD_V2_ERROR = "Impossible de charger ce quartier pour le moment.";
export const NEIGHBORHOOD_V2_OFFICIAL_BADGE = "Quartier officiel";
export const NEIGHBORHOOD_V2_ALIAS_PREFIX = "Alias";
export const NEIGHBORHOOD_V2_VIDEOS_TITLE = "Ce qu'il se passe aujourd'hui";
export const NEIGHBORHOOD_V2_EXPLORE_CTA = "Explorer";
export const NEIGHBORHOOD_V2_SHARE = "Partager";
export const NEIGHBORHOOD_V2_HISTORY_TITLE = "Histoire du quartier";
export const NEIGHBORHOOD_V2_HISTORY_READ_MORE = "Lire plus";
export const NEIGHBORHOOD_V2_HISTORY_READ_LESS = "Réduire";
export const NEIGHBORHOOD_V2_TIMELINE_TITLE = "Frise du quartier";
export const NEIGHBORHOOD_V2_EXPLORE_TITLE = "Explorer le quartier";
export const NEIGHBORHOOD_V2_EXPLORE_PLACES = "Lieux emblématiques";
export const NEIGHBORHOOD_V2_EXPLORE_EVENTS = "Moments à venir";
export const NEIGHBORHOOD_V2_EXPLORE_OFFERS = "Avantages Passport";
export const NEIGHBORHOOD_V2_PLACE_CTA = "Voir le lieu";
export const NEIGHBORHOOD_V2_EVENT_CTA = "Voir l'événement";
export const NEIGHBORHOOD_V2_OFFER_CTA = "Voir l'offre";
export const NEIGHBORHOOD_V2_LOCAL_LIFE_TITLE = "Vie locale";
export const NEIGHBORHOOD_V2_TRIBES_LABEL = "Tribus";
export const NEIGHBORHOOD_V2_CREATORS_LABEL = "Créateurs du quartier";
export const NEIGHBORHOOD_V2_CREATOR_CTA = "Voir le profil";
export const NEIGHBORHOOD_V2_CONTRIBUTIONS_TITLE = "Pourquoi les Rémois aiment";
export const NEIGHBORHOOD_V2_SHARE_MEMORY_CTA = "Partager votre souvenir";
export const NEIGHBORHOOD_V2_SHARE_MEMORY_SOON = "Bientôt";
export const NEIGHBORHOOD_V2_STATS_TITLE = "Le quartier en chiffres";
export const NEIGHBORHOOD_V2_EXPLORE_ANCHOR = "neighborhood-explore";

export const NEIGHBORHOOD_V2_HISTORY_COLLAPSE_CHARS = 250;

export const NEIGHBORHOOD_V2_MOOD_LABELS: Record<string, string> = {
  student: "Étudiant",
  family: "Familial",
  creative: "Créatif",
  festive: "Festif",
  calm: "Calme",
  gourmet: "Gourmand",
  heritage: "Patrimonial",
};

export const NEIGHBORHOOD_V2_STAT_LABELS = {
  places_count: "Lieux",
  events_count: "Moments",
  videos_count: "Vidéos",
  tribes_count: "Tribus",
  creators_count: "Créateurs",
  contributions_count: "Souvenirs",
} as const satisfies Record<
  keyof import("@yunicity/types").NeighborhoodDetailStats,
  string
>;

export function formatNeighborhoodV2MoodLabels(moodSlugs: string[]): string[] {
  return moodSlugs.map((slug) => NEIGHBORHOOD_V2_MOOD_LABELS[slug] ?? slug);
}

export function formatNeighborhoodV2AliasLine(aliases: { name: string }[]): string | null {
  const names = aliases.map((alias) => alias.name.trim()).filter(Boolean);
  if (names.length === 0) {
    return null;
  }
  return `${NEIGHBORHOOD_V2_ALIAS_PREFIX} · ${names.join(" · ")}`;
}

export function formatNeighborhoodV2ExploreCta(displayName: string): string {
  return `${NEIGHBORHOOD_V2_EXPLORE_CTA} ${displayName}`;
}

export function formatNeighborhoodV2ContributionsTitle(displayName: string): string {
  return `${NEIGHBORHOOD_V2_CONTRIBUTIONS_TITLE} ${displayName}`;
}

export function resolveNeighborhoodV2HeroImage(detail: NeighborhoodDetail): string | null {
  const cover = detail.hero?.cover_image_url ?? detail.cover_image_url;
  if (cover?.trim()) {
    return cover.trim();
  }
  return resolveNeighborhoodHeroImage(detail);
}

export function resolveNeighborhoodV2HeroQuote(detail: NeighborhoodDetail): string | null {
  const quote =
    detail.hero?.featured_quote?.trim() ||
    detail.history?.featured_quote?.trim() ||
    detail.featured_quote?.trim();
  return quote || null;
}

export function resolveNeighborhoodV2HistoryStory(
  detail: NeighborhoodDetail,
): NeighborhoodDetailHistory | null {
  const longStory =
    detail.history?.long_story?.trim() || detail.long_story?.trim() || null;
  const featuredQuote =
    detail.history?.featured_quote?.trim() || detail.featured_quote?.trim() || null;

  if (!longStory && !featuredQuote) {
    return null;
  }

  return {
    long_story: longStory,
    featured_quote: featuredQuote,
  };
}

export function truncateNeighborhoodV2Story(text: string, limit = NEIGHBORHOOD_V2_HISTORY_COLLAPSE_CHARS): string {
  const trimmed = text.trim();
  if (trimmed.length <= limit) {
    return trimmed;
  }
  const slice = trimmed.slice(0, limit);
  const lastSpace = slice.lastIndexOf(" ");
  const cut = lastSpace > limit * 0.6 ? slice.slice(0, lastSpace) : slice;
  return `${cut.trim()}…`;
}

export function sortNeighborhoodV2Timeline(items: NeighborhoodTimelineItem[]): NeighborhoodTimelineItem[] {
  return [...items].sort((a, b) => {
    if (a.year !== b.year) {
      return a.year - b.year;
    }
    return a.display_order - b.display_order;
  });
}

export function mapNeighborhoodDetailVideosToFeedItems(detail: NeighborhoodDetail): LocalVideoFeedItem[] {
  const hero = detail.hero;
  const neighborhoodId = hero?.id ?? detail.id;
  const neighborhoodName = hero?.display_name ?? detail.display_name;
  const neighborhoodSlug = hero?.slug ?? detail.slug;
  const now = new Date(0).toISOString();

  return detail.videos.slice(0, 3).map((video) => ({
    id: video.id,
    author_user_id: video.author.id,
    author: {
      id: video.author.id,
      username: video.author.username,
      full_name: video.author.full_name,
      avatar_url: video.author.avatar_url,
    },
    city: detail.city,
    neighborhood_id: neighborhoodId,
    neighborhood_name: neighborhoodName,
    neighborhood_slug: video.neighborhood_slug || neighborhoodSlug,
    video_type: video.video_type as LocalVideoFeedItem["video_type"],
    title: video.title,
    description: null,
    cultural_place_id: null,
    cultural_place_slug: null,
    cultural_place_name: null,
    local_event_id: null,
    tribe_id: null,
    organization_id: null,
    media_url: video.thumbnail_url,
    thumbnail_url: video.thumbnail_url,
    duration_seconds: video.duration_seconds,
    mime_type: "video/mp4",
    latitude: null,
    longitude: null,
    status: "published",
    published_at: video.published_at,
    created_at: video.published_at ?? now,
    distance_meters: null,
    walk_minutes: null,
    like_count: 0,
    comment_count: 0,
    liked_by_me: false,
  }));
}

export function hasNeighborhoodV2ExploreContent(detail: NeighborhoodDetail): boolean {
  return (
    detail.places.length > 0 || detail.events.length > 0 || detail.passport_offers.length > 0
  );
}

export function hasNeighborhoodV2LocalLife(detail: NeighborhoodDetail): boolean {
  return detail.tribes.length > 0 || detail.creators.length > 0;
}

export function hasNeighborhoodV2Stats(detail: NeighborhoodDetail): boolean {
  const stats = detail.stats;
  if (!stats) {
    return false;
  }
  return Object.values(stats).some((value) => value > 0);
}
