import type { CulturalPlaceListItem, LocalEvent, Tribe } from "@yunicity/types";

import { eventTypeLabel } from "./event-labels";
import { resolveEventHeroImage } from "./event-hero-image";
import { neighborhoodAmbianceLabel } from "./neighborhood-labels";

export type AgendaWeekDay = {
  key: string;
  weekdayShort: string;
  dayNumber: number;
  isToday: boolean;
};

export type AgendaTimeSlot = "" | "tonight" | "afternoon";

export type AgendaHeroFilters = {
  query: string;
  timeSlot: AgendaTimeSlot;
  theme: string;
};

export type AfterworkCardItem =
  | { kind: "event"; id: string; event: LocalEvent }
  | { kind: "tribe"; id: string; tribe: Tribe };

const WEEKDAY_SHORT = ["DIM", "LUN", "MAR", "MER", "JEU", "VEN", "SAM"] as const;

const AFTERWORK_EVENT_TYPES = new Set([
  "cafe_meetup",
  "association_evening",
  "student_event",
  "creator_meetup",
  "meetup",
]);

const EVENT_VIBE_BY_TYPE: Record<string, string> = {
  local_concert: "Live & acoustique",
  exhibition: "Calme & culturel",
  cafe_meetup: "Convivial & doux",
  local_market: "Marché de quartier",
  association_evening: "Soirée associative",
  student_event: "Ambiance campus",
  creator_meetup: "Créatif & ouvert",
  partner_event: "Sortie partenaire",
  market: "Marché de quartier",
  meetup: "Rencontre locale",
  workshop: "Atelier intimiste",
};

function startOfLocalDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function eventCalendarDayKey(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Nombre de jours affichés dans le bandeau calendrier (2 semaines). */
export const AGENDA_CALENDAR_SPAN_DAYS = 14;

export function buildAgendaWeekDays(
  now = new Date(),
  spanDays = AGENDA_CALENDAR_SPAN_DAYS,
): AgendaWeekDay[] {
  const todayKey = eventCalendarDayKey(now.toISOString());
  const days: AgendaWeekDay[] = [];
  const cursor = startOfLocalDay(now);

  for (let i = 0; i < spanDays; i += 1) {
    const date = new Date(cursor);
    date.setDate(cursor.getDate() + i);
    const key = eventCalendarDayKey(date.toISOString());
    days.push({
      key,
      weekdayShort: WEEKDAY_SHORT[date.getDay()]!,
      dayNumber: date.getDate(),
      isToday: key === todayKey,
    });
  }

  return days;
}

export function filterAgendaUpcomingEvents(events: LocalEvent[], now = new Date()): LocalEvent[] {
  const nowMs = now.getTime();
  return events
    .filter((event) => !event.is_cancelled)
    .filter((event) => {
      const startsAt = Date.parse(event.starts_at);
      return Number.isFinite(startsAt) && startsAt >= nowMs;
    })
    .sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at));
}

export function filterEventsOnDay(events: LocalEvent[], dayKey: string): LocalEvent[] {
  if (!dayKey) return [];
  return events.filter((event) => eventCalendarDayKey(event.starts_at) === dayKey);
}

export function isAfterworkEvent(event: LocalEvent): boolean {
  const type = event.event_type?.trim().toLowerCase();
  return Boolean(type && AFTERWORK_EVENT_TYPES.has(type));
}

export function partitionAgendaDayEvents(events: LocalEvent[]): {
  highlights: LocalEvent[];
  afterwork: LocalEvent[];
} {
  const afterwork: LocalEvent[] = [];
  const highlights: LocalEvent[] = [];

  for (const event of events) {
    if (isAfterworkEvent(event)) {
      afterwork.push(event);
    } else {
      highlights.push(event);
    }
  }

  return { highlights, afterwork };
}

export function defaultAgendaDayKey(
  events: LocalEvent[],
  weekDays: AgendaWeekDay[],
  now = new Date(),
): string {
  const today = weekDays.find((day) => day.isToday)?.key ?? eventCalendarDayKey(now.toISOString());
  if (filterEventsOnDay(events, today).length > 0) {
    return today;
  }
  const firstWithEvents = weekDays.find((day) => filterEventsOnDay(events, day.key).length > 0);
  return firstWithEvents?.key ?? today;
}

