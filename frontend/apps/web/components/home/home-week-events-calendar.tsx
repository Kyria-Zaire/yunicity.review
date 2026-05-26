import type { LocalEvent } from "@yunicity/types";
import { HOME_VIEW_ALL_EVENTS, formatEventLocation, formatTerritorialLine } from "@yunicity/utils";
import Link from "next/link";

function calendarDayParts(iso: string): { month: string; day: string } {
  const date = new Date(iso);
  const month = date
    .toLocaleDateString("fr-FR", { month: "short" })
    .replace(".", "")
    .toUpperCase();
  return { month, day: String(date.getDate()) };
}

function formatEventTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function eventPlace(event: LocalEvent): string {
  return (
    formatTerritorialLine(event.neighborhood_summary, event.city, event.district) ??
    formatEventLocation(event, event.city) ??
    event.city
  );
}

export function HomeWeekEventsCalendar({ events, city }: { events: LocalEvent[]; city: string }) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-neutral-500">
        Aucun moment annoncé cette semaine à {city} — revenez bientôt.
      </p>
    );
  }

  const sorted = [...events].sort(
    (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
  );

  return (
    <div className="space-y-3">
      <ul className="space-y-3">
        {sorted.map((event) => {
          const { month, day } = calendarDayParts(event.starts_at);
          const time = formatEventTime(event.starts_at);
          const place = eventPlace(event);

          return (
            <li key={event.id}>
              <Link
                href={`/events/${event.id}`}
                className="group flex gap-3 rounded-xl border border-neutral-100 bg-neutral-50/80 p-3 transition hover:border-neutral-200 hover:bg-white hover:shadow-sm"
              >
                <div
                  className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg border border-neutral-200 bg-white text-center"
                  aria-hidden
                >
                  <span className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">
                    {month}
                  </span>
                  <span className="text-lg font-bold leading-none text-neutral-900">{day}</span>
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="font-medium leading-snug text-neutral-900 group-hover:text-yunicity-primary">
                    {event.title}
                  </p>
                  {time ? (
                    <p className="mt-1 text-xs font-medium text-neutral-600">{time}</p>
                  ) : null}
                  <p className="mt-0.5 line-clamp-2 text-xs text-neutral-500">{place}</p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
      <Link
        href="/events"
        className="inline-block text-sm font-medium text-yunicity-primary hover:underline"
      >
        {HOME_VIEW_ALL_EVENTS}
      </Link>
    </div>
  );
}
