"use client";

import type { LocalVideoFeedItem } from "@yunicity/types";
import type { VideosPortalSidebarFilters } from "@yunicity/utils";
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
  VIDEOS_PORTAL_PUBLISH_CTA,
  VIDEOS_PORTAL_SUBTITLE,
  VIDEOS_PORTAL_TITLE,
  VIDEOS_SIDEBAR_FILTERS_TITLE,
  VIDEOS_SIDEBAR_RESET,
  isVideosPortalSidebarDefault,
  listVideoPortalCategoryOptions,
  resolveVideoPortalNeighborhoodLabel,
} from "@yunicity/utils";
import {
  CalendarDays,
  ChevronDown,
  Clock3,
  Home,
  MapPin,
  Sparkles,
  Video,
} from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";

type VideosInternalSidebarProps = {
  filters: VideosPortalSidebarFilters;
  neighborhoods: string[];
  items: readonly LocalVideoFeedItem[];
  onReset: () => void;
  onChange: <K extends keyof VideosPortalSidebarFilters>(
    key: K,
    value: VideosPortalSidebarFilters[K],
  ) => void;
};

type FilterSectionProps = {
  id: string;
  label: string;
  summary: string;
  icon: typeof Home;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
};

function FilterSection({
  id,
  label,
  summary,
  icon: Icon,
  open,
  onToggle,
  children,
}: FilterSectionProps) {
  return (
    <div className="rounded-2xl border border-neutral-200/90 bg-white">
      <button
        type="button"
        id={`${id}-trigger`}
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-neutral-50"
      >
        <Icon className="h-4 w-4 shrink-0 text-yunicity-primary" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-neutral-900">{label}</p>
          <p className="truncate text-xs text-neutral-500">{summary}</p>
        </div>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-neutral-400 transition ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {open ? (
        <div id={`${id}-panel`} className="border-t border-neutral-100 px-3 py-2">
          {children}
        </div>
      ) : null}
    </div>
  );
}

function FilterOption({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`block w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
        active
          ? "bg-yunicity-primary-soft text-yunicity-primary"
          : "text-neutral-700 hover:bg-neutral-50"
      }`}
    >
      {label}
    </button>
  );
}

