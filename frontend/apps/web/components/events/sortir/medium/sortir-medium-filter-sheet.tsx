"use client";

import type { SortirDesktopCategoryId, SortirDesktopWhenId } from "@yunicity/utils";
import {
  SORTIR_DESKTOP_CATEGORIES_TITLE,
  SORTIR_DESKTOP_CATEGORY_ALL,
  SORTIR_DESKTOP_CATEGORY_CULTURE,
  SORTIR_DESKTOP_CATEGORY_FAMILY,
  SORTIR_DESKTOP_CATEGORY_FOOD,
  SORTIR_DESKTOP_CATEGORY_LOCAL,
  SORTIR_DESKTOP_CATEGORY_MUSIC,
  SORTIR_DESKTOP_CATEGORY_SPORT,
  SORTIR_DESKTOP_FILTERS_TITLE,
  SORTIR_DESKTOP_FILTER_ACCESSIBLE,
  SORTIR_DESKTOP_FILTER_FREE,
  SORTIR_DESKTOP_FILTER_INDOOR,
  SORTIR_DESKTOP_FILTER_NEARBY,
  SORTIR_DESKTOP_MORE_FILTERS,
  SORTIR_DESKTOP_WHEN_PICK,
  SORTIR_DESKTOP_WHEN_TITLE,
  SORTIR_DESKTOP_WHEN_TODAY,
  SORTIR_DESKTOP_WHEN_TOMORROW,
  SORTIR_DESKTOP_WHEN_WEEKEND,
} from "@yunicity/utils";
import { Sheet } from "@yunicity/ui/primitives";
import {
  Accessibility,
  Baby,
  CalendarCheck,
  CalendarDays,
  CalendarRange,
  Dumbbell,
  Gift,
  Home,
  Landmark,
  LayoutGrid,
  MapPin,
  Music2,
  SlidersHorizontal,
  UtensilsCrossed,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { RefObject } from "react";

import { NAVIGATION_MODAL_Z_INDEX } from "@/lib/layout/navigation-overlay-layers";

type SortirMediumFilterSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeWhen: SortirDesktopWhenId;
  activeCategory: SortirDesktopCategoryId;
  toggles: {
    free: boolean;
    nearby: boolean;
    accessible: boolean;
    indoor: boolean;
  };
  onWhenChange: (whenId: SortirDesktopWhenId) => void;
  onCategoryChange: (categoryId: SortirDesktopCategoryId) => void;
  onToggleChange: (key: keyof SortirMediumFilterSheetProps["toggles"], value: boolean) => void;
  returnFocusRef: RefObject<HTMLElement>;
  initialSection?: "when" | "filters";
};

const WHEN_OPTIONS: Array<{ id: SortirDesktopWhenId; label: string; icon: LucideIcon }> = [
  { id: "today", label: SORTIR_DESKTOP_WHEN_TODAY, icon: CalendarCheck },
  { id: "tomorrow", label: SORTIR_DESKTOP_WHEN_TOMORROW, icon: CalendarDays },
  { id: "weekend", label: SORTIR_DESKTOP_WHEN_WEEKEND, icon: CalendarRange },
  { id: "pick_date", label: SORTIR_DESKTOP_WHEN_PICK, icon: CalendarDays },
];

const CATEGORY_OPTIONS: Array<{
  id: SortirDesktopCategoryId;
  label: string;
  icon: LucideIcon;
  iconTone: string;
}> = [
  { id: "", label: SORTIR_DESKTOP_CATEGORY_ALL, icon: LayoutGrid, iconTone: "text-yunicity-primary" },
  { id: "culture", label: SORTIR_DESKTOP_CATEGORY_CULTURE, icon: Landmark, iconTone: "text-violet-600" },
  { id: "music", label: SORTIR_DESKTOP_CATEGORY_MUSIC, icon: Music2, iconTone: "text-pink-500" },
  { id: "food", label: SORTIR_DESKTOP_CATEGORY_FOOD, icon: UtensilsCrossed, iconTone: "text-orange-500" },
  { id: "sport", label: SORTIR_DESKTOP_CATEGORY_SPORT, icon: Dumbbell, iconTone: "text-emerald-600" },
  { id: "family", label: SORTIR_DESKTOP_CATEGORY_FAMILY, icon: Baby, iconTone: "text-amber-500" },
  { id: "local", label: SORTIR_DESKTOP_CATEGORY_LOCAL, icon: MapPin, iconTone: "text-teal-600" },
];

