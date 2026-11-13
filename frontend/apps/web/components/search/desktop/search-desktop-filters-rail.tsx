"use client";

import type { Neighborhood } from "@yunicity/types";
import type { SearchDesktopContentTypeId, SearchDesktopPeriodPreset } from "@yunicity/utils";
import {
  SEARCH_DESKTOP_APPLY_FILTERS,
  SEARCH_DESKTOP_CONTENT_TYPES,
  SEARCH_DESKTOP_FILTER_CITY,
  SEARCH_DESKTOP_FILTER_CONTENT_TYPES,
  SEARCH_DESKTOP_FILTER_NEIGHBORHOOD,
  SEARCH_DESKTOP_FILTER_NEIGHBORHOOD_ALL,
  SEARCH_DESKTOP_FILTER_PERIOD,
  SEARCH_DESKTOP_FILTERS_TITLE,
  SEARCH_DESKTOP_PERIOD_PRESETS,
  SEARCH_DESKTOP_RECENT_CLEAR,
  SEARCH_DESKTOP_RECENT_EMPTY,
  SEARCH_DESKTOP_RECENT_REMOVE_ARIA,
  SEARCH_DESKTOP_RECENT_SUBTITLE,
  SEARCH_DESKTOP_RECENT_TITLE,
  SEARCH_DESKTOP_RESET_FILTERS,
} from "@yunicity/utils";
import {
  Briefcase,
  Building2,
  CalendarDays,
  ChevronDown,
  MapPin,
  MessageSquare,
  Search,
  User,
  Users,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type SearchDesktopFiltersRailProps = {
  city: string;
  cities: string[];
  neighborhoods: Neighborhood[];
  draftCity: string;
  draftNeighborhoodSlug: string;
  draftPeriod: SearchDesktopPeriodPreset;
  draftContentTypes: SearchDesktopContentTypeId[];
  recentSearches: string[];
  onDraftCityChange: (city: string) => void;
  onDraftNeighborhoodChange: (slug: string) => void;
  onDraftPeriodChange: (preset: SearchDesktopPeriodPreset) => void;
  onDraftContentTypeToggle: (type: SearchDesktopContentTypeId) => void;
  onApply: () => void;
  onReset: () => void;
  onRecentSelect: (query: string) => void;
  onRecentRemove: (query: string) => void;
  onRecentClear: () => void;
  compact?: boolean;
};

const CONTENT_TYPE_ICON: Record<
  SearchDesktopContentTypeId,
  { icon: LucideIcon; tone: string }
> = {
  event: { icon: CalendarDays, tone: "text-emerald-600" },
  post: { icon: MessageSquare, tone: "text-sky-600" },
  organization: { icon: Building2, tone: "text-orange-600" },
  offer: { icon: Briefcase, tone: "text-amber-600" },
  tribe: { icon: Users, tone: "text-violet-600" },
  user: { icon: User, tone: "text-cyan-600" },
  neighborhood: { icon: MapPin, tone: "text-pink-600" },
};

export function SearchDesktopFiltersRail({
  city,
  cities,
  neighborhoods,
  draftCity,
  draftNeighborhoodSlug,
  draftPeriod,
  draftContentTypes,
  recentSearches,
  onDraftCityChange,
  onDraftNeighborhoodChange,
  onDraftPeriodChange,
  onDraftContentTypeToggle,
  onApply,
  onReset,
  onRecentSelect,
  onRecentRemove,
  onRecentClear,
  compact = false,
}: SearchDesktopFiltersRailProps) {
  const cityOptions = cities.length > 0 ? cities : [city];

  return (
    <aside className="space-y-4" data-search-desktop-filters="">
      <section className={`rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm ${compact ? "border-0 p-0 shadow-none" : ""}`}>
        {compact ? null : (
          <h2 className="text-sm font-bold text-neutral-950">{SEARCH_DESKTOP_FILTERS_TITLE}</h2>
        )}

        <div className={compact ? "space-y-4" : "mt-4 space-y-4"}>
          <FilterSelect
            label={SEARCH_DESKTOP_FILTER_CITY}
            value={draftCity}
            onChange={onDraftCityChange}
            options={cityOptions.map((option) => ({ value: option, label: option }))}
          />

          <FilterSelect
            label={SEARCH_DESKTOP_FILTER_NEIGHBORHOOD}
            value={draftNeighborhoodSlug}
            onChange={onDraftNeighborhoodChange}
            options={[
              { value: "", label: SEARCH_DESKTOP_FILTER_NEIGHBORHOOD_ALL },
              ...neighborhoods.map((hood) => ({
                value: hood.slug,
                label: hood.display_name,
              })),
            ]}
          />

          <div className="space-y-2">
            <FilterSelect
              label={SEARCH_DESKTOP_FILTER_PERIOD}
              value={draftPeriod}
              onChange={(value) => onDraftPeriodChange(value as SearchDesktopPeriodPreset)}
              options={SEARCH_DESKTOP_PERIOD_PRESETS.map((preset) => ({
                value: preset.id,
                label: preset.label,
              }))}
            />
            <div className="flex flex-wrap gap-2">
              {SEARCH_DESKTOP_PERIOD_PRESETS.filter((preset) => preset.id !== "all").map((preset) => {
                const active = draftPeriod === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => onDraftPeriodChange(preset.id)}
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                      active
                        ? "border-yunicity-primary bg-[#EEF0FF] text-yunicity-primary"
                        : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300"
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-xs font-semibold text-neutral-700">
              {SEARCH_DESKTOP_FILTER_CONTENT_TYPES}
            </legend>
            <ul className="space-y-2">
              {SEARCH_DESKTOP_CONTENT_TYPES.map((item) => {
                const checked = draftContentTypes.includes(item.id);
                const meta = CONTENT_TYPE_ICON[item.id];
                const Icon = meta.icon;
                return (
                  <li key={item.id}>
                    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-neutral-800">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => onDraftContentTypeToggle(item.id)}
                        className="h-4 w-4 rounded border-neutral-300 text-yunicity-primary focus:ring-yunicity-primary/30"
                      />
                      <Icon className={`h-4 w-4 shrink-0 ${meta.tone}`} aria-hidden />
                      {item.label}
                    </label>
                  </li>
                );
              })}
            </ul>
          </fieldset>
        </div>

        <button
          type="button"
          onClick={onApply}
          className="mt-5 inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-yunicity-primary bg-white text-sm font-semibold text-yunicity-primary transition hover:bg-[#EEF0FF] active:scale-[0.98]"
        >
          {SEARCH_DESKTOP_APPLY_FILTERS}
        </button>
        <button
          type="button"
          onClick={onReset}
          className="mt-3 w-full text-center text-sm font-semibold text-yunicity-primary transition hover:underline"
        >
          {SEARCH_DESKTOP_RESET_FILTERS}
        </button>
      </section>

      <section className={`rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm ${compact ? "border-0 p-0 shadow-none" : ""}`}>
        <h2 className="text-sm font-bold text-neutral-950">{SEARCH_DESKTOP_RECENT_TITLE}</h2>
        <p className="mt-1 text-xs leading-relaxed text-neutral-500">{SEARCH_DESKTOP_RECENT_SUBTITLE}</p>
        {recentSearches.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-500">{SEARCH_DESKTOP_RECENT_EMPTY}</p>
        ) : (
          <ul className="mt-3 flex flex-wrap gap-2">
            {recentSearches.map((item) => (
              <li key={item}>
                <span className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-neutral-50 pl-2.5 pr-1 py-1 text-xs font-medium text-neutral-700">
                  <button
                    type="button"
                    onClick={() => onRecentSelect(item)}
                    className="inline-flex items-center gap-1 transition hover:text-yunicity-primary"
                  >
                    <Search className="h-3 w-3" aria-hidden />
                    {item}
                  </button>
                  <button
                    type="button"
                    onClick={() => onRecentRemove(item)}
                    aria-label={SEARCH_DESKTOP_RECENT_REMOVE_ARIA(item)}
                    className="inline-flex h-5 w-5 items-center justify-center rounded-full text-neutral-400 transition hover:bg-neutral-200 hover:text-neutral-700"
                  >
                    <X className="h-3 w-3" aria-hidden />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
        {recentSearches.length > 0 ? (
          <button
            type="button"
            onClick={onRecentClear}
            className="mt-3 text-xs font-semibold text-yunicity-primary transition hover:underline"
          >
            {SEARCH_DESKTOP_RECENT_CLEAR}
          </button>
        ) : null}
      </section>
    </aside>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold text-neutral-700">{label}</span>
      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full appearance-none rounded-xl border border-neutral-200 bg-white px-3 py-2.5 pr-9 text-sm text-neutral-900 outline-none transition focus:border-yunicity-primary/40 focus:ring-2 focus:ring-yunicity-primary/15"
        >
          {options.map((option) => (
            <option key={`${label}-${option.value}`} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
          aria-hidden
        />
      </div>
    </label>
  );
}