export function VideosInternalSidebar({
  filters,
  neighborhoods,
  items,
  onReset,
  onChange,
}: VideosInternalSidebarProps) {
  const [openSection, setOpenSection] = useState<string | null>("category");
  const categories = listVideoPortalCategoryOptions();

  const categorySummary =
    categories.find((option) => option.value === filters.category)?.label ?? VIDEOS_FILTER_ALL;
  const locationSummary =
    filters.location === "all"
      ? VIDEOS_FILTER_ALL_LOCATIONS
      : resolveVideoPortalNeighborhoodLabel(filters.location, items);
  const durationSummary =
    filters.duration === "all"
      ? VIDEOS_FILTER_ALL_DURATIONS
      : filters.duration === "short"
        ? VIDEOS_DURATION_SHORT
        : filters.duration === "medium"
          ? VIDEOS_DURATION_MEDIUM
          : VIDEOS_DURATION_LONG;
  const dateSummary =
    filters.date === "all"
      ? VIDEOS_FILTER_ALL_PERIODS
      : filters.date === "today"
        ? VIDEOS_DATE_TODAY
        : filters.date === "week"
          ? VIDEOS_DATE_WEEK
          : VIDEOS_DATE_MONTH;
  const popularitySummary =
    filters.popularity === "all"
      ? VIDEOS_FILTER_ALL_POPULARITY
      : filters.popularity === "liked"
        ? "Les plus aimées"
        : "Les plus commentées";

  return (
    <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
      <div className="hidden space-y-3 lg:block">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">{VIDEOS_PORTAL_TITLE}</h1>
        <p className="text-sm leading-relaxed text-neutral-600">{VIDEOS_PORTAL_SUBTITLE}</p>
        <Link
          href="/videos/new"
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-yunicity-primary px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-yunicity-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary"
        >
          <Video className="h-4 w-4" aria-hidden />
          {VIDEOS_PORTAL_PUBLISH_CTA}
        </Link>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-bold text-neutral-900">{VIDEOS_SIDEBAR_FILTERS_TITLE}</h2>
          {!isVideosPortalSidebarDefault(filters) ? (
            <button
              type="button"
              onClick={onReset}
              className="text-xs font-semibold text-neutral-500 hover:text-yunicity-primary"
            >
              {VIDEOS_SIDEBAR_RESET}
            </button>
          ) : null}
        </div>

        <div className="space-y-2">
          <FilterSection
            id="videos-filter-category"
            label={VIDEOS_FILTER_CATEGORY}
            summary={categorySummary}
            icon={Home}
            open={openSection === "category"}
            onToggle={() => setOpenSection((current) => (current === "category" ? null : "category"))}
          >
            {categories.map((option) => (
              <FilterOption
                key={option.value}
                active={filters.category === option.value}
                label={option.label}
                onClick={() => onChange("category", option.value)}
              />
            ))}
          </FilterSection>

          <FilterSection
            id="videos-filter-location"
            label={VIDEOS_FILTER_LOCATION}
            summary={locationSummary}
            icon={MapPin}
            open={openSection === "location"}
            onToggle={() => setOpenSection((current) => (current === "location" ? null : "location"))}
          >
            <FilterOption
              active={filters.location === "all"}
              label={VIDEOS_FILTER_ALL_LOCATIONS}
              onClick={() => onChange("location", "all")}
            />
            {neighborhoods.map((slug) => (
              <FilterOption
                key={slug}
                active={filters.location === slug}
                label={resolveVideoPortalNeighborhoodLabel(slug, items)}
                onClick={() => onChange("location", slug)}
              />
            ))}
          </FilterSection>

          <FilterSection
            id="videos-filter-duration"
            label={VIDEOS_FILTER_DURATION}
            summary={durationSummary}
            icon={Clock3}
            open={openSection === "duration"}
            onToggle={() => setOpenSection((current) => (current === "duration" ? null : "duration"))}
          >
            <FilterOption
              active={filters.duration === "all"}
              label={VIDEOS_FILTER_ALL_DURATIONS}
              onClick={() => onChange("duration", "all")}
            />
            <FilterOption
              active={filters.duration === "short"}
              label={VIDEOS_DURATION_SHORT}
              onClick={() => onChange("duration", "short")}
            />
            <FilterOption
              active={filters.duration === "medium"}
              label={VIDEOS_DURATION_MEDIUM}
              onClick={() => onChange("duration", "medium")}
            />
            <FilterOption
              active={filters.duration === "long"}
              label={VIDEOS_DURATION_LONG}
              onClick={() => onChange("duration", "long")}
            />
          </FilterSection>

          <FilterSection
            id="videos-filter-date"
            label={VIDEOS_FILTER_DATE}
            summary={dateSummary}
            icon={CalendarDays}
            open={openSection === "date"}
            onToggle={() => setOpenSection((current) => (current === "date" ? null : "date"))}
          >
            <FilterOption
              active={filters.date === "all"}
              label={VIDEOS_FILTER_ALL_PERIODS}
              onClick={() => onChange("date", "all")}
            />
            <FilterOption
              active={filters.date === "today"}
              label={VIDEOS_DATE_TODAY}
              onClick={() => onChange("date", "today")}
            />
            <FilterOption
              active={filters.date === "week"}
              label={VIDEOS_DATE_WEEK}
              onClick={() => onChange("date", "week")}
            />
            <FilterOption
              active={filters.date === "month"}
              label={VIDEOS_DATE_MONTH}
              onClick={() => onChange("date", "month")}
            />
          </FilterSection>

          <FilterSection
            id="videos-filter-popularity"
            label={VIDEOS_FILTER_POPULARITY}
            summary={popularitySummary}
            icon={Sparkles}
            open={openSection === "popularity"}
            onToggle={() =>
              setOpenSection((current) => (current === "popularity" ? null : "popularity"))
            }
          >
            <FilterOption
              active={filters.popularity === "all"}
              label={VIDEOS_FILTER_ALL_POPULARITY}
              onClick={() => onChange("popularity", "all")}
            />
            <FilterOption
              active={filters.popularity === "liked"}
              label="Les plus aimées"
              onClick={() => onChange("popularity", "liked")}
            />
            <FilterOption
              active={filters.popularity === "commented"}
              label="Les plus commentées"
              onClick={() => onChange("popularity", "commented")}
            />
          </FilterSection>
        </div>
      </div>
    </aside>
  );
}
