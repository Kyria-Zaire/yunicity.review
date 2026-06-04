"use client";

import type { AdminEventsListState } from "@/lib/events-url";
import { ADMIN_EVENT_MODERATION_STATUS_FILTER_OPTIONS } from "@yunicity/utils";

interface EventsFiltersProps {
  state: AdminEventsListState;
  isLoading: boolean;
  onStatusChange: (status: AdminEventsListState["status"]) => void;
  onCityChange: (city: string) => void;
  onRefresh: () => void;
}

export function EventsFilters({
  state,
  isLoading,
  onStatusChange,
  onCityChange,
  onRefresh,
}: EventsFiltersProps) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50 disabled:opacity-50"
          >
            Actualiser
          </button>
        </div>
      </div>
    </section>
  );
}