const TOGGLE_OPTIONS: Array<{
  key: keyof SortirMediumFilterSheetProps["toggles"];
  label: string;
  icon: LucideIcon;
}> = [
  { key: "free", label: SORTIR_DESKTOP_FILTER_FREE, icon: Gift },
  { key: "nearby", label: SORTIR_DESKTOP_FILTER_NEARBY, icon: MapPin },
  { key: "accessible", label: SORTIR_DESKTOP_FILTER_ACCESSIBLE, icon: Accessibility },
  { key: "indoor", label: SORTIR_DESKTOP_FILTER_INDOOR, icon: Home },
];

export function SortirMediumFilterSheet({
  open,
  onOpenChange,
  activeWhen,
  activeCategory,
  toggles,
  onWhenChange,
  onCategoryChange,
  onToggleChange,
  returnFocusRef,
}: SortirMediumFilterSheetProps) {
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      side="right"
      title={SORTIR_DESKTOP_FILTERS_TITLE}
      closeLabel="Fermer"
      returnFocusRef={returnFocusRef}
      zIndex={NAVIGATION_MODAL_Z_INDEX}
      className="sortir-medium-filter-sheet max-w-md"
    >
      <div className="space-y-6 px-1 pb-6" data-sortir-medium-filter-sheet="">
        <section aria-labelledby="sortir-medium-when-title">
          <h3 id="sortir-medium-when-title" className="text-sm font-bold text-neutral-900">
            {SORTIR_DESKTOP_WHEN_TITLE}
          </h3>
          <nav className="mt-2 space-y-0.5" aria-label={SORTIR_DESKTOP_WHEN_TITLE}>
            {WHEN_OPTIONS.map((option) => {
              const Icon = option.icon;
              const active = activeWhen === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  disabled={option.id === "pick_date"}
                  aria-pressed={active}
                  onClick={() => onWhenChange(option.id)}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium transition ${
                    active
                      ? "bg-[#EEF0FF] text-yunicity-primary"
                      : "text-neutral-800 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${active ? "text-yunicity-primary" : "text-neutral-500"}`} aria-hidden />
                  {option.label}
                </button>
              );
            })}
          </nav>
        </section>

        <section aria-labelledby="sortir-medium-categories-title">
          <h3 id="sortir-medium-categories-title" className="text-sm font-bold text-neutral-900">
            {SORTIR_DESKTOP_CATEGORIES_TITLE}
          </h3>
          <nav className="mt-2 space-y-0.5" aria-label={SORTIR_DESKTOP_CATEGORIES_TITLE}>
            {CATEGORY_OPTIONS.map((option) => {
              const Icon = option.icon;
              const active = activeCategory === option.id;
              return (
                <button
                  key={option.id || "all"}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onCategoryChange(option.id)}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium transition ${
                    active ? "bg-[#EEF0FF] text-yunicity-primary" : "text-neutral-900 hover:bg-neutral-50"
                  }`}
                >
                  <Icon
                    className={`h-[18px] w-[18px] shrink-0 ${active ? "text-yunicity-primary" : option.iconTone}`}
                    aria-hidden
                  />
                  {option.label}
                </button>
              );
            })}
          </nav>
        </section>

        <section aria-labelledby="sortir-medium-filters-title">
          <h3 id="sortir-medium-filters-title" className="text-sm font-bold text-neutral-900">
            {SORTIR_DESKTOP_FILTERS_TITLE}
          </h3>
          <ul className="mt-2 space-y-1">
            {TOGGLE_OPTIONS.map((option) => {
              const Icon = option.icon;
              const checked = toggles[option.key];
              return (
                <li key={option.key}>
                  <div className="flex items-center justify-between gap-3 py-1.5">
                    <span className="inline-flex min-w-0 items-center gap-2.5 text-sm font-medium text-neutral-900">
                      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-neutral-200/90 bg-white text-neutral-700">
                        <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                      </span>
                      <span className="truncate">{option.label}</span>
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={checked}
                      aria-label={option.label}
                      data-sortir-toggle={option.key}
                      onClick={() => onToggleChange(option.key, !checked)}
                      className={`relative h-5 w-9 shrink-0 rounded-full transition ${
                        checked ? "bg-yunicity-primary" : "bg-neutral-300"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition ${
                          checked ? "left-[18px]" : "left-0.5"
                        }`}
                      />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <button
          type="button"
          disabled
          title="Bientôt disponible"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-yunicity-primary bg-white px-3 py-2.5 text-sm font-semibold text-yunicity-primary"
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden />
          {SORTIR_DESKTOP_MORE_FILTERS}
        </button>
      </div>
    </Sheet>
  );
}
