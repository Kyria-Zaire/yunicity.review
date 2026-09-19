"use client";

import {
  NEIGHBORHOODS_DESKTOP_AMBIANCE_ITEMS,
  NEIGHBORHOODS_DESKTOP_AMBIANCES,
  NEIGHBORHOODS_DESKTOP_DISCOVER_ITEMS,
  NEIGHBORHOODS_DESKTOP_ENVIE_ITEMS,
  NEIGHBORHOODS_DESKTOP_ENVIES,
  NEIGHBORHOODS_DESKTOP_NAV_DISCOVER,
  NEIGHBORHOODS_DESKTOP_RESET_FILTERS,
  type NeighborhoodsDesktopAmbianceId,
  type NeighborhoodsDesktopDiscoverId,
  type NeighborhoodsDesktopEnvieId,
  type NeighborhoodsDesktopFilters,
} from "@yunicity/utils";
import {
  Crosshair,
  Heart,
  Home,
  Music2,
  RefreshCw,
  Star,
  Trees,
  Users,
  UtensilsCrossed,
} from "lucide-react";

const AMBIANCE_PILL: Record<string, string> = {
  peach: "bg-orange-100 text-orange-800 border-orange-200",
  purple: "bg-violet-100 text-violet-800 border-violet-200",
  yellow: "bg-amber-100 text-amber-900 border-amber-200",
  blue: "bg-sky-100 text-sky-800 border-sky-200",
  indigo: "bg-indigo-100 text-indigo-800 border-indigo-200",
  green: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

const DISCOVER_ICONS = {
  all: Home,
  near: Crosshair,
  mine: Heart,
  followed: Star,
} as const;

const ENVIE_ICONS = {
  sortir: Music2,
  manger: UtensilsCrossed,
  walk: Trees,
  participate: Users,
} as const;

type NeighborhoodsDesktopLeftRailProps = {
  filters: NeighborhoodsDesktopFilters;
  filtersActive: boolean;
  onDiscoverChange: (id: NeighborhoodsDesktopDiscoverId) => void;
  onToggleAmbiance: (id: NeighborhoodsDesktopAmbianceId) => void;
  onToggleEnvie: (id: NeighborhoodsDesktopEnvieId) => void;
  onReset: () => void;
};

export function NeighborhoodsDesktopLeftRail({
  filters,
  filtersActive,
  onDiscoverChange,
  onToggleAmbiance,
  onToggleEnvie,
  onReset,
}: NeighborhoodsDesktopLeftRailProps) {
  return (
    <aside
      className="flex w-full min-w-0 flex-col gap-6 lg:sticky lg:top-24 lg:pb-4"
      aria-label="Filtres quartiers"
      data-neighborhoods-desktop-left-rail=""
    >
      <section>
        <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-400">
          {NEIGHBORHOODS_DESKTOP_NAV_DISCOVER}
        </p>
        <ul className="space-y-1">
          {NEIGHBORHOODS_DESKTOP_DISCOVER_ITEMS.map((item) => {
            const Icon = DISCOVER_ICONS[item.id];
            const active = filters.discover === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  aria-current={active ? "page" : undefined}
                  onClick={() => onDiscoverChange(item.id)}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                    active
                      ? "bg-[#EEF0FF] text-yunicity-primary"
                      : "text-neutral-700 hover:bg-neutral-100"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="truncate">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-400">
          {NEIGHBORHOODS_DESKTOP_AMBIANCES}
        </p>
        <div className="flex flex-wrap gap-2">
          {NEIGHBORHOODS_DESKTOP_AMBIANCE_ITEMS.map((item) => {
            const active = filters.ambiances.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={active}
                onClick={() => onToggleAmbiance(item.id)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? `${AMBIANCE_PILL[item.tone]} ring-2 ring-yunicity-primary/30`
                    : `${AMBIANCE_PILL[item.tone]} opacity-80 hover:opacity-100`
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-400">
          {NEIGHBORHOODS_DESKTOP_ENVIES}
        </p>
        <ul className="space-y-1">
          {NEIGHBORHOODS_DESKTOP_ENVIE_ITEMS.map((item) => {
            const Icon = ENVIE_ICONS[item.id];
            const active = filters.envies.includes(item.id);
            return (
              <li key={item.id}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => onToggleEnvie(item.id)}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                    active
                      ? "bg-[#EEF0FF] text-yunicity-primary"
                      : "text-neutral-700 hover:bg-neutral-100"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden />
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {filtersActive ? (
        <button
          type="button"
          onClick={onReset}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-yunicity-primary/35 bg-white px-3 py-2.5 text-sm font-semibold text-yunicity-primary transition hover:bg-[#EEF0FF]"
        >
          <RefreshCw className="h-4 w-4" aria-hidden />
          {NEIGHBORHOODS_DESKTOP_RESET_FILTERS}
        </button>
      ) : null}
    </aside>
  );
}