function eventMatchesQuery(event: LocalEvent, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return true;
  const haystack = [
    event.title,
    event.location_name,
    event.district,
    event.neighborhood_summary?.display_name,
    eventTypeLabel(event.event_type),
    event.description,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

function eventMatchesTheme(event: LocalEvent, theme: string): boolean {
  const q = theme.trim().toLowerCase();
  if (q.length < 2) return true;
  const haystack = [
    event.title,
    event.location_name,
    event.district,
    event.neighborhood_summary?.display_name,
    eventTypeLabel(event.event_type),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

function eventMatchesTimeSlot(event: LocalEvent, slot: AgendaTimeSlot, now = new Date()): boolean {
  if (!slot) return true;
  const start = new Date(event.starts_at);
  if (Number.isNaN(start.getTime())) return false;

  const todayKey = eventCalendarDayKey(now.toISOString());
  if (eventCalendarDayKey(event.starts_at) !== todayKey) {
    return slot !== "tonight" && slot !== "afternoon";
  }

  const hour = start.getHours();
  if (slot === "tonight") {
    return hour >= 18;
  }
  if (slot === "afternoon") {
    return hour >= 12 && hour < 18;
  }
  return true;
}

export function filterAgendaHeroEvents(
  events: LocalEvent[],
  filters: AgendaHeroFilters,
  now = new Date(),
): LocalEvent[] {
  return events.filter(
    (event) =>
      eventMatchesQuery(event, filters.query) &&
      eventMatchesTheme(event, filters.theme) &&
      eventMatchesTimeSlot(event, filters.timeSlot, now),
  );
}

export function formatEventClockTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export function formatEventDurationLabel(
  startsAt: string,
  endsAt: string | null,
): string | null {
  if (!endsAt) return null;
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  const minutes = Math.round((end.getTime() - start.getTime()) / 60_000);
  if (minutes <= 0) return null;
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (rest === 0) return `${hours} h`;
  return `${hours} h ${rest} min`;
}

export function eventAgendaDistrictLine(event: LocalEvent): string {
  const district =
    event.neighborhood_summary?.display_name ?? event.district?.trim() ?? null;
  if (district) {
    return `Quartier ${district}`;
  }
  if (event.location_name) {
    return event.location_name;
  }
  return event.city;
}

export function eventAgendaVibeLine(event: LocalEvent): string {
  const type = event.event_type?.trim().toLowerCase();
  if (type && EVENT_VIBE_BY_TYPE[type]) {
    return EVENT_VIBE_BY_TYPE[type]!;
  }
  return "Sortie locale";
}

export function eventAgendaAccessHint(event: LocalEvent): string | null {
  if (event.latitude != null && event.longitude != null) {
    return "Voir sur la carte";
  }
  return null;
}

export function buildCityPulseLine(params: {
  city: string;
  eventsTonight: number;
  eventsThisWeek: number;
  neighborhoodAmbiance?: string | null;
  weatherCalm?: boolean;
}): string {
  const city = params.city.trim() || "Reims";
  const ambiance = neighborhoodAmbianceLabel(params.neighborhoodAmbiance);

  if (params.eventsTonight >= 2) {
    return "Les quartiers commencent à s’animer ce soir.";
  }

  if (params.eventsTonight === 1) {
    return "Une sortie douce vous attend ce soir.";
  }

  if (params.eventsThisWeek > 0) {
    return "Quelques sorties sont prévues cette semaine.";
  }

  if (params.weatherCalm && ambiance) {
    return `La ville est calme aujourd’hui — une ambiance ${ambiance} à savourer.`;
  }

  if (params.weatherCalm) {
    return "La ville est calme aujourd’hui.";
  }

  if (ambiance) {
    return `${city} respire doucement — parfait pour une découverte locale.`;
  }

  return "La ville est calme aujourd’hui.";
}

export function buildAfterworkItems(
  events: LocalEvent[],
  tribes: Tribe[],
  maxItems = 6,
): AfterworkCardItem[] {
  const items: AfterworkCardItem[] = [];
  const used = new Set<string>();

  for (const event of events) {
    if (!isAfterworkEvent(event)) continue;
    const id = `event:${event.id}`;
    if (used.has(id)) continue;
    used.add(id);
    items.push({ kind: "event", id, event });
    if (items.length >= maxItems) return items;
  }

  for (const tribe of tribes) {
    if (tribe.is_archived) continue;
    const id = `tribe:${tribe.slug}`;
    if (used.has(id)) continue;
    used.add(id);
    items.push({ kind: "tribe", id, tribe });
    if (items.length >= maxItems) return items;
  }

  return items;
}

/** @deprecated Préférer resolveEventHeroImage — alias pour compatibilité. */
export function resolveAgendaEventImage(
  event: LocalEvent,
  culturalPlaces: CulturalPlaceListItem[],
): string | null {
  return resolveEventHeroImage(event, culturalPlaces);
}
