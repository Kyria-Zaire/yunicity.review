"use client";

import type { PlaceDetailDesktopWhyItem } from "@yunicity/utils";
import { PLACE_DETAIL_DESKTOP_WHY_TITLE } from "@yunicity/utils";
import { BookOpen, Building2, Landmark } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const WHY_ICONS: Record<string, LucideIcon> = {
  heritage: Building2,
  read: BookOpen,
  local: Landmark,
};

type PlaceDesktopDetailWhyProps = {
  items: PlaceDetailDesktopWhyItem[];
};

export function PlaceDesktopDetailWhy({ items }: PlaceDesktopDetailWhyProps) {
  if (items.length === 0) return null;

  return (
    <section className="space-y-3" aria-labelledby="place-desktop-why-title" data-place-desktop-detail-why="">
      <h2 id="place-desktop-why-title" className="text-lg font-bold text-neutral-900">
        {PLACE_DETAIL_DESKTOP_WHY_TITLE}
      </h2>
      <ul className="space-y-3">
        {items.map((item) => {
          const Icon = WHY_ICONS[item.id] ?? Landmark;
          return (
            <li key={item.id} className="flex gap-3 rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
              <span
                className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${item.tone}`}
                aria-hidden
              >
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-neutral-900">{item.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-neutral-600">{item.body}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
