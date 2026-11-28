"use client";

import type { PlaceDetailDesktopKnowItem } from "@yunicity/utils";
import { PLACE_DETAIL_MEDIUM_KNOW_TITLE } from "@yunicity/utils";
import { Accessibility, BookOpen, Ticket, Volume2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const KNOW_ICONS: Record<string, LucideIcon> = {
  free: Ticket,
  pmr: Accessibility,
  quiet: Volume2,
  docs: BookOpen,
};

type PlaceMediumDetailKnowProps = {
  items: PlaceDetailDesktopKnowItem[];
};

/** Chips « À savoir » medium — icône à gauche (MEDIUM-LIEUX-DETAIL-01). */
export function PlaceMediumDetailKnow({ items }: PlaceMediumDetailKnowProps) {
  if (items.length === 0) return null;

  return (
    <section className="space-y-3" aria-labelledby="place-medium-know-title" data-place-medium-detail-know="">
      <h2 id="place-medium-know-title" className="text-lg font-bold text-neutral-900">
        {PLACE_DETAIL_MEDIUM_KNOW_TITLE}
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => {
          const Icon = KNOW_ICONS[item.id] ?? Ticket;
          return (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm"
            >
              <span
                className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${item.tone}`}
                aria-hidden
              >
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-neutral-900">{item.label}</p>
                <p className="text-xs text-neutral-500">{item.sublabel}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
