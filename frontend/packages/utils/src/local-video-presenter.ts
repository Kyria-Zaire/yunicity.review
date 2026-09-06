import type { LocalVideoFeedItem, LocalVideoTypeId } from "@yunicity/types";

/** Player muted by default (DESIGN-CREATORS-V2). */
export const LOCAL_VIDEO_DEFAULT_MUTED = true;

export const LOCAL_VIDEO_EMPTY_MESSAGE = "Aucune vidéo autour de vous pour le moment.";
export const LOCAL_VIDEO_ERROR_MESSAGE = "Impossible de charger les vidéos.";
/** Erreur de lecture d'une source vidéo individuelle (élément `<video onError>`). */
export const LOCAL_VIDEO_PLAYBACK_ERROR = "Impossible de lire cette vidéo.";
/** Texte fallback enfant de `<video>` pour navigateurs sans support ou source invalide. */
export const LOCAL_VIDEO_PLAYBACK_FALLBACK =
  "Votre navigateur ne peut pas lire cette vidéo.";
export const LOCAL_VIDEO_RETRY_LABEL = "Réessayer";
export const LOCAL_VIDEO_SESSION_EXPIRED_MESSAGE =
  "Votre session a expiré. Reconnectez-vous pour continuer.";
export const LOCAL_VIDEO_COMMENTS_EMPTY =
  "Soyez le premier à réagir à cette vidéo locale.";
export const LOCAL_VIDEO_SOCIAL_PROOF_LABEL = "Les Rémois réagissent.";
export const LOCAL_VIDEO_TERRITORY_FALLBACK = "Dans votre ville";

export const LOCAL_VIDEO_TYPE_LABELS: Record<LocalVideoTypeId, string> = {
  bon_plan: "Bon plan",
  moment: "Moment",
  quartier: "Quartier",
  lieu: "Lieu",
  tribu: "Tribu",
  autre: "Autre",
};

const LOCAL_VIDEO_TYPE_EMOJI: Record<LocalVideoTypeId, string> = {
  bon_plan: "☕",
  moment: "📅",
  quartier: "🏘️",
  lieu: "📍",
  tribu: "👥",
  autre: "✨",
};

export const LOCAL_VIDEO_WOW_COPY_MAX_LENGTH = 55;

export type VideoGoCta = {
  href: string;
  label: string;
  microCopy: string;
};

export type VideoTerritoryLines = {
  distance: string;
  walk: string | null;
  neighborhood: string;
  temporal: string;
};

const MS_PER_MINUTE = 60_000;
const MS_PER_HOUR = 3_600_000;
const EVENING_HOUR = 18;

function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isYesterday(published: Date, now: Date): boolean {
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  return isSameCalendarDay(published, yesterday);
}

export function formatVideoDistanceLabel(distanceMeters: number | null | undefined): string | null {
  if (distanceMeters == null || distanceMeters <= 0) return null;
  if (distanceMeters < 1000) {
    const rounded = Math.round(distanceMeters / 50) * 50;
    return `À ${rounded} m de chez vous`;
  }
  const km = distanceMeters / 1000;
  const formatted = km < 10 ? km.toFixed(1).replace(".", ",") : String(Math.round(km));
  return `À ${formatted} km de chez vous`;
}

export function formatVideoWalkLabel(walkMinutes: number | null | undefined): string | null {
  if (walkMinutes == null || walkMinutes <= 0) return null;
  return `${walkMinutes} min à pied`;
}

export function formatVideoTemporalLabel(
  publishedAt: string | null | undefined,
  now: Date = new Date(),
): string {
  if (!publishedAt) return "Aujourd'hui";
  const published = new Date(publishedAt);
  if (Number.isNaN(published.getTime())) return "Aujourd'hui";

  const diffMs = now.getTime() - published.getTime();
  if (diffMs < MS_PER_MINUTE) return "À l'instant";
  if (diffMs < MS_PER_HOUR) {
    const minutes = Math.max(1, Math.floor(diffMs / MS_PER_MINUTE));
    return `Il y a ${minutes} min`;
  }
  if (isYesterday(published, now)) return "Hier";
  if (isSameCalendarDay(published, now)) return "Aujourd'hui";
  if (diffMs < MS_PER_HOUR * 24) {
    const hours = Math.max(1, Math.floor(diffMs / MS_PER_HOUR));
    return `Il y a ${hours} h`;
  }

  const hour = published.getHours();
  if (hour >= EVENING_HOUR) return "Ce soir";
  return published.toLocaleDateString("fr-FR", { weekday: "long" });
}

