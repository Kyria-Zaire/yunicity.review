"use client";

import type { SortirDesktopWhenId } from "@yunicity/utils";
import {
  SORTIR_DESKTOP_FILTERS_TITLE,
  SORTIR_DESKTOP_WHEN_TODAY,
  SORTIR_DESKTOP_WHEN_TOMORROW,
  SORTIR_DESKTOP_WHEN_WEEKEND,
} from "@yunicity/utils";
import { CalendarCheck, ChevronDown, MapPin, SlidersHorizontal } from "lucide-react";
import type { RefObject } from "react";

const WHEN_LABELS: Record<SortirDesktopWhenId, string> = {
  today: SORTIR_DESKTOP_WHEN_TODAY,
  tomorrow: SORTIR_DESKTOP_WHEN_TOMORROW,
  weekend: SORTIR_DESKTOP_WHEN_WEEKEND,
  pick_date: SORTIR_DESKTOP_WHEN_TODAY,
};

type SortirMediumActionBarProps = {
  city: string;
  activeWhen: SortirDesktopWhenId;
  activeFilterCount: number;
  onOpenWhen: () => void;
  onOpenFilters: () => void;
  whenButtonRef?: RefObject<HTMLButtonElement>;
};

export function SortirMediumActionBar({
  city,
  activeWhen,
  activeFilterCount,
  onOpenWhen,
  onOpenFilters,
  whenButtonRef,
}: SortirMediumActionBarProps) {
  return (
    <div
      className="sortir-medium-action-bar flex flex-wrap gap-2"
      data-sortir-medium-action-bar=""
      aria-label="Contrôles de filtrage"
    >
      <button
        ref={whenButtonRef}
        type="button"
        onClick={onOpenWhen}
        className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 text-sm font-semibold text-yunicity-primary transition hover:border-yunicity-primary/30 hover:bg-[#EEF0FF] sm:flex-none sm:px-4"
      >
        <CalendarCheck className="h-4 w-4 shrink-0" aria-hidden />
        {WHEN_LABELS[activeWhen]}
      </button>

      <button
        type="button"
        onClick={onOpenFilters}
        className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 text-sm font-semibold text-neutral-800 transition hover:border-neutral-300 sm:flex-none sm:px-4"
        aria-label={
          activeFilterCount > 0
            ? `${SORTIR_DESKTOP_FILTERS_TITLE} — ${activeFilterCount} actif${activeFilterCount > 1 ? "s" : ""}`
            : SORTIR_DESKTOP_FILTERS_TITLE
        }
      >
        <SlidersHorizontal className="h-4 w-4 shrink-0 text-neutral-600" aria-hidden />
        {SORTIR_DESKTOP_FILTERS_TITLE}
        {activeFilterCount > 0 ? (
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-yunicity-primary px-1.5 text-[11px] font-bold text-white">
            {activeFilterCount}
          </span>
        ) : null}
      </button>

      <div className="relative min-w-0 flex-1 sm:flex-none sm:min-w-[9rem]">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" aria-hidden />
        <select
          value={city}
          disabled
          aria-label="Ville"
          className="h-10 w-full appearance-none rounded-xl border border-neutral-200 bg-white pl-9 pr-9 text-sm font-medium text-neutral-800"
        >
          <option value={city}>{city}</option>
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" aria-hidden />
      </div>
    </div>
  );
}
