"use client";

import {
  SORTIR_DESKTOP_EXPLORE_MAP,
  SORTIR_DESKTOP_EXPLORE_MAP_BODY,
  SORTIR_DESKTOP_EXPLORE_NEIGHBORHOOD,
  SORTIR_DESKTOP_EXPLORE_NEIGHBORHOOD_BODY,
  SORTIR_DESKTOP_EXPLORE_PASSPORT,
  SORTIR_DESKTOP_EXPLORE_PASSPORT_BODY,
  sortirNeighborhoodsHref,
} from "@yunicity/utils";
import { ChevronRight, Compass, MapPin, Ticket } from "lucide-react";
import Link from "next/link";

type SortirMobileExploreCardsProps = {
  city: string;
};

const EXPLORE_ITEMS = [
  {
    href: (city: string) => `/map?city=${encodeURIComponent(city)}`,
    icon: MapPin,
    iconClass: "bg-[#EEF0FF] text-yunicity-primary",
    title: SORTIR_DESKTOP_EXPLORE_MAP,
    body: SORTIR_DESKTOP_EXPLORE_MAP_BODY,
  },
  {
    href: (city: string) => sortirNeighborhoodsHref(city),
    icon: Compass,
    iconClass: "bg-orange-50 text-orange-600",
    title: SORTIR_DESKTOP_EXPLORE_NEIGHBORHOOD,
    body: SORTIR_DESKTOP_EXPLORE_NEIGHBORHOOD_BODY,
  },
  {
    href: () => "/passport",
    icon: Ticket,
    iconClass: "bg-violet-50 text-violet-600",
    title: SORTIR_DESKTOP_EXPLORE_PASSPORT,
    body: SORTIR_DESKTOP_EXPLORE_PASSPORT_BODY,
  },
] as const;

/** Cartes d’exploration mobile — maquette MOBILE-SORTIR (scroll horizontal). */
export function SortirMobileExploreCards({ city }: SortirMobileExploreCardsProps) {
  return (
    <section aria-label="Explorer autrement" data-sortir-mobile-explore="">
      <ul className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {EXPLORE_ITEMS.map((item) => {
          const Icon = item.icon;
          const href = item.href(city);
          return (
            <li key={item.title} className="w-[78vw] max-w-[16.5rem] shrink-0">
              <Link
                href={href}
                className="flex h-full items-center gap-3 rounded-2xl border border-neutral-200/90 bg-white p-3.5 shadow-sm"
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${item.iconClass}`}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-neutral-900">{item.title}</span>
                  <span className="mt-0.5 block text-xs leading-snug text-neutral-500">{item.body}</span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
