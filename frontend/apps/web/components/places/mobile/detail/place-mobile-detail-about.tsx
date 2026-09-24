"use client";

import {
  PLACE_DETAIL_MOBILE_ABOUT_COLLAPSE,
  PLACE_DETAIL_MOBILE_ABOUT_EXPAND,
  PLACE_DETAIL_MOBILE_ABOUT_TITLE,
} from "@yunicity/utils";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

type PlaceMobileDetailAboutProps = {
  preview: string;
  rest: string | null;
};

export function PlaceMobileDetailAbout({ preview, rest }: PlaceMobileDetailAboutProps) {
  const [expanded, setExpanded] = useState(false);
  const hasMore = Boolean(rest?.trim());

  if (!preview && !rest) return null;

  return (
    <section
      className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm"
      aria-labelledby="place-mobile-about-title"
      data-place-mobile-detail-about=""
    >
      <h2 id="place-mobile-about-title" className="border-b border-neutral-100 px-4 py-3 text-sm font-bold text-neutral-900">
        {PLACE_DETAIL_MOBILE_ABOUT_TITLE}
      </h2>
      <div className="space-y-3 p-4 text-sm leading-relaxed text-neutral-700">
        <p>{preview}</p>
        {hasMore && expanded ? <p className="whitespace-pre-line">{rest}</p> : null}
        {hasMore ? (
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="inline-flex items-center gap-1 text-sm font-semibold text-yunicity-primary"
          >
            {expanded ? PLACE_DETAIL_MOBILE_ABOUT_COLLAPSE : PLACE_DETAIL_MOBILE_ABOUT_EXPAND}
            <ChevronDown className={`h-4 w-4 transition ${expanded ? "rotate-180" : ""}`} aria-hidden />
          </button>
        ) : null}
      </div>
    </section>
  );
}