export function buildVideoTerritoryLines(
  item: LocalVideoFeedItem,
  now: Date = new Date(),
): VideoTerritoryLines {
  return {
    distance: formatVideoDistanceLabel(item.distance_meters) ?? LOCAL_VIDEO_TERRITORY_FALLBACK,
    walk: formatVideoWalkLabel(item.walk_minutes),
    neighborhood: item.neighborhood_name,
    temporal: formatVideoTemporalLabel(item.published_at, now),
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

export function formatVideoAuthorDisplayName(item: LocalVideoFeedItem): string {
  const fullName = item.author.full_name?.trim();
  if (fullName) return fullName;
  const username = item.author.username?.trim();
  if (username) return username.replace(/^@/, "");
  return "Citoyen";
}

export function formatVideoContextLine(item: LocalVideoFeedItem): string {
  const emoji = LOCAL_VIDEO_TYPE_EMOJI[item.video_type] ?? LOCAL_VIDEO_TYPE_EMOJI.autre;
  const placeName = item.cultural_place_name?.trim();
  if (placeName) return `${emoji} ${placeName}`;
  if (item.local_event_id && item.video_type === "moment") {
    return `${LOCAL_VIDEO_TYPE_EMOJI.moment} Événement local`;
  }
  return `${emoji} ${formatLocalVideoTypeLabel(item.video_type)}`;
}

export function resolveLocalVideoWowCopy(
  item: LocalVideoFeedItem,
  now: Date = new Date(),
): string {
  let copy: string;
  switch (item.video_type) {
    case "bon_plan":
      copy = "Découvert près de chez vous.";
      break;
    case "moment": {
      const temporal = formatVideoTemporalLabel(item.published_at, now);
      const isSoon =
        temporal === "À l'instant" ||
        temporal.startsWith("Il y a") ||
        temporal === "Aujourd'hui" ||
        temporal === "Ce soir";
      copy =
        item.local_event_id && isSoon
          ? "Encore le temps d'y aller."
          : "Ça se passe aujourd'hui.";
      break;
    }
    case "quartier":
      copy = "Une autre façon de voir votre quartier.";
      break;
    case "lieu": {
      const city = item.city?.trim() || "Reims";
      copy = `Un endroit à découvrir à ${city}.`;
      break;
    }
    case "tribu":
      copy = "Votre communauté se retrouve ici.";
      break;
    default:
      copy = "La ville a toujours quelque chose à raconter.";
  }
  return copy.length <= LOCAL_VIDEO_WOW_COPY_MAX_LENGTH
    ? copy
    : `${copy.slice(0, LOCAL_VIDEO_WOW_COPY_MAX_LENGTH - 1).trim()}…`;
}

export function shouldShowLocalVideoSocialProof(item: LocalVideoFeedItem): boolean {
  return item.like_count + item.comment_count > 0;
}

function formatWalkSuffix(walkMinutes: number | null | undefined): string {
  if (walkMinutes != null && walkMinutes > 0) return ` • ${walkMinutes} min`;
  return "";
}

function formatBonPlanCtaLabel(
  placeName: string | null | undefined,
  walkMinutes: number | null | undefined,
): string {
  const walkSuffix = formatWalkSuffix(walkMinutes);
  const name = placeName?.trim();
  if (!name) return `Explorer Reims${walkSuffix}`;
  const lower = name.toLowerCase();
  if (lower.includes("café") || lower.includes("cafe")) {
    return `Découvrir le café${walkSuffix}`;
  }
  if (name.length <= 22) return `Découvrir ${name}${walkSuffix}`;
  return `Découvrir le lieu${walkSuffix}`;
}

export function resolveVideoGoCta(item: LocalVideoFeedItem): VideoGoCta {
  const microCopy = resolveLocalVideoWowCopy(item);
  const walkSuffix = formatWalkSuffix(item.walk_minutes);
  const city = item.city?.trim() || "Reims";
  const neighborhood = item.neighborhood_name?.trim() || city;

  switch (item.video_type) {
    case "bon_plan":
      if (item.cultural_place_slug) {
        return {
          href: `/places/${item.cultural_place_slug}`,
          label: formatBonPlanCtaLabel(item.cultural_place_name, item.walk_minutes),
          microCopy,
        };
      }
      break;
    case "moment":
      if (item.local_event_id) {
        return {
          href: `/events/${item.local_event_id}`,
          label: `Participer ce soir${walkSuffix}`,
          microCopy,
        };
      }
      break;
    case "quartier":
      return {
        href: item.neighborhood_slug
          ? `/neighborhoods/${item.neighborhood_slug}`
          : "/sortir",
        label: `Explorer ${neighborhood}`,
        microCopy,
      };
    case "lieu":
      if (item.cultural_place_slug) {
        return {
          href: `/places/${item.cultural_place_slug}`,
          label: `Voir le lieu${walkSuffix}`,
          microCopy,
        };
      }
      break;
    case "tribu":
      return {
        href: "/tribes",
        label: "Rejoindre la tribu",
        microCopy,
      };
    default:
      break;
  }

  if (item.local_event_id) {
    return {
      href: `/events/${item.local_event_id}`,
      label: `Participer ce soir${walkSuffix}`,
      microCopy,
    };
  }

  if (item.cultural_place_slug) {
    return {
      href: `/places/${item.cultural_place_slug}`,
      label: formatBonPlanCtaLabel(item.cultural_place_name, item.walk_minutes),
      microCopy,
    };
  }

  if (item.latitude != null && item.longitude != null) {
    const params = new URLSearchParams({
      lat: String(item.latitude),
      lng: String(item.longitude),
    });
    return {
      href: `/map?${params.toString()}`,
      label: `Explorer ${city}${walkSuffix}`,
      microCopy,
    };
  }

  if (item.neighborhood_slug) {
    return {
      href: `/neighborhoods/${item.neighborhood_slug}`,
      label: `Explorer ${neighborhood}`,
      microCopy,
    };
  }

  return {
    href: "/sortir",
    label: `Explorer ${city}`,
    microCopy,
  };
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
