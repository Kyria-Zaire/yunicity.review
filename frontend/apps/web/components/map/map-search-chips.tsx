"use client";

import type { MapPortalCategoryId } from "@yunicity/utils";
import {
  MAP_PORTAL_CHIP_ALL,
  MAP_PORTAL_CHIP_EVENTS,
  MAP_PORTAL_CHIP_MORE,
  MAP_PORTAL_CHIP_PASSPORT,
  MAP_PORTAL_CHIP_PLACES,
  MAP_PORTAL_CATEGORY_NEIGHBORHOODS,
  MAP_PORTAL_SEARCH_PLACEHOLDER,
} from "@yunicity/utils";
import { Calendar, MapPin, MapPinHouse, Search, SlidersHorizontal, Star, TicketPercent } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const CHIPS: {
  id: MapPortalCategoryId | "more";
  label: string;
  icon: typeof Star;
}[] = [
  { id: "all", label: MAP_PORTAL_CHIP_ALL, icon: Star },
  { id: "neighborhoods", label: MAP_PORTAL_CATEGORY_NEIGHBORHOODS, icon: MapPinHouse },
  { id: "places", label: MAP_PORTAL_CHIP_PLACES, icon: MapPin },
  { id: "events", label: MAP_PORTAL_CHIP_EVENTS, icon: Calendar },
  { id: "partners", label: MAP_PORTAL_CHIP_PASSPORT, icon: TicketPercent },
  { id: "more", label: MAP_PORTAL_CHIP_MORE, icon: SlidersHorizontal },
];

type MapSearchChipsProps = {
  activeCategory: MapPortalCategoryId;
  onSelectCategory: (category: MapPortalCategoryId) => void;
};

export function MapSearchChips({ activeCategory, onSelectCategory }: MapSearchChipsProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSearchSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      router.push("/search");
      return;
    }
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 space-y-3 p-3 sm:p-4">
      <form
        onSubmit={handleSearchSubmit}
        className="pointer-events-auto mx-auto max-w-3xl"
      >
        <label className="relative block">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={MAP_PORTAL_SEARCH_PLACEHOLDER}
            className="w-full rounded-2xl border border-neutral-200/80 bg-white/95 py-3 pl-11 pr-4 text-sm text-neutral-900 shadow-lg outline-none backdrop-blur-sm placeholder:text-neutral-400 focus:border-yunicity-primary focus:ring-2 focus:ring-yunicity-primary/30"
          />
        </label>
      </form>

      <div className="pointer-events-auto mx-auto max-w-3xl overflow-x-auto pb-1">
        <div className="flex min-w-max gap-2">
          {CHIPS.map((chip) => {
            const Icon = chip.icon;
            if (chip.id === "more") {
              return (
                <Link
                  key={chip.id}
                  href="/search"
                  className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white/95 px-3 py-2 text-xs font-semibold text-neutral-700 shadow-sm backdrop-blur-sm transition hover:border-yunicity-primary/30"
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                  {chip.label}
                </Link>
              );
            }
            const active = activeCategory === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => onSelectCategory(chip.id as MapPortalCategoryId)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold shadow-sm backdrop-blur-sm transition ${
                  active
                    ? "bg-yunicity-primary text-white"
                    : "border border-neutral-200 bg-white/95 text-neutral-700 hover:border-yunicity-primary/30"
                }`}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden />
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
