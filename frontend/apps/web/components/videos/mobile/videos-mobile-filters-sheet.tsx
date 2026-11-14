"use client";

import type { LocalVideoFeedItem } from "@yunicity/types";
import type { VideosPortalSidebarFilters } from "@yunicity/utils";
import { Drawer } from "@yunicity/ui/primitives";
import {
  VIDEOS_DATE_MONTH,
  VIDEOS_DATE_TODAY,
  VIDEOS_DATE_WEEK,
  VIDEOS_DURATION_LONG,
  VIDEOS_DURATION_MEDIUM,
  VIDEOS_DURATION_SHORT,
  VIDEOS_FILTER_ALL,
  VIDEOS_FILTER_ALL_DURATIONS,
  VIDEOS_FILTER_ALL_LOCATIONS,
  VIDEOS_FILTER_ALL_PERIODS,
  VIDEOS_FILTER_ALL_POPULARITY,
  VIDEOS_FILTER_CATEGORY,
  VIDEOS_FILTER_DATE,
  VIDEOS_FILTER_DURATION,
  VIDEOS_FILTER_LOCATION,
  VIDEOS_FILTER_POPULARITY,
  VIDEOS_MOBILE_FILTERS_CLOSE,
  VIDEOS_MOBILE_FILTERS_LOCATION_HINT,
  VIDEOS_MOBILE_FILTERS_RESET,
  VIDEOS_SIDEBAR_FILTERS_TITLE,
  formatVideosMobileFiltersSee,
  formatVideosMobileFiltersStatus,
  listVideoPortalCategoryOptions,
  resolveVideoPortalNeighborhoodLabel,
} from "@yunicity/utils";
import type { RefObject } from "react";

import { Z_INDEX } from "@/lib/layout/z-index";
import { VIDEO_IMMERSIVE_FOCUS } from "@/lib/videos/video-playback-a11y";

type VideosMobileFiltersSheetProps = {
  open: boolean;
  viewLabel: string;
  filters: VideosPortalSidebarFilters;
  neighborhoods: string[];
  items: readonly LocalVideoFeedItem[];
  resultCount: number;
  loadedCount: number;
  onClose: () => void;
  onReset: () => void;
  onChange: <K extends keyof VideosPortalSidebarFilters>(
    key: K,
    value: VideosPortalSidebarFilters[K],
  ) => void;
  returnFocusRef?: RefObject<HTMLElement | null>;
};

type ChipProps = {
  label: string;
  pressed: boolean;
  onClick: () => void;
};

function Chip({ label, pressed, onClick }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`h-9 rounded-full border px-3 text-[13px] ${VIDEO_IMMERSIVE_FOCUS} ${
        pressed
          ? "border-yunicity-primary bg-[#EEF0FF] font-bold text-yunicity-primary"
          : "border-neutral-300 bg-white font-semibold text-neutral-900"
      }`}
    >
      {label}
    </button>
  );
}

/**
 * Feuille Filtres mobile (cadrage v25, F2) : cinq filtres dont Lieu, application en direct.
 *
 * P0-C : le scroll appartient à `data-videos-filters-scroll` ; le pied
 * Réinitialiser / Voir N est `shrink-0` HORS de cette zone. Sticky dans le
 * scroll OverlayPanel restait fragile sur Safari iOS (dernières options
 * Popularité masquées).
 */
