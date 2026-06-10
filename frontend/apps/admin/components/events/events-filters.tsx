"use client";

import type { AdminEventsListState } from "@/lib/events-url";
import { ADMIN_EVENT_MODERATION_STATUS_FILTER_OPTIONS, EVENT_TYPE_LABELS } from "@yunicity/utils";
import { RefreshCw, Search } from "lucide-react";
import { useEffect, useState } from "react";

const EVENT_TYPE_OPTIONS: { value: AdminEventsListState["eventType"]; label: string }[] = [
  { value: "", label: "Tous les types" },
  ...Object.entries(EVENT_TYPE_LABELS)
    .filter(([key]) =>
      [
        "cafe_meetup",
        "local_market",
        "association_evening",
        "student_event",
        "local_concert",
        "exhibition",
        "creator_meetup",
        "partner_event",
      ].includes(key),
    )
    .map(([value, label]) => ({ value, label })),
];

interface EventsFiltersProps {
  state: AdminEventsListState;
  isLoading: boolean;
  onStatusChange: (status: AdminEventsListState["status"]) => void;
  onCityChange: (city: string) => void;
  onEventTypeChange: (eventType: AdminEventsListState["eventType"]) => void;
  onSearchSubmit: (q: string) => void;
  onRefresh: () => void;
}

export function EventsFilters({
  state,
  isLoading,
  onStatusChange,
  onCityChange,
  onEventTypeChange,
  onSearchSubmit,
  onRefresh,
}: EventsFiltersProps) {
  const [q, setQ] = useState(state.q);

  useEffect(() => {
    setQ(state.q);
  }, [state.q]);

  function handleSearchSubmit(event: React.FormEvent) {
    event.preventDefault();
    onSearchSubmit(q);
  }

  return (
    <section className="space-y-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm md:p-5">
      <div>
        <h2 className="text-sm font-semibold text-stone-900">Piloter l&apos;agenda</h2>
        <p className="mt-1 text-sm text-stone-600">
          Filtrez et recherchez les événements du territoire.
        </p>
      </div>

      <form onSubmit={handleSearchSubmit} className="flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor="events-q">
          Rechercher un événement
        </label>
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
            aria-hidden
          />
          <input
            id="events-q"
            type="search"
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Rechercher par titre d'événement…"
            className="w-full rounded-lg border border-stone-300 py-2 pl-9 pr-3 text-sm text-stone-900 shadow-sm focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
            autoComplete="off"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-lg bg-stone-900 px-5 py-2 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-60"
        >
          Rechercher
        </button>
      </form>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="space-y-1">
          <span className="text-xs font-medium uppercase tracking-wide text-stone-500">
            Statut modération
          </span>
          <select
            value={state.status}
            onChange={(event) =>
              onStatusChange(event.target.value as AdminEventsListState["status"])
            }
            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900"
          >
            {ADMIN_EVENT_MODERATION_STATUS_FILTER_OPTIONS.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-xs font-medium uppercase tracking-wide text-stone-500">
            Type
          </span>
          <select
            value={state.eventType}
            onChange={(event) => onEventTypeChange(event.target.value)}
            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900"
          >
            {EVENT_TYPE_OPTIONS.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-xs font-medium uppercase tracking-wide text-stone-500">
            Ville
          </span>
          <input
            type="text"
            value={state.city}
            onChange={(event) => onCityChange(event.target.value)}
            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900"
            placeholder="Reims"
          />
        </label>

        <div className="flex items-end">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => void onRefresh()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50 disabled:opacity-50"
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
            Actualiser
          </button>
        </div>
      </div>
    </section>
  );
}
