import type { LocalVideoFeedItem, LocalVideoTypeId } from "@yunicity/types";

import { buildMapPlaceUrl } from "./explorer-links";
import { VIDEOS_DESKTOP_DISCOVER_PLACE } from "./local-video-portal-labels";
import {
  LOCAL_VIDEO_TYPE_LABELS,
  formatVideoAuthorDisplayName,
  resolveLocalVideoWowCopy,
  resolveVideoGoCta,
  type VideoGoCta,
} from "./local-video-presenter";

/** Seuil height/width au-delà duquel une vidéo est considérée portrait. */
export const LOCAL_VIDEO_PORTRAIT_RATIO_THRESHOLD = 1.05;

export type LocalVideoFeedLayout = "portrait" | "landscape";

/**
 * Détermine le layout feed desktop à partir des dimensions API (ffprobe backend).
 * Sans dimensions, retombe sur paysage (ratio 16:9 par défaut côté UI).
 */
export function resolveLocalVideoLayout(item: LocalVideoFeedItem): LocalVideoFeedLayout {
  const width = item.media_width;
  const height = item.media_height;
  if (width != null && height != null && width > 0 && height > 0) {
    return height / width > LOCAL_VIDEO_PORTRAIT_RATIO_THRESHOLD ? "portrait" : "landscape";
  }
  return "landscape";
}

export function buildVideoAuthorProfileHref(item: LocalVideoFeedItem): string | null {
  const username = item.author.username?.trim().replace(/^@/, "");
  if (!username) return null;
  return `/profile/${encodeURIComponent(username)}`;
}

export type VideoPortalTopic = {
  type: LocalVideoTypeId;
  label: string;
  count: number;
};

/** Agrège les types vidéo présents dans le feed pour le rail « Vos sujets ». */
export function extractVideoPortalTopics(
  items: readonly LocalVideoFeedItem[],
  max = 4,
): VideoPortalTopic[] {
  const counts = new Map<LocalVideoTypeId, number>();
  for (const item of items) {
    counts.set(item.video_type, (counts.get(item.video_type) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([type, count]) => ({
      type,
      label: LOCAL_VIDEO_TYPE_LABELS[type],
      count,
    }));
}

export function formatVideosPortalSubtitle(city: string): string {
  const trimmed = city.trim();
  if (!trimmed) return "Découvrez votre territoire autrement";
  return `Découvrez ${trimmed} autrement`;
}

const PORTRAIT_TYPE_HASHTAGS: Record<LocalVideoTypeId, string> = {
  bon_plan: "BonnesAdresses",
  moment: "MomentLocal",
  quartier: "VieDeQuartier",
  lieu: "LieuLocal",
  tribu: "Tribu",
  autre: "Reims",
};

function toHashtagToken(raw: string): string | null {
  const cleaned = raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "")
    .trim();
  if (!cleaned) return null;
  return `#${cleaned[0]!.toUpperCase()}${cleaned.slice(1)}`;
}

/** Lieu / contexte affiché dans la pill verte — adapté au type de publication. */
export function resolveVideosPortraitPlaceLabel(item: LocalVideoFeedItem): string | null {
  switch (item.video_type) {
    case "lieu":
    case "bon_plan":
      return (
        item.cultural_place_name?.trim() ||
        item.neighborhood_name?.trim() ||
        item.city?.trim() ||
        null
      );
    case "quartier":
      return item.neighborhood_name?.trim() || item.city?.trim() || null;
    case "moment":
      return (
        item.cultural_place_name?.trim() ||
        item.neighborhood_name?.trim() ||
        (item.local_event_id ? "Événement local" : null) ||
        item.city?.trim() ||
        null
      );
    case "tribu":
      return item.neighborhood_name?.trim() || item.city?.trim() || "Tribu locale";
    default:
      return item.neighborhood_name?.trim() || item.city?.trim() || null;
  }
}

/** Hashtags dérivés de la ville + type (et tags éventuels dans la description). */
export function buildVideosPortraitHashtags(item: LocalVideoFeedItem): string[] {
  const tags: string[] = [];
  const cityTag = item.city?.trim() ? toHashtagToken(item.city) : null;
  if (cityTag) tags.push(cityTag);

  const typeTag = toHashtagToken(PORTRAIT_TYPE_HASHTAGS[item.video_type]);
  if (typeTag && !tags.includes(typeTag)) tags.push(typeTag);

  const description = item.description?.trim() ?? "";
  for (const match of description.matchAll(/#([\p{L}\p{N}_]+)/gu)) {
    const tag = `#${match[1]}`;
    if (!tags.includes(tag)) tags.push(tag);
  }

  return tags.slice(0, 4);
}

export function resolveVideosPortraitMapHref(item: LocalVideoFeedItem): string | null {
  if (item.cultural_place_slug) {
    return buildMapPlaceUrl(item.cultural_place_slug, { city: item.city });
  }
  if (item.latitude != null && item.longitude != null) {
    return `/map?lat=${item.latitude}&lng=${item.longitude}`;
  }
  if (item.video_type === "quartier" && item.neighborhood_slug) {
    return `/neighborhoods/${item.neighborhood_slug}`;
  }
  return null;
}

/**
 * CTA secondaire du panneau portrait.
 * Priorité : fiche lieu `/places/{slug}` avec label « Découvrir ce lieu ».
 * Pas de fallback « Explorer {ville} » (carte) — réservé au CTA carte.
 */
export function resolveVideosPortraitDiscoverCta(item: LocalVideoFeedItem): VideoGoCta | null {
  if (item.cultural_place_slug?.trim()) {
    const slug = item.cultural_place_slug.trim();
    return {
      href: `/places/${encodeURIComponent(slug)}`,
      label: VIDEOS_DESKTOP_DISCOVER_PLACE,
      microCopy: resolveLocalVideoWowCopy(item),
    };
  }

  const cta = resolveVideoGoCta(item);
  if (cta.href.startsWith("/map")) return null;
  return cta;
}

export function formatVideosPortraitOriginalSound(item: LocalVideoFeedItem): string {
  return `Son original · ${formatVideoAuthorDisplayName(item)}`;
}

/**
 * Choisit les vidéos éditoriales du fil local (max 2) :
 * une portrait + une paysage si disponibles, sinon complété par ordre API.
 */
export function selectFeedStreamLocalVideos(
  items: readonly LocalVideoFeedItem[],
  max = 2,
): LocalVideoFeedItem[] {
  if (items.length === 0 || max <= 0) return [];

  const portrait = items.find((item) => resolveLocalVideoLayout(item) === "portrait");
  const landscape = items.find((item) => resolveLocalVideoLayout(item) === "landscape");
  const selected: LocalVideoFeedItem[] = [];

  if (portrait) selected.push(portrait);
  if (landscape && landscape.id !== portrait?.id) selected.push(landscape);

  for (const item of items) {
    if (selected.length >= max) break;
    if (!selected.some((entry) => entry.id === item.id)) selected.push(item);
  }

  return selected.slice(0, max);
}

/** Première vidéo éditoriale (compat) — priorise le portrait. */
export function selectFeedStreamLocalVideo(
  items: readonly LocalVideoFeedItem[],
): LocalVideoFeedItem | null {
  return selectFeedStreamLocalVideos(items, 1)[0] ?? null;
}
