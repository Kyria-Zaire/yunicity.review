"use client";

import {
  PLACE_DETAIL_MEDIUM_ABOUT_COLLAPSE,
  PLACE_DETAIL_MEDIUM_ABOUT_EXPAND,
  PLACE_DETAIL_MEDIUM_ABOUT_TITLE,
  PLACE_DETAIL_MEDIUM_WHY_TITLE,
} from "@yunicity/utils";
import type { PlaceDetailDesktopWhyItem } from "@yunicity/utils";
import { BookOpen, Building2, ChevronDown, Landmark } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";

const WHY_ICONS: Record<string, LucideIcon> = {
  heritage: Building2,
  read: BookOpen,
  local: Landmark,
};

type PlaceMediumDetailAboutWhyProps = {
  preview: string;
  rest: string | null;
  whyItems: PlaceDetailDesktopWhyItem[];
};

export function PlaceMediumDetailAboutWhy({ preview, rest, whyItems }: PlaceMediumDetailAboutWhyProps) {
  const [expanded, setExpanded] = useState(false);
  const hasMore = Boolean(rest?.trim());

  if (!preview && !rest && whyItems.length === 0) return null;

  return (
    <div className="place-medium-detail-about-why-grid gap-4" data-place-medium-detail-about-why="">
      {(preview || rest) && (
        <section
          className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm"
          aria-labelledby="place-medium-about-title"
        >
          <h2
            id="place-medium-about-title"
            className="border-b border-neutral-100 px-4 py-3 text-sm font-bold text-neutral-900"
          >
            {PLACE_DETAIL_MEDIUM_ABOUT_TITLE}
          </h2>
          <div className="space-y-3 p-4 text-sm leading-relaxed text-neutral-700">
            {preview ? <p>{preview}</p> : null}
            {hasMore && expanded ? <p className="whitespace-pre-line">{rest}</p> : null}
            {hasMore ? (
              <button
                type="button"
                onClick={() => setExpanded((value) => !value)}
                className="inline-flex items-center gap-1 text-sm font-semibold text-yunicity-primary hover:underline"
              >
                {expanded ? PLACE_DETAIL_MEDIUM_ABOUT_COLLAPSE : PLACE_DETAIL_MEDIUM_ABOUT_EXPAND}
                <ChevronDown className={`h-4 w-4 transition ${expanded ? "rotate-180" : ""}`} aria-hidden />
              </button>
            ) : null}
          </div>
        </section>
      )}

      {whyItems.length > 0 ? (
        <section
          className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm"
          aria-labelledby="place-medium-why-title"
        >
          <h2
            id="place-medium-why-title"
            className="border-b border-neutral-100 px-4 py-3 text-sm font-bold text-neutral-900"
          >
            {PLACE_DETAIL_MEDIUM_WHY_TITLE}
          </h2>
          <ul className="space-y-3 p-4">
            {whyItems.map((item) => {
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
      ) : null}
    </div>
  );
}
