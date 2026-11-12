/**
 * EVENTS-PAST-01 — règle temporelle unique d'un événement (à venir / en cours /
 * terminé), partagée par la vignette de statut et par les actions de la fiche.
 *
 * Convention de fin effective (décision D1-F2 du 12/11) :
 * - si `ends_at` est renseignée, lisible et non antérieure au début, c'est la
 *   fin ;
 * - sinon (absente, illisible ou antérieure au début), la fin retenue est la
 *   plus tardive entre `début + 2 h` et le minuit suivant le début, dans le
 *   fuseau `Europe/Paris`.
 *
 * Le repli n'est PAS une durée réelle : c'est une borne prudente pour ne jamais
 * déclarer terminé plus tôt que l'ancien repli `début + 2 h`. Le « minuit
 * suivant » est le premier instant du jour civil qui suit le jour du début, à
 * Paris ; il est calculé comme une date locale, sans supposer qu'une journée
 * dure 24 h (jours de 23 h ou 25 h aux changements d'heure). Un début à
 * 00:00 pile vise le minuit du jour suivant.
 *
 * Limites : terminé dès que maintenant >= fin ; en cours dès que maintenant >=
 * début. Les comparaisons portent sur des instants : le fuseau du navigateur
 * n'intervient pas.
 */

export type EventTimeStatus = "upcoming" | "ongoing" | "ended" | "unknown";

/** Repli historique d'affichage — pas une durée réelle garantie. */
export const EVENT_END_FALLBACK_MIN_DURATION_MS = 2 * 60 * 60 * 1000;

/** Fuseau de référence du « minuit suivant » (plateforme rémoise). */
export const EVENT_END_FALLBACK_TIME_ZONE = "Europe/Paris";

type WallClock = { year: number; month: number; day: number; hour: number; minute: number; second: number };

const wallClockFormatters = new Map<string, Intl.DateTimeFormat>();

function wallClockFormatter(timeZone: string): Intl.DateTimeFormat {
  let formatter = wallClockFormatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    });
    wallClockFormatters.set(timeZone, formatter);
  }
  return formatter;
}

function wallClockAt(instantMs: number, timeZone: string): WallClock {
  const parts = wallClockFormatter(timeZone).formatToParts(new Date(instantMs));
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? Number.NaN);
  return {
    year: read("year"),
    month: read("month"),
    day: read("day"),
    hour: read("hour"),
    minute: read("minute"),
    second: read("second"),
  };
}

/** Décalage (local − UTC) en ms du fuseau à cet instant. */
function zoneOffsetMs(instantMs: number, timeZone: string): number {
  const wall = wallClockAt(instantMs, timeZone);
  const wallAsUtc = Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute, wall.second);
  return wallAsUtc - Math.floor(instantMs / 1000) * 1000;
}

/** Instant UTC d'une heure murale locale (deux passes pour les changements d'heure). */
function localWallTimeToInstantMs(
  year: number,
  month: number,
  day: number,
  timeZone: string,
): number {
  const wallAsUtc = Date.UTC(year, month - 1, day, 0, 0, 0);
  const firstGuess = wallAsUtc - zoneOffsetMs(wallAsUtc, timeZone);
  const correctedOffset = zoneOffsetMs(firstGuess, timeZone);
  return wallAsUtc - correctedOffset;
}

/**
 * Premier instant du jour civil suivant celui de `instantMs`, dans `timeZone`.
 * Retourne `null` si le fuseau ou l'instant est inexploitable.
 */
export function nextLocalMidnightMs(
  instantMs: number,
  timeZone: string = EVENT_END_FALLBACK_TIME_ZONE,
): number | null {
  if (!Number.isFinite(instantMs)) return null;
  const wall = wallClockAt(instantMs, timeZone);
  if (![wall.year, wall.month, wall.day].every(Number.isFinite)) return null;
  const nextDay = new Date(Date.UTC(wall.year, wall.month - 1, wall.day + 1));
  return localWallTimeToInstantMs(
    nextDay.getUTCFullYear(),
    nextDay.getUTCMonth() + 1,
    nextDay.getUTCDate(),
    timeZone,
  );
}

/** Fin effective selon la convention ci-dessus ; `null` si le début est illisible. */
export function resolveEventEffectiveEndMs(startsAt: string, endsAt: string | null): number | null {
  const start = Date.parse(startsAt);
  if (!Number.isFinite(start)) return null;
  if (endsAt) {
    const end = Date.parse(endsAt);
    if (Number.isFinite(end) && end >= start) return end;
  }
  const fallback = start + EVENT_END_FALLBACK_MIN_DURATION_MS;
  const midnight = nextLocalMidnightMs(start);
  return midnight === null ? fallback : Math.max(fallback, midnight);
}

export function resolveEventTimeStatus(
  startsAt: string,
  endsAt: string | null,
  now: Date = new Date(),
): EventTimeStatus {
  const start = Date.parse(startsAt);
  const end = resolveEventEffectiveEndMs(startsAt, endsAt);
  const nowMs = now.getTime();
  if (!Number.isFinite(start) || end === null || !Number.isFinite(nowMs)) return "unknown";
  if (nowMs < start) return "upcoming";
  if (nowMs >= end) return "ended";
  return "ongoing";
}

/** Prochain instant où le statut change (début ou fin effective), ou `null`. */
export function nextEventTimeTransitionMs(
  startsAt: string,
  endsAt: string | null,
  now: Date = new Date(),
): number | null {
  const status = resolveEventTimeStatus(startsAt, endsAt, now);
  if (status === "upcoming") return Date.parse(startsAt);
  if (status === "ongoing") return resolveEventEffectiveEndMs(startsAt, endsAt);
  return null;
}
