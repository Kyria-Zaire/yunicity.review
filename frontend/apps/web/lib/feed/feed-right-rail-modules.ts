import type { LocalEvent, Tribe } from "@yunicity/types";

/**
 * D1.2 — selection PURE des modules du rail droit Desktop.
 *
 * Aucune requete : ces helpers derivent uniquement de `useFeedPortalContext`,
 * deja monte sur `/feed` a tous les breakpoints. Aucune donnee n'est inventee —
 * un champ absent fait disparaitre la ligne, jamais une valeur par defaut.
 */

/** Fenetre "soiree" locale, bornes incluses cote bas, exclues cote haut. */
export const TONIGHT_START_HOUR = 18;
export const TONIGHT_END_HOUR = 24;

export const TONIGHT_MAX_EVENTS = 3;
export const MEMBER_TRIBES_MAX = 3;

type ZonedParts = { date: string; hour: number };

/**
 * Date locale (YYYY-MM-DD) et heure locale d'un instant dans une timezone IANA.
 *
 * Une timezone invalide ferait lever `Intl` : on retombe alors sur `fallbackZone`
 * plutot que d'ecarter silencieusement l'evenement.
 */
function zonedParts(iso: string, timeZone: string, fallbackZone: string): ZonedParts | null {
  const instant = new Date(iso);
  if (Number.isNaN(instant.getTime())) return null;

  const read = (zone: string): ZonedParts => {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: zone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(instant);

    const get = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((part) => part.type === type)?.value ?? "";

    // `hour12:false` peut rendre "24" a minuit selon l'implementation.
    const hour = Number(get("hour")) % 24;
    return { date: `${get("year")}-${get("month")}-${get("day")}`, hour };
  };

  try {
    return read(timeZone);
  } catch {
    try {
      return read(fallbackZone);
    } catch {
      return null;
    }
  }
}

/**
 * Evenements reels commencant ce soir dans la ville, tries chronologiquement.
 *
 * Retenus si : non annules, meme date locale qu'aujourd'hui (dans la timezone de
 * l'evenement), debut encore a venir, et heure locale dans [18:00, 24:00[.
 */
export function selectTonightEvents(
  events: readonly LocalEvent[],
  now: Date = new Date(),
  limit: number = TONIGHT_MAX_EVENTS,
): LocalEvent[] {
  if (limit <= 0) return [];
  const nowMs = now.getTime();
  const viewerZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return events
    .filter((event) => {
      if (event.is_cancelled) return false;

      const startMs = new Date(event.starts_at).getTime();
      if (Number.isNaN(startMs) || startMs <= nowMs) return false;

      const zone = event.timezone || viewerZone;
      const start = zonedParts(event.starts_at, zone, viewerZone);
      const today = zonedParts(now.toISOString(), zone, viewerZone);
      if (!start || !today) return false;

      if (start.date !== today.date) return false;
      return start.hour >= TONIGHT_START_HOUR && start.hour < TONIGHT_END_HOUR;
    })
    .slice()
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
    .slice(0, limit);
}

/**
 * Prochains événements en soirée (>= 18h locales) quand aucun « ce soir ».
 * Utile en QA / hors fenêtre 18h–24h : le rail reste actionnable sans inventer de données.
 */
export function selectUpcomingEveningEvents(
  events: readonly LocalEvent[],
  now: Date = new Date(),
  limit: number = TONIGHT_MAX_EVENTS,
): LocalEvent[] {
  if (limit <= 0) return [];
  const nowMs = now.getTime();
  const viewerZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return events
    .filter((event) => {
      if (event.is_cancelled) return false;

      const startMs = new Date(event.starts_at).getTime();
      if (Number.isNaN(startMs) || startMs <= nowMs) return false;

      const zone = event.timezone || viewerZone;
      const start = zonedParts(event.starts_at, zone, viewerZone);
      if (!start) return false;

      return start.hour >= TONIGHT_START_HOUR && start.hour < TONIGHT_END_HOUR;
    })
    .slice()
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
    .slice(0, limit);
}

export function selectFeedRightRailEveningEvents(
  events: readonly LocalEvent[],
  now: Date = new Date(),
  limit: number = TONIGHT_MAX_EVENTS,
): { events: LocalEvent[]; mode: "tonight" | "upcoming-evening" | "upcoming" } {
  const tonight = selectTonightEvents(events, now, limit);
  if (tonight.length > 0) {
    return { events: tonight, mode: "tonight" };
  }

  const upcomingEvening = selectUpcomingEveningEvents(events, now, limit);
  if (upcomingEvening.length > 0) {
    return { events: upcomingEvening, mode: "upcoming-evening" };
  }

  const nowMs = now.getTime();
  const upcoming = events
    .filter((event) => {
      if (event.is_cancelled) return false;
      const startMs = new Date(event.starts_at).getTime();
      return !Number.isNaN(startMs) && startMs > nowMs;
    })
    .slice()
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
    .slice(0, limit);

  return { events: upcoming, mode: "upcoming" };
}

/**
 * Tribus dont l'utilisateur est reellement membre.
 *
 * L'ordre de la source est preserve : aucune notion d'activite recente n'existe
 * dans le contrat `Tribe`, on n'en invente donc aucune.
 */
export function selectMemberTribes(
  tribes: readonly Tribe[],
  limit: number = MEMBER_TRIBES_MAX,
): Tribe[] {
  if (limit <= 0) return [];
  return tribes.filter((tribe) => tribe.viewer_is_member && !tribe.is_archived).slice(0, limit);
}

/** Initiales deterministes, utilisees seulement si la tribu n'a pas de visuel. */
export function tribeInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  const letters = words.slice(0, 2).map((word) => [...word][0] ?? "");
  return letters.join("").toUpperCase();
}