export function VideosMobileFiltersSheet({
  open,
  viewLabel,
  filters,
  neighborhoods,
  items,
  resultCount,
  loadedCount,
  onClose,
  onReset,
  onChange,
  returnFocusRef,
}: VideosMobileFiltersSheetProps) {
  const categories = listVideoPortalCategoryOptions();

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={`${VIDEOS_SIDEBAR_FILTERS_TITLE} · vue ${viewLabel}`}
      closeLabel={VIDEOS_MOBILE_FILTERS_CLOSE}
      zIndex={Z_INDEX.VIDEO_COMMENTS}
      returnFocusRef={returnFocusRef}
      className="max-h-[85dvh] rounded-t-[20px] bg-white"
      contentClassName="!flex !min-h-0 !flex-1 !flex-col !overflow-hidden !p-0"
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div
          data-videos-filters-scroll=""
          className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 pb-4 pt-4"
        >
          <fieldset className="space-y-2">
            <legend className="text-[14px] font-bold text-neutral-900">{VIDEOS_FILTER_CATEGORY}</legend>
            <div className="flex flex-wrap gap-2">
              {categories.map((option) => (
                <Chip
                  key={String(option.value)}
                  label={option.value === "all" ? VIDEOS_FILTER_ALL : option.label}
                  pressed={filters.category === option.value}
                  onClick={() => onChange("category", option.value)}
                />
              ))}
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-[14px] font-bold text-neutral-900">{VIDEOS_FILTER_LOCATION}</legend>
            <p className="text-[12px] text-neutral-500">{VIDEOS_MOBILE_FILTERS_LOCATION_HINT}</p>
            <div className="flex flex-wrap gap-2">
              <Chip
                label={VIDEOS_FILTER_ALL_LOCATIONS}
                pressed={filters.location === "all"}
                onClick={() => onChange("location", "all")}
              />
              {neighborhoods.map((slug) => (
                <Chip
                  key={slug}
                  label={resolveVideoPortalNeighborhoodLabel(slug, items)}
                  pressed={filters.location === slug}
                  onClick={() => onChange("location", slug)}
                />
              ))}
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-[14px] font-bold text-neutral-900">{VIDEOS_FILTER_DURATION}</legend>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["all", VIDEOS_FILTER_ALL_DURATIONS],
                  ["short", VIDEOS_DURATION_SHORT],
                  ["medium", VIDEOS_DURATION_MEDIUM],
                  ["long", VIDEOS_DURATION_LONG],
                ] as const
              ).map(([value, label]) => (
                <Chip
                  key={value}
                  label={label}
                  pressed={filters.duration === value}
                  onClick={() => onChange("duration", value)}
                />
              ))}
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-[14px] font-bold text-neutral-900">{VIDEOS_FILTER_DATE}</legend>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["all", VIDEOS_FILTER_ALL_PERIODS],
                  ["today", VIDEOS_DATE_TODAY],
                  ["week", VIDEOS_DATE_WEEK],
                  ["month", VIDEOS_DATE_MONTH],
                ] as const
              ).map(([value, label]) => (
                <Chip
                  key={value}
                  label={label}
                  pressed={filters.date === value}
                  onClick={() => onChange("date", value)}
                />
              ))}
            </div>
          </fieldset>

          <fieldset className="space-y-2" data-videos-filters-popularity="">
            <legend className="text-[14px] font-bold text-neutral-900">{VIDEOS_FILTER_POPULARITY}</legend>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["all", VIDEOS_FILTER_ALL_POPULARITY],
                  ["liked", "Les plus aimées"],
                  ["commented", "Les plus commentées"],
                ] as const
              ).map(([value, label]) => (
                <Chip
                  key={value}
                  label={label}
                  pressed={filters.popularity === value}
                  onClick={() => onChange("popularity", value)}
                />
              ))}
            </div>
          </fieldset>
        </div>

        <div
          data-videos-filters-footer=""
          className="shrink-0 border-t border-neutral-200 bg-white px-4 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2.5"
        >
          <p role="status" className="text-[13px] text-neutral-700">
            <strong>
              {resultCount} vidéo{resultCount > 1 ? "s" : ""}
            </strong>
            {` parmi les ${loadedCount} chargée${loadedCount > 1 ? "s" : ""}. D'autres peuvent correspondre dans les vidéos suivantes.`}
          </p>
          <p className="sr-only">{formatVideosMobileFiltersStatus(resultCount, loadedCount)}</p>

          <div className="mt-2.5 flex gap-2">
            <button
              type="button"
              onClick={onReset}
              className={`h-12 shrink-0 rounded-full border border-neutral-300 bg-white px-4 text-[15px] font-semibold text-neutral-900 ${VIDEO_IMMERSIVE_FOCUS}`}
            >
              {VIDEOS_MOBILE_FILTERS_RESET}
            </button>
            <button
              type="button"
              onClick={onClose}
              className={`h-12 min-w-0 flex-1 rounded-full bg-yunicity-primary text-[15px] font-bold text-white ${VIDEO_IMMERSIVE_FOCUS}`}
            >
              {formatVideosMobileFiltersSee(resultCount)}
            </button>
          </div>
        </div>
      </div>
    </Drawer>
  );
}

export { VIDEOS_MOBILE_FILTERS_OPEN } from "@yunicity/utils";
