"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type {
  NeighborhoodsDesktopGridCard,
  NeighborhoodsDesktopHeroCard,
  NeighborhoodsDesktopTag,
  NeighborhoodsMediumChipId,
} from "@yunicity/utils";
import {
  NEIGHBORHOODS_DESKTOP_EXPLORE,
  NEIGHBORHOODS_DESKTOP_EXPLORE_NEIGHBORHOOD,
  NEIGHBORHOODS_DESKTOP_FEATURED_BADGE,
  NEIGHBORHOODS_DESKTOP_FOLLOW,
  NEIGHBORHOODS_DESKTOP_FOLLOWING,
  NEIGHBORHOODS_DESKTOP_GRID_TITLE,
  NEIGHBORHOODS_DESKTOP_KICKER,
  NEIGHBORHOODS_DESKTOP_MODE_EXPLORE,
  NEIGHBORHOODS_DESKTOP_MODE_MAP,
  NEIGHBORHOODS_DESKTOP_TITLE,
  NEIGHBORHOODS_MEDIUM_AMBIANCE_CHIPS,
  NEIGHBORHOODS_MEDIUM_FILTERS,
  NEIGHBORHOODS_MEDIUM_YOUR_HOOD_EMPTY,
  NEIGHBORHOODS_DESKTOP_YOUR_HOOD_TITLE,
  NEIGHBORHOODS_MOBILE_DEFINE,
  NEIGHBORHOODS_MOBILE_SEARCH_PLACEHOLDER,
  NEIGHBORHOODS_MOBILE_SEE_ALL_ARROW,
  NEIGHBORHOODS_MOBILE_SUBTITLE,
  NEIGHBORHOODS_MOBILE_VIEW_ON_MAP,
  NEIGHBORHOODS_MOBILE_YOUR_HOOD_HINT,
} from "@yunicity/utils";
import {
  Bookmark,
  CalendarDays,
  ChevronRight,
  Filter,
  Home,
  Map,
  Search,
} from "lucide-react";
import Link from "next/link";
import type { Ref } from "react";

const TAG_CLASS: Record<NeighborhoodsDesktopTag["tone"], string> = {
  peach: "bg-orange-100 text-orange-800",
  purple: "bg-violet-100 text-violet-800",
  yellow: "bg-amber-100 text-amber-900",
  blue: "bg-sky-100 text-sky-800",
  indigo: "bg-indigo-100 text-indigo-800",
  green: "bg-emerald-100 text-emerald-800",
  slate: "bg-slate-100 text-slate-700",
};

const CHIP_IDLE: Record<string, string> = {
  primary: "border-neutral-200 bg-white text-neutral-700",
  peach: "border-orange-200 bg-orange-50 text-orange-800",
  purple: "border-violet-200 bg-violet-50 text-violet-800",
  yellow: "border-amber-200 bg-amber-50 text-amber-900",
  blue: "border-sky-200 bg-sky-50 text-sky-800",
  green: "border-emerald-200 bg-emerald-50 text-emerald-800",
};

type NeighborhoodsMobilePageHeaderProps = {
  city: string;
  neighborhoodsCount: number;
  query: string;
  onQueryChange: (value: string) => void;
  selectedChip: NeighborhoodsMediumChipId;
  onSelectChip: (id: NeighborhoodsMediumChipId) => void;
  filterCount: number;
  onOpenFilters: () => void;
  mapHref: string;
  searchInputRef?: Ref<HTMLInputElement>;
};

