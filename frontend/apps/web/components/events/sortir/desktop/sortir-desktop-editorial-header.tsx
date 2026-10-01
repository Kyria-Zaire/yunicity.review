"use client";

import {
  SORTIR_DESKTOP_EDITORIAL_BODY,
  SORTIR_DESKTOP_EDITORIAL_KICKER,
  SORTIR_DESKTOP_EDITORIAL_TITLE,
  SORTIR_DESKTOP_MOOD_BUDGET,
  SORTIR_DESKTOP_MOOD_CALM,
  SORTIR_DESKTOP_MOOD_DANCE,
  SORTIR_DESKTOP_MOOD_FAMILY,
  SORTIR_DESKTOP_MOOD_FRIENDS,
  SORTIR_DESKTOP_MOOD_TONIGHT,
  SORTIR_DESKTOP_SEARCH_PLACEHOLDER,
} from "@yunicity/utils";
import { Leaf, Moon, Search, Tag, Users, UsersRound, Wine } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type SortirDesktopEditorialHeaderProps = {
  city: string;
  editorialMoment: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeMood: string;
  onMoodChange: (moodId: string) => void;
  showIntro?: boolean;
  /** Medium : la recherche vit dans SortirMediumHeader. */
  showSearch?: boolean;
};

const MOOD_OPTIONS: Array<{ id: string; label: string; icon: LucideIcon }> = [
  { id: "tonight", label: SORTIR_DESKTOP_MOOD_TONIGHT, icon: Moon },
  { id: "friends", label: SORTIR_DESKTOP_MOOD_FRIENDS, icon: Users },
  { id: "family", label: SORTIR_DESKTOP_MOOD_FAMILY, icon: UsersRound },
  { id: "budget", label: SORTIR_DESKTOP_MOOD_BUDGET, icon: Tag },
  { id: "calm", label: SORTIR_DESKTOP_MOOD_CALM, icon: Leaf },
  { id: "dance", label: SORTIR_DESKTOP_MOOD_DANCE, icon: Wine },
];

/** En-tête éditorial desktop — maquette DESKTOP-SORTIR-01 (distinct du hero banner legacy). */
export function SortirDesktopEditorialHeader({
  city,
  editorialMoment,
  searchQuery,
  onSearchChange,
  activeMood,
  onMoodChange,
  showIntro = true,
  showSearch = true,
}: SortirDesktopEditorialHeaderProps) {
  return (
    <section className="sortir-desktop-editorial space-y-4" aria-label="Découvrir les sorties" data-sortir-desktop-editorial="">
      {showIntro ? (
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-yunicity-primary">
            {SORTIR_DESKTOP_EDITORIAL_KICKER(city, editorialMoment)}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-neutral-900">
            {SORTIR_DESKTOP_EDITORIAL_TITLE(city)}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-600">{SORTIR_DESKTOP_EDITORIAL_BODY}</p>
        </div>
      ) : null}

      {showSearch ? (
        <label className="relative block">
          <span className="sr-only">{SORTIR_DESKTOP_SEARCH_PLACEHOLDER}</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" aria-hidden />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={SORTIR_DESKTOP_SEARCH_PLACEHOLDER}
            className="h-12 w-full rounded-2xl border border-neutral-200/90 bg-white pl-11 pr-4 text-sm text-neutral-900 shadow-sm placeholder:text-neutral-400 focus:border-yunicity-primary/40 focus:outline-none focus:ring-2 focus:ring-yunicity-primary/15"
          />
        </label>
      ) : null}

      <nav aria-label="Ambiances" className="flex flex-wrap gap-2">
        {MOOD_OPTIONS.map((option) => {
          const Icon = option.icon;
          const active = activeMood === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onMoodChange(option.id)}
              aria-pressed={active}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                active
                  ? "border-yunicity-primary bg-yunicity-primary text-white"
                  : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"
              }`}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden />
              {option.label}
            </button>
          );
        })}
      </nav>
    </section>
  );
}
