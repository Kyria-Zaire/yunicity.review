"use client";

import type { PlaceDetailDesktopWhyItem } from "@yunicity/utils";
import { PLACE_DETAIL_MOBILE_WHY_TITLE } from "@yunicity/utils";
import { BookOpen, Building2, Landmark } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const WHY_ICONS: Record<string, LucideIcon> = {
  heritage: Building2,
  read: BookOpen,
  local: Landmark,
};

type PlaceMobileDetailWhyProps = {
  items: PlaceDetailDesktopWhyItem[];
};

export function PlaceMobileDetailWhy({ items }: PlaceMobileDetailWhyProps) {
  if (items.length === 0) return null;

  return (
    <section
      className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm"
      aria-labelledby="place-mobile-why-title"
      data-place-mobile-detail-why=""
    >
      <h2 id="place-mobile-why-title" className="border-b border-neutral-100 px-4 py-3 text-sm font-bold text-neutral-900">
        {PLACE_DETAIL_MOBILE_WHY_TITLE}
      </h2>
      <ul className="space-y-3 p-4">
        {items.map((item) => {
          const Icon = WHY_ICONS[item.id] ?? Landmark;
          return (
            <li key={item.id} className="flex gap-3">
              <span
                className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${item.tone}`}
                aria-hidden
              >
                <Icon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-neutral-900">{item.title}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-neutral-600">{item.body}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
