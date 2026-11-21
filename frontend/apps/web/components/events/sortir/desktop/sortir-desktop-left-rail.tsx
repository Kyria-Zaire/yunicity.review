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
  SORTIR_DESKTOP_PAGE_TITLE,
  SORTIR_DESKTOP_WHEN_PICK,
  SORTIR_DESKTOP_WHEN_TITLE,
  SORTIR_DESKTOP_WHEN_TODAY,
  SORTIR_DESKTOP_WHEN_TOMORROW,
  SORTIR_DESKTOP_WHEN_WEEKEND,
} from "@yunicity/utils";
import {
  Accessibility,
  Baby,
  CalendarCheck,
  CalendarDays,
  CalendarRange,
  ChevronDown,
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

type SortirDesktopLeftRailProps = {
  city: string;
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
  onToggleChange: (key: keyof SortirDesktopLeftRailProps["toggles"], value: boolean) => void;
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
  key: keyof SortirDesktopLeftRailProps["toggles"];
  label: string;
  icon: LucideIcon;
}> = [
  { key: "free", label: SORTIR_DESKTOP_FILTER_FREE, icon: Gift },
  { key: "nearby", label: SORTIR_DESKTOP_FILTER_NEARBY, icon: MapPin },
  { key: "accessible", label: SORTIR_DESKTOP_FILTER_ACCESSIBLE, icon: Accessibility },
  { key: "indoor", label: SORTIR_DESKTOP_FILTER_INDOOR, icon: Home },
];

function RailSectionTitle({ children }: { children: string }) {
  return <p className="text-sm font-bold text-neutral-900">{children}</p>;
}

function WhenNavButton({
  active,
  label,
  icon: Icon,
  onClick,
  disabled = false,
}: {
  active: boolean;
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium transition ${
        active
          ? "bg-[#EEF0FF] text-yunicity-primary"
          : "text-neutral-800 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
      }`}
    >
      <Icon className={`h-4 w-4 shrink-0 ${active ? "text-yunicity-primary" : "text-neutral-500"}`} aria-hidden />
      {label}
    </button>
  );
}

function CategoryNavButton({
  active,
  label,
  icon: Icon,
  iconTone,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: LucideIcon;
  iconTone: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium transition ${
        active ? "bg-[#EEF0FF] text-yunicity-primary" : "text-neutral-900 hover:bg-neutral-50"
      }`}
    >
      <Icon
        className={`h-[18px] w-[18px] shrink-0 ${active ? "text-yunicity-primary" : iconTone}`}
        aria-hidden
      />
      {label}
    </button>
  );
}

function FilterToggleRow({
  label,
  icon: Icon,
  checked,
  toggleKey,
  onChange,
}: {
  label: string;
  icon: LucideIcon;
  checked: boolean;
  toggleKey: keyof SortirDesktopLeftRailProps["toggles"];
  onChange: (value: boolean) => void;
}) {
  return (
    <li>
      <div className="flex items-center justify-between gap-3 py-1.5">
        <span className="inline-flex min-w-0 items-center gap-2.5 text-sm font-medium text-neutral-900">
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-neutral-200/90 bg-white text-neutral-700">
            <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          </span>
          <span className="truncate">{label}</span>
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-label={label}
          data-sortir-toggle={toggleKey}
          onClick={() => onChange(!checked)}
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
}

export function SortirDesktopLeftRail({
  city,
  activeWhen,
  activeCategory,
  toggles,
  onWhenChange,
  onCategoryChange,
  onToggleChange,
}: SortirDesktopLeftRailProps) {
  return (
    <aside className="sortir-desktop-left-rail" aria-label="Filtres Sortir" data-sortir-desktop-left-rail="">
      <div className="feed-desktop-surface p-4">
        <h2 className="text-base font-bold text-neutral-900">{SORTIR_DESKTOP_PAGE_TITLE}</h2>

        <div className="mt-3">
          <label className="sr-only" htmlFor="sortir-desktop-city">
            Ville
          </label>
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-yunicity-primary" aria-hidden />
            <select
              id="sortir-desktop-city"
              value={city}
              disabled
              className="h-11 w-full appearance-none rounded-xl border border-neutral-200 bg-white pl-9 pr-9 text-sm font-medium text-neutral-800"
            >
              <option value={city}>{city}</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" aria-hidden />
          </div>
        </div>

        <div className="my-4 border-t border-neutral-100" />

        <RailSectionTitle>{SORTIR_DESKTOP_WHEN_TITLE}</RailSectionTitle>
        <nav className="mt-2 space-y-0.5" aria-label={SORTIR_DESKTOP_WHEN_TITLE}>
          {WHEN_OPTIONS.map((option) => (
            <WhenNavButton
              key={option.id}
              active={activeWhen === option.id}
              label={option.label}
              icon={option.icon}
              disabled={option.id === "pick_date"}
              onClick={() => onWhenChange(option.id)}
            />
          ))}
        </nav>

        <div className="my-4 border-t border-neutral-100" />

        <RailSectionTitle>{SORTIR_DESKTOP_CATEGORIES_TITLE}</RailSectionTitle>
        <nav className="mt-2 space-y-0.5" aria-label={SORTIR_DESKTOP_CATEGORIES_TITLE}>
          {CATEGORY_OPTIONS.map((option) => (
            <CategoryNavButton
              key={option.id || "all"}
              active={activeCategory === option.id}
              label={option.label}
              icon={option.icon}
              iconTone={option.iconTone}
              onClick={() => onCategoryChange(option.id)}
            />
          ))}
        </nav>

        <div className="my-4 border-t border-neutral-100" />

        <RailSectionTitle>{SORTIR_DESKTOP_FILTERS_TITLE}</RailSectionTitle>
        <ul className="mt-2 space-y-1">
          {TOGGLE_OPTIONS.map((option) => (
            <FilterToggleRow
              key={option.key}
              label={option.label}
              icon={option.icon}
              checked={toggles[option.key]}
              toggleKey={option.key}
              onChange={(value) => onToggleChange(option.key, value)}
            />
          ))}
        </ul>

        <button
          type="button"
          disabled
          title="Bientôt disponible"
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-yunicity-primary bg-white px-3 py-2.5 text-sm font-semibold text-yunicity-primary"
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden />
          {SORTIR_DESKTOP_MORE_FILTERS}
        </button>
      </div>
    </aside>
  );
}
