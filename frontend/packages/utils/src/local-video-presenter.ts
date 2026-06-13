import type { LocalVideoFeedItem, LocalVideoTypeId } from "@yunicity/types";

/** Player muted by default (DESIGN-CREATORS-V2). */
export const LOCAL_VIDEO_DEFAULT_MUTED = true;

export const LOCAL_VIDEO_EMPTY_MESSAGE = "Aucune vidéo autour de vous pour le moment.";
export const LOCAL_VIDEO_ERROR_MESSAGE = "Impossible de charger les vidéos.";
export const LOCAL_VIDEO_RETRY_LABEL = "Réessayer";
export const LOCAL_VIDEO_SESSION_EXPIRED_MESSAGE =
  "Votre session a expiré. Reconnectez-vous pour continuer.";
export const LOCAL_VIDEO_COMMENTS_EMPTY =
  "Soyez le premier à réagir à cette vidéo locale.";

export const LOCAL_VIDEO_TYPE_LABELS: Record<LocalVideoTypeId, string> = {
  bon_plan: "Bon plan",
  moment: "Moment",
  quartier: "Quartier",
  lieu: "Lieu",
  tribu: "Tribu",
  autre: "Autre",
};

export type VideoGoCta = {
  href: string;
  label: string;
  microCopy: string;
};

export type VideoTerritoryLines = {
  distance: string | null;
  neighborhood: string;
  temporal: string;
};

const MS_PER_MINUTE = 60_000;
const MS_PER_HOUR = 3_600_000;
const EVENING_HOUR = 18;

export function formatVideoDistanceLabel(distanceMeters: number | null | undefined): string | null {
  if (distanceMeters == null || distanceMeters <= 0) return null;
  if (distanceMeters < 1000) {
    const rounded = Math.round(distanceMeters / 50) * 50;
    return `À ${rounded} m de chez toi`;
  }
  const km = distanceMeters / 1000;
  const formatted = km < 10 ? km.toFixed(1).replace(".", ",") : String(Math.round(km));
  return `À ${formatted} km de chez toi`;
}

export function formatVideoTemporalLabel(
  publishedAt: string | null | undefined,
  now: Date = new Date(),
): string {
  if (!publishedAt) return "Ce soir";
  const published = new Date(publishedAt);
  if (Number.isNaN(published.getTime())) return "Ce soir";

  const diffMs = now.getTime() - published.getTime();
  if (diffMs < MS_PER_MINUTE) return "À l'instant";
  if (diffMs < MS_PER_HOUR) {
    const minutes = Math.max(1, Math.floor(diffMs / MS_PER_MINUTE));
    return `Il y a ${minutes} min`;
  }
  if (diffMs < MS_PER_HOUR * 24) {
    const hours = Math.max(1, Math.floor(diffMs / MS_PER_HOUR));
    return `Il y a ${hours} h`;
  }

  const hour = published.getHours();
  if (hour >= EVENING_HOUR) return "Ce soir";
  return published.toLocaleDateString("fr-FR", { weekday: "long" });
}

export function buildVideoTerritoryLines(item: LocalVideoFeedItem): VideoTerritoryLines {
  return {
    distance: formatVideoDistanceLabel(item.distance_meters),
    neighborhood: item.neighborhood_name,
    temporal: formatVideoTemporalLabel(item.published_at),
  };
}

export function formatLocalVideoTypeLabel(type: LocalVideoTypeId): string {
  return LOCAL_VIDEO_TYPE_LABELS[type] ?? "Vidéo";
}

export function formatVideoAuthorHandle(item: LocalVideoFeedItem): string {
  const username = item.author.username?.trim();
  if (username) return `@${username.replace(/^@/, "")}`;
  const slug = item.author.full_name.trim().toLowerCase().replace(/\s+/g, "");
  return slug ? `@${slug}` : "@citoyen";
}

export function resolveVideoGoCta(item: LocalVideoFeedItem): VideoGoCta {
  const walkSuffix =
    item.walk_minutes != null && item.walk_minutes > 0
      ? ` · ${item.walk_minutes} min`
      : "";

  if (item.local_event_id) {
    return {
      href: `/events/${item.local_event_id}`,
      label: walkSuffix ? `Y aller${walkSuffix}` : "Y aller",
      microCopy: buildCtaMicroCopy(item),
    };
  }

  if (item.cultural_place_slug) {
    return {
      href: `/places/${item.cultural_place_slug}`,
      label: walkSuffix ? `Y aller${walkSuffix}` : "Y aller",
      microCopy: buildCtaMicroCopy(item),
    };
  }

  if (item.latitude != null && item.longitude != null) {
    const params = new URLSearchParams({
      lat: String(item.latitude),
      lng: String(item.longitude),
    });
    return {
      href: `/map?${params.toString()}`,
      label: walkSuffix ? `Y aller${walkSuffix}` : "Y aller",
      microCopy: buildCtaMicroCopy(item),
    };
  }

  if (item.neighborhood_slug) {
    return {
      href: `/neighborhoods/${item.neighborhood_slug}`,
      label: "Découvrir le lieu",
      microCopy: buildCtaMicroCopy(item),
    };
  }

  return {
    href: "/sortir",
    label: "Découvrir le lieu",
    microCopy: buildCtaMicroCopy(item),
  };
}

function buildCtaMicroCopy(item: LocalVideoFeedItem): string {
  const temporal = formatVideoTemporalLabel(item.published_at);
  if (temporal === "Ce soir") return "Ça se passe ce soir";
  if (item.distance_meters != null && item.distance_meters > 0) {
    return "Découvert près de chez vous";
  }
  return item.neighborhood_name ? `À ${item.neighborhood_name}` : "Découvert près de chez vous";
}

/** IntersectionObserver helper — one active slide at a time. */
export function selectAutoplayVideoId(
  visibilityById: ReadonlyMap<string, number>,
  threshold = 0.55,
): string | null {
  let bestId: string | null = null;
  let bestRatio = threshold;
  for (const [id, ratio] of visibilityById) {
    if (ratio > bestRatio) {
      bestRatio = ratio;
      bestId = id;
    }
  }
  return bestId;
}

export function shouldKeepVideoMuted(userEnabledSound: boolean): boolean {
  return !userEnabledSound;
}
