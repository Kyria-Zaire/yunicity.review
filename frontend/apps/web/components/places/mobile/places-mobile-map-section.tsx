"use client";

import type { PlacesMobilePlaceCard } from "@yunicity/utils";
import {
  PLACES_MOBILE_MAP_OPEN,
  PLACES_MOBILE_MAP_VIEW_LIST,
  PLACES_MOBILE_MAP_VIEW_MAP,
} from "@yunicity/utils";
import { MapPin, Music2, UtensilsCrossed, Wine } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type PlacesMobileMapSectionProps = {
  city: string;
  listPreview: PlacesMobilePlaceCard[];
};

/** Bloc carte / liste mobile Lieux (MOBILE-LIEUX-01). */
export function PlacesMobileMapSection({ city, listPreview }: PlacesMobileMapSectionProps) {
  const [view, setView] = useState<"map" | "list">("map");
  const mapHref = `/map?city=${encodeURIComponent(city)}`;

  return (
    <section className="space-y-2" aria-label="Carte des lieux">
      <div className="relative overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm">
        {view === "map" ? (
          <Link href={mapHref} className="relative block aspect-[4/3] bg-[linear-gradient(135deg,#E8F4FC_0%,#D4E8F7_50%,#C5DCF0_100%)]">
            <div className="absolute inset-0 opacity-25" aria-hidden>
              <svg viewBox="0 0 120 120" className="h-full w-full text-sky-200/80">
                <path
                  d="M0 40h120M0 80h120M40 0v120M80 0v120"
                  stroke="currentColor"
                  strokeWidth="0.5"
                  fill="none"
                />
              </svg>
            </div>
            <span className="absolute left-[20%] top-[28%] inline-flex h-7 w-7 items-center justify-center rounded-full bg-violet-500 text-white shadow-md">
              <Music2 className="h-3.5 w-3.5" aria-hidden />
            </span>
            <span className="absolute left-[52%] top-[38%] inline-flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 text-white shadow-md">
              <UtensilsCrossed className="h-3.5 w-3.5" aria-hidden />
            </span>
            <span className="absolute left-[36%] top-[58%] inline-flex h-7 w-7 items-center justify-center rounded-full bg-pink-500 text-white shadow-md">
              <Wine className="h-3.5 w-3.5" aria-hidden />
            </span>
            <span className="absolute right-[22%] top-[48%] inline-flex h-8 w-8 items-center justify-center rounded-full bg-yunicity-primary text-white shadow-lg ring-4 ring-yunicity-primary/20">
              <MapPin className="h-4 w-4" aria-hidden />
            </span>
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/35 to-transparent px-4 py-3 text-sm font-semibold text-white">
              {PLACES_MOBILE_MAP_OPEN}
            </span>
          </Link>
        ) : (
          <ul className="max-h-[280px] divide-y divide-neutral-100 overflow-y-auto">
            {listPreview.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-neutral-500">Aucun lieu à afficher.</li>
            ) : (
              listPreview.slice(0, 6).map((item) => (
                <li key={item.id}>
                  <Link href={item.href} className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-50">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-neutral-900">{item.name}</p>
                      <p className="truncate text-xs text-neutral-500">
                        {item.categoryLabel} · {item.neighborhoodName}
                      </p>
                    </div>
                    {item.distanceLabel ? (
                      <span className="shrink-0 text-xs font-semibold text-neutral-600">
                        {item.distanceLabel}
                      </span>
                    ) : null}
                  </Link>
                </li>
              ))
            )}
          </ul>
        )}

        <div className="absolute bottom-3 right-3 flex rounded-full border border-neutral-200/90 bg-white p-0.5 shadow-md">
          <button
            type="button"
            onClick={() => setView("map")}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              view === "map" ? "bg-yunicity-primary text-white" : "text-neutral-600"
            }`}
          >
            {PLACES_MOBILE_MAP_VIEW_MAP}
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              view === "list" ? "bg-yunicity-primary text-white" : "text-neutral-600"
            }`}
          >
            {PLACES_MOBILE_MAP_VIEW_LIST}
          </button>
        </div>
      </div>
    </section>
  );
}
