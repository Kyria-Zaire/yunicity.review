"use client";

import type { PlaceDetailDesktopKnowItem } from "@yunicity/utils";
import { PLACE_DETAIL_DESKTOP_KNOW_TITLE } from "@yunicity/utils";
import { Accessibility, BookOpen, Ticket, Volume2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const KNOW_ICONS: Record<string, LucideIcon> = {
  free: Ticket,
  pmr: Accessibility,
  quiet: Volume2,
  docs: BookOpen,
};

type PlaceDesktopDetailKnowProps = {
  items: PlaceDetailDesktopKnowItem[];
};

export function PlaceDesktopDetailKnow({ items }: PlaceDesktopDetailKnowProps) {
  if (items.length === 0) return null;

  return (
    <section className="space-y-3" aria-labelledby="place-desktop-know-title" data-place-desktop-detail-know="">
      <h2 id="place-desktop-know-title" className="text-lg font-bold text-neutral-900">
        {PLACE_DETAIL_DESKTOP_KNOW_TITLE}
      </h2>
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {items.map((item) => {
          const Icon = KNOW_ICONS[item.id] ?? Ticket;
          return (
            <li
              key={item.id}
              className="rounded-2xl border border-neutral-200/90 bg-white px-4 py-3 text-center shadow-sm"
            >
              <span
                className={`mx-auto inline-flex h-10 w-10 items-center justify-center rounded-full ${item.tone}`}
                aria-hidden
              >
                <Icon className="h-4 w-4" />
              </span>
              <p className="mt-2 text-sm font-semibold text-neutral-900">{item.label}</p>
              <p className="mt-0.5 text-xs text-neutral-500">{item.sublabel}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
