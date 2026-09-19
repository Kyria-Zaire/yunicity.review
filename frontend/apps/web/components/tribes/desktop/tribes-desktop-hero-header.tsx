"use client";

import type { TribesDesktopCategoryId } from "@yunicity/utils";
import {
  TRIBES_DESKTOP_BREADCRUMB,
  TRIBES_DESKTOP_CHIP_CULTURE,
  TRIBES_DESKTOP_CHIP_CREATORS,
  TRIBES_DESKTOP_CHIP_ENTRAIDE,
  TRIBES_DESKTOP_CHIP_FOR_YOU,
  TRIBES_DESKTOP_CHIP_NEARBY,
  TRIBES_DESKTOP_CHIP_PARENTS,
  TRIBES_DESKTOP_CHIP_SPORT,
  TRIBES_DESKTOP_CHIP_STUDENTS,
  TRIBES_DESKTOP_CREATE_CTA,
  TRIBES_DESKTOP_EDITORIAL_BODY,
  TRIBES_DESKTOP_EDITORIAL_TITLE,
  TRIBES_DESKTOP_SEARCH_PLACEHOLDER,
  TRIBES_PORTAL_CREATE_HREF,
} from "@yunicity/utils";
import {
  Drama,
  GraduationCap,
  Heart,
  Home,
  MapPin,
  Pencil,
  Search,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

type TribesDesktopHeroHeaderProps = {
  city: string;
  searchQuery: string;
  activeCategory: TribesDesktopCategoryId;
  onSearchChange: (query: string) => void;
  onCategoryChange: (categoryId: TribesDesktopCategoryId) => void;
};

const CHIP_OPTIONS: Array<{ id: TribesDesktopCategoryId; label: string; icon: LucideIcon }> = [
  { id: "for_you", label: TRIBES_DESKTOP_CHIP_FOR_YOU, icon: Home },
  { id: "nearby", label: TRIBES_DESKTOP_CHIP_NEARBY, icon: MapPin },
  { id: "culture", label: TRIBES_DESKTOP_CHIP_CULTURE, icon: Drama },
  { id: "sport", label: TRIBES_DESKTOP_CHIP_SPORT, icon: Users },
  { id: "students", label: TRIBES_DESKTOP_CHIP_STUDENTS, icon: GraduationCap },
  { id: "parents", label: TRIBES_DESKTOP_CHIP_PARENTS, icon: Users },
  { id: "creators", label: TRIBES_DESKTOP_CHIP_CREATORS, icon: Pencil },
  { id: "entraide", label: TRIBES_DESKTOP_CHIP_ENTRAIDE, icon: Heart },
];

export function TribesDesktopHeroHeader({
  city,
  searchQuery,
  activeCategory,
  onSearchChange,
  onCategoryChange,
}: TribesDesktopHeroHeaderProps) {
  return (
    <header className="tribes-desktop-hero-header space-y-5" data-tribes-desktop-hero-header="">
      <div className="tribes-desktop-hero-intro min-w-0">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-yunicity-primary">
          {TRIBES_DESKTOP_BREADCRUMB(city)}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-neutral-900 sm:text-[2rem] sm:leading-tight">
          {TRIBES_DESKTOP_EDITORIAL_TITLE}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-600 sm:text-[0.9375rem]">
          {TRIBES_DESKTOP_EDITORIAL_BODY}
        </p>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="relative block min-w-0 flex-1">
          <span className="sr-only">{TRIBES_DESKTOP_SEARCH_PLACEHOLDER}</span>
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-yunicity-primary"
            aria-hidden
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={TRIBES_DESKTOP_SEARCH_PLACEHOLDER}
            className="h-12 w-full rounded-2xl border border-neutral-200/90 bg-white pl-11 pr-4 text-sm text-neutral-900 shadow-sm placeholder:text-neutral-400 focus:border-yunicity-primary/40 focus:outline-none focus:ring-2 focus:ring-yunicity-primary/15"
          />
        </label>
        <Link
          href={`${TRIBES_PORTAL_CREATE_HREF}?city=${encodeURIComponent(city)}`}
          className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-yunicity-primary px-5 text-sm font-semibold text-white transition hover:bg-yunicity-primary-hover"
        >
          + {TRIBES_DESKTOP_CREATE_CTA}
        </Link>
      </div>

      <nav aria-label="Catégories" className="flex flex-wrap gap-2">
        {CHIP_OPTIONS.map((option) => {
          const Icon = option.icon;
          const active = activeCategory === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onCategoryChange(option.id)}
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
    </header>
  );
}
