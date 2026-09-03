"use client";

import type { PlacesCategoryFilterId, PlacesDesktopNavId } from "@yunicity/utils";
import {
  PLACES_DESKTOP_ACCESSIBILITY_PMR,
  PLACES_DESKTOP_ACCESSIBILITY_TITLE,
  PLACES_DESKTOP_CATEGORIES_TITLE,
  PLACES_DESKTOP_CATEGORY_CULTURE,
  PLACES_DESKTOP_CATEGORY_FOOD,
  PLACES_DESKTOP_CATEGORY_NATURE,
  PLACES_DESKTOP_CATEGORY_SERVICES,
  PLACES_DESKTOP_CATEGORY_SHOPPING,
  PLACES_DESKTOP_CATEGORY_SPORT,
  PLACES_DESKTOP_LEFT_TITLE,
  PLACES_DESKTOP_NAV_ALL,
  PLACES_DESKTOP_NAV_NEARBY,
  PLACES_DESKTOP_NAV_SAVED,
  PLACES_DESKTOP_NAV_SAVED_SOON,
  PLACES_DESKTOP_NAV_VISITED,
  PLACES_DESKTOP_NAV_VISITED_SOON,
  PLACES_DESKTOP_RESET_FILTERS,
} from "@yunicity/utils";
import {
  Bookmark,
  Briefcase,
  Building2,
  CheckCircle2,
  ChevronDown,
  Compass,
  Dumbbell,
  Filter,
  Home,
  Leaf,
  MapPin,
  ShoppingBag,
  UtensilsCrossed,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type PlacesDesktopLeftRailProps = {
  city: string;
  activeNav: PlacesDesktopNavId;
  activeCategory: PlacesCategoryFilterId;
  accessiblePmr: boolean;
  onNavChange: (navId: PlacesDesktopNavId) => void;
  onCategoryChange: (categoryId: PlacesCategoryFilterId) => void;
  onAccessibleChange: (value: boolean) => void;
  onResetFilters: () => void;
};

const NAV_OPTIONS: Array<{ id: PlacesDesktopNavId; label: string; icon: LucideIcon; soon?: string }> = [
  { id: "all", label: PLACES_DESKTOP_NAV_ALL, icon: Home },
  { id: "nearby", label: PLACES_DESKTOP_NAV_NEARBY, icon: Compass },
  { id: "saved", label: PLACES_DESKTOP_NAV_SAVED, icon: Bookmark, soon: PLACES_DESKTOP_NAV_SAVED_SOON },
  { id: "visited", label: PLACES_DESKTOP_NAV_VISITED, icon: CheckCircle2, soon: PLACES_DESKTOP_NAV_VISITED_SOON },
];

const CATEGORY_OPTIONS: Array<{
  id: PlacesCategoryFilterId;
  label: string;
  icon: LucideIcon;
  iconTone: string;
}> = [
  { id: "culture", label: PLACES_DESKTOP_CATEGORY_CULTURE, icon: Building2, iconTone: "text-violet-600" },
  { id: "nature", label: PLACES_DESKTOP_CATEGORY_NATURE, icon: Leaf, iconTone: "text-emerald-600" },
  { id: "gastronomy", label: PLACES_DESKTOP_CATEGORY_FOOD, icon: UtensilsCrossed, iconTone: "text-orange-500" },
  { id: "market", label: PLACES_DESKTOP_CATEGORY_SHOPPING, icon: ShoppingBag, iconTone: "text-sky-600" },
  { id: "sport", label: PLACES_DESKTOP_CATEGORY_SPORT, icon: Dumbbell, iconTone: "text-teal-600" },
  { id: "leisure", label: PLACES_DESKTOP_CATEGORY_SERVICES, icon: Briefcase, iconTone: "text-neutral-700" },
];

function RailSectionTitle({ children }: { children: string }) {
  return <p className="text-sm font-bold text-neutral-900">{children}</p>;
}

function NavButton({
  active,
  label,
  icon: Icon,
  soon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: LucideIcon;
  soon?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={soon}
      aria-pressed={active}
      className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium transition ${
        active
          ? "bg-[#EEF0FF] text-yunicity-primary"
          : "text-neutral-800 hover:bg-neutral-50"
      }`}
    >
      <Icon className={`h-4 w-4 shrink-0 ${active ? "text-yunicity-primary" : "text-neutral-500"}`} aria-hidden />
      {label}
    </button>
  );
}

function CategoryButton({
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

export function PlacesDesktopLeftRail({
  city,
  activeNav,
  activeCategory,
  accessiblePmr,
  onNavChange,
  onCategoryChange,
  onAccessibleChange,
  onResetFilters,
}: PlacesDesktopLeftRailProps) {
  return (
    <aside className="places-desktop-left-rail" aria-label="Navigation Lieux" data-places-desktop-left-rail="">
      <div className="feed-desktop-surface p-4">
        <h2 className="text-base font-bold text-neutral-900">{PLACES_DESKTOP_LEFT_TITLE}</h2>

        <div className="mt-3">
          <label className="sr-only" htmlFor="places-desktop-city">
            Ville
          </label>
          <div className="relative">
            <MapPin
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-yunicity-primary"
              aria-hidden
            />
            <select
              id="places-desktop-city"
              value={city}
              disabled
              className="h-11 w-full appearance-none rounded-xl border border-neutral-200 bg-white pl-9 pr-9 text-sm font-medium text-neutral-800"
            >
              <option value={city}>{city}</option>
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
              aria-hidden
            />
          </div>
        </div>

        <nav className="mt-4 space-y-0.5" aria-label="Vues Lieux">
          {NAV_OPTIONS.map((option) => (
            <NavButton
              key={option.id}
              active={activeNav === option.id}
              label={option.label}
              icon={option.icon}
              soon={option.soon}
              onClick={() => onNavChange(option.id)}
            />
          ))}
        </nav>

        <div className="my-4 border-t border-neutral-100" />

        <RailSectionTitle>{PLACES_DESKTOP_CATEGORIES_TITLE}</RailSectionTitle>
        <nav className="mt-2 space-y-0.5" aria-label={PLACES_DESKTOP_CATEGORIES_TITLE}>
          {CATEGORY_OPTIONS.map((option) => (
            <CategoryButton
              key={option.id}
              active={activeCategory === option.id}
              label={option.label}
              icon={option.icon}
              iconTone={option.iconTone}
              onClick={() => onCategoryChange(option.id)}
            />
          ))}
        </nav>

        <div className="my-4 border-t border-neutral-100" />

        <RailSectionTitle>{PLACES_DESKTOP_ACCESSIBILITY_TITLE}</RailSectionTitle>
        <label className="mt-2 flex cursor-pointer items-center gap-2.5 rounded-xl px-1 py-1.5 text-sm font-medium text-neutral-900">
          <input
            type="checkbox"
            checked={accessiblePmr}
            onChange={(event) => onAccessibleChange(event.target.checked)}
            className="h-4 w-4 rounded border-neutral-300 text-yunicity-primary focus:ring-yunicity-primary/30"
          />
          {PLACES_DESKTOP_ACCESSIBILITY_PMR}
        </label>

        <button
          type="button"
          onClick={onResetFilters}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-yunicity-primary/30 px-3 py-2.5 text-sm font-semibold text-yunicity-primary transition hover:border-yunicity-primary hover:bg-[#EEF0FF]"
        >
          <Filter className="h-4 w-4" aria-hidden />
          {PLACES_DESKTOP_RESET_FILTERS}
        </button>
      </div>
    </aside>
  );
}
