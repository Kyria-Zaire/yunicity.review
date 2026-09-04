import type { LocalEvent } from "@yunicity/types";

import { eventTypeLabel, formatEventLocation } from "./event-labels";
import { resolveEventHeroImage } from "./event-hero-image";
import {
  eventCalendarDayKey,
  filterAgendaUpcomingEvents,
  formatEventClockTime,
} from "./events-agenda";
import { buildMapEventUrl } from "./explorer-links";
import { formatTerritorialLine } from "./neighborhood-labels";
import {
  MY_AGENDA_GROUP_LATER,
  MY_AGENDA_GROUP_TODAY,
  MY_AGENDA_GROUP_TOMORROW,
  MY_AGENDA_GROUP_WEEK,
} from "./my-agenda-labels";

const WEEKDAY_SHORT_FR = ["DIM", "LUN", "MAR", "MER", "JEU", "VEN", "SAM"] as const;
const MONTH_SHORT_FR = [
  "JAN",
  "FÉV",
  "MAR",
  "AVR",
  "MAI",
  "JUN",
  "JUL",
  "AOÛ",
  "SEP",
  "OCT",
  "NOV",
  "DÉC",
] as const;

export type MyAgendaGroupId = "today" | "tomorrow" | "this_week" | "later";

export type MyAgendaItem = {
  id: string;
  title: string;
  href: string;
  imageUrl: string | null;
  weekdayLabel: string;
  dayLabel: string;
  monthLabel: string;
  timeLabel: string;
  placeLabel: string;
  categoryLabel: string | null;
  startsAt: string;
  mapHref: string;
};

export type MyAgendaGroup = {
  id: MyAgendaGroupId;
  title: string;
  items: MyAgendaItem[];
};

function startOfLocalDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addLocalDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatAgendaPlace(event: LocalEvent, city: string): string {
  return (
    formatTerritorialLine(event.neighborhood_summary, event.city, event.district) ??
    formatEventLocation(event, city)
  );
}

export function buildMyAgendaItem(event: LocalEvent, city: string): MyAgendaItem {
  const date = new Date(event.starts_at);
  return {
    id: event.id,
    title: event.title,
    href: `/events/${event.id}`,
    imageUrl: resolveEventHeroImage(event, []),
    weekdayLabel: WEEKDAY_SHORT_FR[date.getDay()] ?? "—",
    dayLabel: String(date.getDate()),
    monthLabel: MONTH_SHORT_FR[date.getMonth()] ?? "—",
    timeLabel: formatEventClockTime(event.starts_at),
    placeLabel: formatAgendaPlace(event, city),
    categoryLabel: eventTypeLabel(event.event_type) || null,
    startsAt: event.starts_at,
    mapHref: buildMapEventUrl(event.id, { city }),
  };
}

export function buildMyAgendaGroups(
  savedEvents: LocalEvent[],
  city: string,
  now = new Date(),
): MyAgendaGroup[] {
  const upcoming = filterAgendaUpcomingEvents(savedEvents, now).sort(
    (a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at),
  );

  const todayStart = startOfLocalDay(now);
  const todayKey = eventCalendarDayKey(todayStart.toISOString());
  const tomorrowKey = eventCalendarDayKey(addLocalDays(todayStart, 1).toISOString());
  const weekEndExclusive = addLocalDays(todayStart, 7);

  const buckets: Record<MyAgendaGroupId, MyAgendaItem[]> = {
    today: [],
    tomorrow: [],
    this_week: [],
    later: [],
  };

  for (const event of upcoming) {
    const startsAt = Date.parse(event.starts_at);
    if (!Number.isFinite(startsAt)) continue;
    const key = eventCalendarDayKey(event.starts_at);
    const item = buildMyAgendaItem(event, city);

    if (key === todayKey) {
      buckets.today.push(item);
      continue;
    }
    if (key === tomorrowKey) {
      buckets.tomorrow.push(item);
      continue;
    }
    if (startsAt < weekEndExclusive.getTime()) {
      buckets.this_week.push(item);
      continue;
    }
    buckets.later.push(item);
  }

  const titles: Record<MyAgendaGroupId, string> = {
    today: MY_AGENDA_GROUP_TODAY,
    tomorrow: MY_AGENDA_GROUP_TOMORROW,
    this_week: MY_AGENDA_GROUP_WEEK,
    later: MY_AGENDA_GROUP_LATER,
  };

  const order: MyAgendaGroupId[] = ["today", "tomorrow", "this_week", "later"];
  return order
    .filter((id) => buckets[id].length > 0)
    .map((id) => ({ id, title: titles[id], items: buckets[id] }));
}

export function countMyAgendaItems(groups: MyAgendaGroup[]): number {
  return groups.reduce((sum, group) => sum + group.items.length, 0);
}
