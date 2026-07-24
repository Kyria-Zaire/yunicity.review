import type {
  LocalVideoFeedItem,
  NeighborhoodCommunityTagItem,
  NeighborhoodDetail,
  NeighborhoodDetailHistory,
  NeighborhoodLandmarkItem,
  NeighborhoodTimelineItem,
} from "@yunicity/types";

import { neighborhoodHasMapCoordinates, resolveNeighborhoodHeroImage } from "./neighborhood-detail";
import { isPendingYunicityHostedCoverUrl } from "./map-media-url";

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
export const NEIGHBORHOOD_V2_SHARE_MEMORY_CTA = "Partager un souvenir";
export const NEIGHBORHOOD_V2_SHARE_MEMORY_SOON = "Bientôt";
export const NEIGHBORHOOD_V2_STATS_TITLE = "Le quartier en chiffres";
export const NEIGHBORHOOD_V2_PRACTICAL_TITLE = "Infos pratiques";
export const NEIGHBORHOOD_V2_PRACTICAL_CITY = "Ville";
export const NEIGHBORHOOD_V2_PRACTICAL_HOOD = "Quartier";
export const NEIGHBORHOOD_V2_PRACTICAL_PLACES = "Lieux à découvrir";
export const NEIGHBORHOOD_V2_PRACTICAL_EVENTS = "Moments à venir";
export const NEIGHBORHOOD_V2_PRACTICAL_MAP_CTA = "Voir sur la carte";
export const NEIGHBORHOOD_V2_EXPLORE_ANCHOR = "neighborhood-explore";

// QUARTIER-01 phase 3f — vie du quartier (6 colonnes 3a), incontournables (landmarks),
// tags communautes (tribus suggerees) et credit photo du cover derive d'un landmark.
export const NEIGHBORHOOD_V2_LIFE_TITLE = "Le quartier au quotidien";
export const NEIGHBORHOOD_V2_LIFE_LABELS = {
  neighborhood_type: "Type de quartier",
  audience: "Pour qui",
  local_life: "Commerces & services",
  green_spaces: "Espaces verts",
  mobility: "Mobilité",
  daily_life: "Animations & vie de quartier",
} as const;
export const NEIGHBORHOOD_V2_LANDMARKS_TITLE = "Incontournables";
export const NEIGHBORHOOD_V2_COMMUNITY_TAGS_TITLE = "Communautés du quartier";
export const NEIGHBORHOOD_V2_COMMUNITY_TAG_EMPTY = "Aucune tribu pour le moment — à créer !";
export const NEIGHBORHOOD_V2_PHOTO_CREDIT_PREFIX = "Photo :";

// Ordre d'affichage des 6 colonnes de vie du quartier.
export const NEIGHBORHOOD_V2_LIFE_FIELD_ORDER = [
  "neighborhood_type",
  "audience",
  "local_life",
  "green_spaces",
  "mobility",
  "daily_life",
] as const satisfies readonly (keyof typeof NEIGHBORHOOD_V2_LIFE_LABELS)[];

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

/** Premier landmark disposant d'une image — source de cover réutilisable, avec son crédit. */
export function firstNeighborhoodV2LandmarkWithImage(
  detail: NeighborhoodDetail,
): NeighborhoodLandmarkItem | null {
  return (detail.landmarks ?? []).find((lm) => Boolean(lm.hero_image_url?.trim())) ?? null;
}

function neighborhoodOwnCover(detail: NeighborhoodDetail): string | null {
  return (detail.hero?.cover_image_url ?? detail.cover_image_url)?.trim() || null;
}

/**
 * Cœur PARTAGÉ (desktop + mobile) de la règle de cover 3f : le landmark dont l'image doit
 * REMPLACER le cover, quand le cover propre du quartier est « pending » (placeholder sans
 * fichier committé). null sinon — l'appelant garde alors son cover ou son fallback.
 *
 * Un seul endroit pour la règle « pending + landmark » : les deux resolvers (desktop et, par
 * délégation, mobile) l'appellent, donc image et crédit ne peuvent pas diverger. Ne touche NI
 * un cover réel (les 12 quartiers, pending-flaggés mais servis en 200, n'ont pas de landmark),
 * NI un quartier sans landmark (chatillons reste sur son fallback gradient).
 */
export function deriveHeroImageFromLandmarkIfPending(
  detail: NeighborhoodDetail,
  cover: string | null,
): NeighborhoodLandmarkItem | null {
  if (!cover || !isPendingYunicityHostedCoverUrl(cover)) {
    return null;
  }
  const landmark = firstNeighborhoodV2LandmarkWithImage(detail);
  return landmark?.hero_image_url?.trim() ? landmark : null;
}

export function resolveNeighborhoodV2HeroImage(detail: NeighborhoodDetail): string | null {
  const cover = neighborhoodOwnCover(detail);
  const landmark = deriveHeroImageFromLandmarkIfPending(detail, cover);
  if (landmark) {
    return landmark.hero_image_url!.trim();
  }
  if (cover) {
    return cover;
  }
  return resolveNeighborhoodHeroImage(detail);
}

