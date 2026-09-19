"use client";

import type { SortirDesktopWhenId } from "@yunicity/utils";
import {
  SORTIR_DESKTOP_EDITORIAL_KICKER,
  SORTIR_DESKTOP_EDITORIAL_TITLE,
  SORTIR_DESKTOP_MOOD_BUDGET,
  SORTIR_DESKTOP_MOOD_FAMILY,
  SORTIR_DESKTOP_MOOD_FRIENDS,
  SORTIR_DESKTOP_MOOD_TONIGHT,
  SORTIR_DESKTOP_WHEN_TODAY,
  SORTIR_DESKTOP_WHEN_TOMORROW,
  SORTIR_DESKTOP_WHEN_WEEKEND,
  MY_AGENDA_HREF,
  SORTIR_MOBILE_AGENDA_PILL,
  SORTIR_MOBILE_EDITORIAL_BODY,
  SORTIR_MOBILE_FILTERS_ARIA,
  SORTIR_MOBILE_SEARCH_PLACEHOLDER,
} from "@yunicity/utils";
import {
  Bookmark,
  CalendarDays,
  Moon,
  Search,
  SlidersHorizontal,
  Tag,
  Users,
  UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { RefObject } from "react";
import { useRouter } from "next/navigation";

const WHEN_OPTIONS: Array<{ id: SortirDesktopWhenId; label: string }> = [
  { id: "today", label: SORTIR_DESKTOP_WHEN_TODAY },
  { id: "tomorrow", label: SORTIR_DESKTOP_WHEN_TOMORROW },
  { id: "weekend", label: SORTIR_DESKTOP_WHEN_WEEKEND },
];

const MOOD_OPTIONS: Array<{ id: string; label: string; icon: LucideIcon }> = [
  { id: "tonight", label: SORTIR_DESKTOP_MOOD_TONIGHT, icon: Moon },
  { id: "friends", label: SORTIR_DESKTOP_MOOD_FRIENDS, icon: Users },
  { id: "family", label: SORTIR_DESKTOP_MOOD_FAMILY, icon: UsersRound },
  { id: "budget", label: SORTIR_DESKTOP_MOOD_BUDGET, icon: Tag },
];

type SortirMobileEditorialControlsProps = {
  city: string;
  editorialMoment: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeWhen: SortirDesktopWhenId;
  onWhenChange: (whenId: SortirDesktopWhenId) => void;
  activeMood: string;
  onMoodChange: (moodId: string) => void;
  savedCount: number;
  activeFilterCount: number;
  filterOpen: boolean;
  onOpenFilters: () => void;
  filterButtonRef?: RefObject<HTMLButtonElement>;
};

export function SortirMobileEditorialControls({
  city,
  editorialMoment,
  searchQuery,
  onSearchChange,
  activeWhen,
  onWhenChange,
  activeMood,
  onMoodChange,
  savedCount,
  activeFilterCount,
  filterOpen,
  onOpenFilters,
  filterButtonRef,
}: SortirMobileEditorialControlsProps) {
  const router = useRouter();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      router.push("/search?group=events");
      return;
    }
    router.push(`/search?q=${encodeURIComponent(trimmed)}&group=events`);
  }

  return (
    <section className="space-y-4" aria-label="Découvrir les sorties" data-sortir-mobile-editorial="">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-yunicity-primary">
          {SORTIR_DESKTOP_EDITORIAL_KICKER(city, editorialMoment)}
        </p>
        <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-neutral-900">
          {SORTIR_DESKTOP_EDITORIAL_TITLE(city)}
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-neutral-600">{SORTIR_MOBILE_EDITORIAL_BODY}</p>
      </div>

      <div className="flex items-center gap-2">
        <form onSubmit={handleSubmit} className="min-w-0 flex-1">
          <label className="relative block">
            <span className="sr-only">{SORTIR_MOBILE_SEARCH_PLACEHOLDER}</span>
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-neutral-400"
              aria-hidden
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={SORTIR_MOBILE_SEARCH_PLACEHOLDER}
              className="h-11 w-full rounded-2xl border border-neutral-200/90 bg-white py-2 pl-10 pr-3 text-sm text-neutral-900 shadow-sm placeholder:text-neutral-400 focus:border-yunicity-primary/40 focus:outline-none focus:ring-2 focus:ring-yunicity-primary/15"
            />
          </label>
        </form>
        <button
          type="button"
          ref={filterButtonRef}
          onClick={onOpenFilters}
          aria-expanded={filterOpen}
          aria-label={
            activeFilterCount > 0
              ? `${SORTIR_MOBILE_FILTERS_ARIA} — ${activeFilterCount} actif${activeFilterCount > 1 ? "s" : ""}`
              : SORTIR_MOBILE_FILTERS_ARIA
          }
          className={`relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition ${
            filterOpen || activeFilterCount > 0
              ? "border-yunicity-primary bg-[#EEF0FF] text-yunicity-primary"
              : "border-neutral-200/90 bg-white text-neutral-600"
          }`}
        >
          <SlidersHorizontal className="h-[18px] w-[18px]" aria-hidden />
          {activeFilterCount > 0 ? (
            <span className="absolute -right-1.5 -top-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-yunicity-primary px-1 text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          ) : null}
        </button>
      </div>

      <div className="flex items-center gap-2">
        <div
          className="flex min-w-0 flex-1 overflow-x-auto rounded-xl border border-neutral-200/90 bg-white p-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="group"
          aria-label="Quand"
        >
          {WHEN_OPTIONS.map((option) => {
            const active = activeWhen === option.id;
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={active}
                onClick={() => onWhenChange(option.id)}
                className={`inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 text-xs font-semibold transition ${
                  active
                    ? "bg-yunicity-primary text-white"
                    : "bg-transparent text-neutral-800"
                }`}
              >
                {active ? <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden /> : null}
                {option.label}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          disabled
          title="Choisir une date — bientôt"
          aria-label="Choisir une date"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-neutral-200/90 bg-white text-neutral-700 opacity-70"
        >
          <CalendarDays className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <nav
        aria-label="Ambiances"
        className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {MOOD_OPTIONS.map((option) => {
          const Icon = option.icon;
          const active = activeMood === option.id;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={active}
              onClick={() => onMoodChange(option.id)}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                active
                  ? "border-yunicity-primary bg-yunicity-primary text-white"
                  : "border-neutral-200 bg-white text-neutral-800"
              }`}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden />
              {option.label}
            </button>
          );
        })}
      </nav>

      <div className="flex justify-end">
        <Link
          href={MY_AGENDA_HREF}
          className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-800 shadow-sm"
        >
          <Bookmark className="h-3.5 w-3.5 text-yunicity-primary" aria-hidden />
          {SORTIR_MOBILE_AGENDA_PILL(savedCount)}
        </Link>
      </div>
    </section>
  );
}
