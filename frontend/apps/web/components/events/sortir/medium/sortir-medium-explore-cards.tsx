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

type SortirMediumExploreCardsProps = {
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

export function SortirMediumExploreCards({ city }: SortirMediumExploreCardsProps) {
  return (
    <section aria-label="Explorer autrement" data-sortir-medium-explore="">
      <ul className="sortir-medium-explore-grid grid gap-3 sm:grid-cols-3">
        {EXPLORE_ITEMS.map((item) => {
          const Icon = item.icon;
          const href = item.href(city);
          return (
            <li key={item.title}>
              <Link
                href={href}
                className="feed-desktop-surface flex h-full items-center gap-3 rounded-2xl p-4 transition hover:bg-neutral-50/80"
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
