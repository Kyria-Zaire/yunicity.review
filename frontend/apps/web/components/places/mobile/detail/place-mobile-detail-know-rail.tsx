"use client";

import type { PlaceDetailDesktopKnowItem } from "@yunicity/utils";
import { PLACE_DETAIL_MOBILE_KNOW_TITLE } from "@yunicity/utils";
import { Accessibility, BookOpen, Ticket, Volume2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const KNOW_ICONS: Record<string, LucideIcon> = {
  free: Ticket,
  pmr: Accessibility,
  quiet: Volume2,
  docs: BookOpen,
};

type PlaceMobileDetailKnowRailProps = {
  items: PlaceDetailDesktopKnowItem[];
};

export function PlaceMobileDetailKnowRail({ items }: PlaceMobileDetailKnowRailProps) {
  if (items.length === 0) return null;

  return (
    <section className="space-y-3" aria-labelledby="place-mobile-know-title" data-place-mobile-detail-know="">
      <h2 id="place-mobile-know-title" className="text-sm font-bold text-neutral-900">
        {PLACE_DETAIL_MOBILE_KNOW_TITLE}
      </h2>
      <div className="-mx-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ul className="flex min-w-max gap-3">
          {items.map((item) => {
            const Icon = KNOW_ICONS[item.id] ?? Ticket;
            return (
              <li
                key={item.id}
                className="flex w-[11.5rem] shrink-0 items-center gap-3 rounded-2xl border border-neutral-200/90 bg-white p-3 shadow-sm"
              >
                <span
                  className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${item.tone}`}
                  aria-hidden
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-neutral-900">{item.label}</p>
                  <p className="line-clamp-2 text-xs text-neutral-500">{item.sublabel}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