export function NeighborhoodsMobilePageHeader({
  city,
  neighborhoodsCount,
  query,
  onQueryChange,
  selectedChip,
  onSelectChip,
  filterCount,
  onOpenFilters,
  mapHref,
  searchInputRef,
}: NeighborhoodsMobilePageHeaderProps) {
  return (
    <header className="space-y-4" data-neighborhoods-mobile-page-header="">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-yunicity-primary">
          {NEIGHBORHOODS_DESKTOP_KICKER(city, neighborhoodsCount)}
        </p>
        <h1 className="mt-1 text-[1.65rem] font-bold leading-tight tracking-tight text-neutral-950">
          {NEIGHBORHOODS_DESKTOP_TITLE(city)}
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-neutral-500">
          {NEIGHBORHOODS_MOBILE_SUBTITLE}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">{NEIGHBORHOODS_MOBILE_SEARCH_PLACEHOLDER}</span>
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
            aria-hidden
          />
          <input
            ref={searchInputRef}
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={NEIGHBORHOODS_MOBILE_SEARCH_PLACEHOLDER}
            className="w-full rounded-2xl border border-neutral-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-yunicity-primary focus:ring-1 focus:ring-yunicity-primary"
          />
        </label>
        <button
          type="button"
          onClick={onOpenFilters}
          aria-label={NEIGHBORHOODS_MEDIUM_FILTERS}
          className="relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-neutral-200 bg-white text-neutral-700"
        >
          <Filter className="h-4 w-4" aria-hidden />
          {filterCount > 0 ? (
            <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-yunicity-primary px-1 text-[10px] font-bold text-white">
              {filterCount}
            </span>
          ) : null}
        </button>
      </div>

      <div className="inline-flex w-full rounded-2xl border border-neutral-200 bg-white p-1">
        <span className="inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-yunicity-primary text-sm font-semibold text-white">
          <Search className="h-3.5 w-3.5" aria-hidden />
          {NEIGHBORHOODS_DESKTOP_MODE_EXPLORE}
        </span>
        <Link
          href={mapHref}
          className="inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-xl text-sm font-semibold text-neutral-700"
        >
          <Map className="h-3.5 w-3.5" aria-hidden />
          {NEIGHBORHOODS_DESKTOP_MODE_MAP}
        </Link>
      </div>

      <div className="-mx-1 overflow-x-auto px-1 pb-0.5" role="tablist" aria-label="Ambiances">
        <div className="flex w-max gap-2">
          {NEIGHBORHOODS_MEDIUM_AMBIANCE_CHIPS.map((chip) => {
            const active = selectedChip === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onSelectChip(chip.id)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                  active
                    ? "border-yunicity-primary bg-yunicity-primary text-white"
                    : CHIP_IDLE[chip.tone]
                }`}
              >
                {chip.id === "all" ? <Home className="h-3.5 w-3.5" aria-hidden /> : null}
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}

type NeighborhoodsMobileFeaturedProps = {
  card: NeighborhoodsDesktopHeroCard;
  isFollowed: boolean;
  onToggleFollow: () => void;
};

export function NeighborhoodsMobileFeatured({
  card,
  isFollowed,
  onToggleFollow,
}: NeighborhoodsMobileFeaturedProps) {
  return (
    <article
      className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm"
      data-neighborhoods-mobile-featured=""
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-neutral-100">
        <div className="absolute inset-0">
          <CulturalImage
            src={card.imageUrl}
            alt={card.name}
            placeName={card.name}
            className="h-full w-full"
            imageClassName="object-cover"
            sizes="100vw"
            showFallbackCaption
            fallbackLabel="Quartier"
            overlay={false}
            priority
          />
        </div>
      </div>
      <div className="space-y-3 p-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-600">
          {NEIGHBORHOODS_DESKTOP_FEATURED_BADGE}
        </p>
        <h2 className="text-2xl font-bold text-neutral-950">{card.name}</h2>
        <div className="flex flex-wrap gap-1.5">
          {card.tags.map((tag) => (
            <span
              key={tag.id}
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${TAG_CLASS[tag.tone]}`}
            >
              {tag.label}
            </span>
          ))}
        </div>
        <p className="text-sm leading-relaxed text-neutral-600">{card.description}</p>
        {card.eventLine ? (
          <p className="flex items-start gap-2 border-t border-neutral-100 pt-3 text-sm text-neutral-700">
            <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
            <span>{card.eventLine}</span>
          </p>
        ) : null}
        <Link
          href={card.href}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-yunicity-primary px-4 text-sm font-semibold text-white"
        >
          {NEIGHBORHOODS_DESKTOP_EXPLORE_NEIGHBORHOOD}
        </Link>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onToggleFollow}
            aria-pressed={isFollowed}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-neutral-200 bg-white text-sm font-semibold text-neutral-800"
          >
            <Bookmark
              className={`h-4 w-4 ${isFollowed ? "fill-yunicity-primary text-yunicity-primary" : ""}`}
              aria-hidden
            />
            {isFollowed ? NEIGHBORHOODS_DESKTOP_FOLLOWING : NEIGHBORHOODS_DESKTOP_FOLLOW}
          </button>
          <Link
            href={card.mapHref}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-neutral-200 bg-white text-sm font-semibold text-neutral-800"
          >
            <Map className="h-4 w-4" aria-hidden />
            {NEIGHBORHOODS_MOBILE_VIEW_ON_MAP}
          </Link>
        </div>
      </div>
    </article>
  );
}