/** Crédit du cover UNIQUEMENT quand il est dérivé d'un landmark (obligation CC BY-SA). */
export function resolveNeighborhoodV2HeroImageCredit(
  detail: NeighborhoodDetail,
): { photo_credit: string | null; image_license: string | null } | null {
  const landmark = deriveHeroImageFromLandmarkIfPending(detail, neighborhoodOwnCover(detail));
  if (!landmark) {
    return null;
  }
  const credit = landmark.photo_credit?.trim() || null;
  const license = landmark.image_license?.trim() || null;
  if (!credit && !license) {
    return null;
  }
  return { photo_credit: credit, image_license: license };
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

/** Histoire affichée — évite de répéter la citation déjà visible dans le hero. */
export function resolveNeighborhoodV2HistoryStoryForDisplay(
  detail: NeighborhoodDetail,
): NeighborhoodDetailHistory | null {
  const base = resolveNeighborhoodV2HistoryStory(detail);
  if (!base) {
    return null;
  }

  const heroQuote = resolveNeighborhoodV2HeroQuote(detail);
  const pullQuote =
    base.featured_quote?.trim() && base.featured_quote.trim() !== heroQuote?.trim()
      ? base.featured_quote
      : null;

  if (!base.long_story && !pullQuote) {
    return null;
  }

  return {
    long_story: base.long_story,
    featured_quote: pullQuote,
  };
}

export function buildNeighborhoodV2SeoDescription(detail: NeighborhoodDetail): string {
  const candidates = [
    resolveNeighborhoodV2HeroQuote(detail),
    detail.history?.long_story ?? detail.long_story ?? null,
    detail.short_description,
  ];

  for (const candidate of candidates) {
    if (!candidate?.trim()) {
      continue;
    }
    const normalized = candidate.replace(/\s+/g, " ").trim();
    if (normalized.length <= 160) {
      return normalized;
    }
    return `${normalized.slice(0, 159).trimEnd()}…`;
  }

  return `Découvrez le quartier ${detail.display_name} à ${detail.city} sur Yunicity.`;
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
    view_count: 0,
    liked_by_me: false,
  }));
}

export function hasNeighborhoodV2ExploreContent(detail: NeighborhoodDetail): boolean {
  return (
    detail.places.length > 0 || detail.events.length > 0 || detail.passport_offers.length > 0
  );
}

export function hasNeighborhoodV2LocalLife(detail: NeighborhoodDetail): boolean {
  return (
    detail.tribes.length > 0 ||
    detail.creators.length > 0 ||
    (detail.community_tags ?? []).length > 0
  );
}

export interface NeighborhoodV2LifeField {
  key: keyof typeof NEIGHBORHOOD_V2_LIFE_LABELS;
  label: string;
  value: string;
}

/** Les 6 colonnes de vie du quartier non vides, dans l'ordre — vides masquées (jamais inventé). */
export function listNeighborhoodV2LifeFields(detail: NeighborhoodDetail): NeighborhoodV2LifeField[] {
  return NEIGHBORHOOD_V2_LIFE_FIELD_ORDER.flatMap((key) => {
    const value = detail[key]?.trim();
    return value ? [{ key, label: NEIGHBORHOOD_V2_LIFE_LABELS[key], value }] : [];
  });
}

export function hasNeighborhoodV2Life(detail: NeighborhoodDetail): boolean {
  return listNeighborhoodV2LifeFields(detail).length > 0;
}

export function hasNeighborhoodV2Landmarks(detail: NeighborhoodDetail): boolean {
  return (detail.landmarks ?? []).length > 0;
}

export function listNeighborhoodV2Landmarks(detail: NeighborhoodDetail): NeighborhoodLandmarkItem[] {
  return detail.landmarks ?? [];
}

export function hasNeighborhoodV2CommunityTags(detail: NeighborhoodDetail): boolean {
  return (detail.community_tags ?? []).length > 0;
}

export function listNeighborhoodV2CommunityTags(
  detail: NeighborhoodDetail,
): NeighborhoodCommunityTagItem[] {
  return detail.community_tags ?? [];
}

export function hasNeighborhoodV2Stats(detail: NeighborhoodDetail): boolean {
  const stats = detail.stats;
  if (!stats) {
    return false;
  }
  return Object.values(stats).some((value) => value > 0);
}

export function hasNeighborhoodV2PracticalBlock(detail: NeighborhoodDetail): boolean {
  const stats = detail.stats;
  return (
    Boolean(detail.city?.trim()) &&
    Boolean(detail.display_name?.trim()) &&
    (neighborhoodHasMapCoordinates(detail) ||
      (stats?.places_count ?? 0) > 0 ||
      (stats?.events_count ?? 0) > 0)
  );
}

export function listNeighborhoodV2VisibleStatKeys(
  stats: import("@yunicity/types").NeighborhoodDetailStats,
): (keyof import("@yunicity/types").NeighborhoodDetailStats)[] {
  return (Object.keys(NEIGHBORHOOD_V2_STAT_LABELS) as (keyof typeof NEIGHBORHOOD_V2_STAT_LABELS)[]).filter(
    (key) => stats[key] > 0,
  );
}
