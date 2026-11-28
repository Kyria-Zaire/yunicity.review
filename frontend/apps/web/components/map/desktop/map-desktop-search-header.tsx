"use client";

import type { MapPortalCategoryId } from "@yunicity/utils";
import {
  MAP_PORTAL_CATEGORY_NEIGHBORHOODS,
  MAP_PORTAL_CHIP_ALL,
  MAP_PORTAL_CHIP_EVENTS,
  MAP_PORTAL_CHIP_MORE,
  MAP_PORTAL_CHIP_PASSPORT,
  MAP_PORTAL_CHIP_PLACES,
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

type MapDesktopSearchHeaderProps = {
  activeCategory: MapPortalCategoryId;
  onSelectCategory: (category: MapPortalCategoryId) => void;
};

export function MapDesktopSearchHeader({
  activeCategory,
  onSelectCategory,
}: MapDesktopSearchHeaderProps) {
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
    <div className="space-y-3" data-map-desktop-search-header="">
      <form onSubmit={handleSearchSubmit}>
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
            className="w-full rounded-2xl border border-neutral-200/90 bg-white py-3 pl-11 pr-4 text-sm text-neutral-900 shadow-sm outline-none placeholder:text-neutral-400 focus:border-yunicity-primary focus:ring-2 focus:ring-yunicity-primary/20"
          />
        </label>
      </form>

      <div className="overflow-x-auto pb-0.5">
        <div className="flex min-w-max gap-2">
          {CHIPS.map((chip) => {
            const Icon = chip.icon;
            if (chip.id === "more") {
              return (
                <Link
                  key={chip.id}
                  href="/search"
                  className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 shadow-sm transition hover:border-yunicity-primary/30"
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
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold shadow-sm transition ${
                  active
                    ? "bg-yunicity-primary text-white"
                    : "border border-neutral-200 bg-white text-neutral-700 hover:border-yunicity-primary/30"
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