export function NeighborhoodsMobileYourHood() {
  return (
    <section
      className="flex items-center gap-3 rounded-2xl border border-neutral-200/90 bg-neutral-50 px-3.5 py-3"
      data-neighborhoods-mobile-your-hood=""
    >
      <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-yunicity-primary shadow-sm">
        <Home className="h-5 w-5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-neutral-900">{NEIGHBORHOODS_DESKTOP_YOUR_HOOD_TITLE}</p>
        <p className="text-sm font-semibold text-neutral-800">{NEIGHBORHOODS_MEDIUM_YOUR_HOOD_EMPTY}</p>
        <p className="mt-0.5 text-xs leading-snug text-neutral-500">
          {NEIGHBORHOODS_MOBILE_YOUR_HOOD_HINT}
        </p>
      </div>
      <Link
        href="/profile/me/edit"
        className="inline-flex shrink-0 items-center justify-center rounded-xl bg-yunicity-primary px-3.5 py-2.5 text-sm font-semibold text-white"
      >
        {NEIGHBORHOODS_MOBILE_DEFINE}
      </Link>
    </section>
  );
}

type NeighborhoodsMobileExploreRailProps = {
  cards: NeighborhoodsDesktopGridCard[];
  totalCount: number;
  followedSlugs: Set<string>;
  onToggleFollow: (slug: string) => void;
};

export function NeighborhoodsMobileExploreRail({
  cards,
  totalCount,
  followedSlugs,
  onToggleFollow,
}: NeighborhoodsMobileExploreRailProps) {
  if (cards.length === 0) return null;

  return (
    <section className="space-y-3" data-neighborhoods-mobile-explore="" id="neighborhoods-mobile-explore">
      <div className="flex items-end justify-between gap-3">
        <h2 className="text-lg font-bold text-neutral-900">{NEIGHBORHOODS_DESKTOP_GRID_TITLE}</h2>
        <a
          href="#neighborhoods-mobile-explore"
          className="inline-flex items-center gap-1 text-sm font-semibold text-yunicity-primary"
        >
          {NEIGHBORHOODS_MOBILE_SEE_ALL_ARROW(totalCount)}
          <ChevronRight className="h-4 w-4" aria-hidden />
        </a>
      </div>
      <ul className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
        {cards.map((card) => {
          const followed = followedSlugs.has(card.slug);
          return (
            <li key={card.id} className="w-[78%] max-w-[280px] shrink-0">
              <article className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm">
                <Link href={card.href} className="relative block aspect-[4/3] overflow-hidden bg-neutral-100">
                  <div className="absolute inset-0">
                    <CulturalImage
                      src={card.imageUrl}
                      alt={card.name}
                      placeName={card.name}
                      className="h-full w-full"
                      imageClassName="object-cover"
                      sizes="280px"
                      showFallbackCaption
                      fallbackLabel="Quartier"
                      overlay={false}
                    />
                  </div>
                </Link>
                <div className="space-y-2.5 p-3">
                  <div>
                    <h3 className="text-base font-bold text-neutral-900">
                      <Link href={card.href}>{card.name}</Link>
                    </h3>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {card.tags.map((tag) => (
                        <span
                          key={tag.id}
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${TAG_CLASS[tag.tone]}`}
                        >
                          {tag.label}
                        </span>
                      ))}
                    </div>
                  </div>
                  {card.eventLine ? (
                    <p className="flex items-start gap-1.5 text-xs text-neutral-600">
                      <CalendarDays className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400" aria-hidden />
                      <span className="line-clamp-2">{card.eventLine}</span>
                    </p>
                  ) : (
                    <p className="h-8" aria-hidden />
                  )}
                  <div className="flex items-center gap-2">
                    <Link
                      href={card.href}
                      className="inline-flex min-h-10 flex-1 items-center justify-center rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-800"
                    >
                      {NEIGHBORHOODS_DESKTOP_EXPLORE}
                    </Link>
                    <button
                      type="button"
                      aria-pressed={followed}
                      aria-label={followed ? NEIGHBORHOODS_DESKTOP_FOLLOWING : NEIGHBORHOODS_DESKTOP_FOLLOW}
                      onClick={() => onToggleFollow(card.slug)}
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-neutral-200 text-neutral-600"
                    >
                      <Bookmark
                        className={`h-4 w-4 ${followed ? "fill-yunicity-primary text-yunicity-primary" : ""}`}
                        aria-hidden
                      />
                    </button>
                  </div>
                </div>
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
