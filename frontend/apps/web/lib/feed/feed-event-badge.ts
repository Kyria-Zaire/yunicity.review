import { formatEventClockTime } from "@yunicity/utils";

function isSameLocalDay(startsAt: string, now: Date): boolean {
  const start = new Date(startsAt);
  if (Number.isNaN(start.getTime())) return false;
  return (
    start.getFullYear() === now.getFullYear() &&
    start.getMonth() === now.getMonth() &&
    start.getDate() === now.getDate()
  );
}

function isTonightHour(startsAt: string, now: Date): boolean {
  const start = new Date(startsAt);
  if (Number.isNaN(start.getTime())) return false;
  if (!isSameLocalDay(startsAt, now)) return false;
  const hour = start.getHours();
  return hour >= 18 && hour < 24;
}

/**
 * Badge horaire éditorial pour une carte événement du fil (ex. « CE SOIR · 20:30 »).
 */
export function formatFeedPostEventScheduleBadge(
  startsAt: string,
  now: Date = new Date(),
): string | null {
  const time = formatEventClockTime(startsAt);
  if (!time) return null;

  if (isTonightHour(startsAt, now)) {
    return `CE SOIR · ${time}`;
  }
  if (isSameLocalDay(startsAt, now)) {
    return `AUJOURD'HUI · ${time}`;
  }

  return time;
}
