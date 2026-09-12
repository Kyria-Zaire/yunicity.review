"use client";

import {
  PLACE_DETAIL_DESKTOP_ABOUT_COLLAPSE,
  PLACE_DETAIL_DESKTOP_ABOUT_EXPAND,
  PLACE_DETAIL_DESKTOP_ABOUT_TITLE,
} from "@yunicity/utils";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

type PlaceDesktopDetailAboutProps = {
  preview: string;
  rest: string | null;
};

export function PlaceDesktopDetailAbout({ preview, rest }: PlaceDesktopDetailAboutProps) {
  const [expanded, setExpanded] = useState(false);
  const hasMore = Boolean(rest?.trim());

  if (!preview && !rest) return null;

  return (
    <section className="space-y-3" aria-labelledby="place-desktop-about-title" data-place-desktop-detail-about="">
      <h2 id="place-desktop-about-title" className="text-lg font-bold text-neutral-900">
        {PLACE_DETAIL_DESKTOP_ABOUT_TITLE}
      </h2>
      <div className="space-y-3 text-sm leading-relaxed text-neutral-700">
        <p>{preview}</p>
        {hasMore && expanded ? <p className="whitespace-pre-line">{rest}</p> : null}
      </div>
      {hasMore ? (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="inline-flex items-center gap-1 text-sm font-semibold text-yunicity-primary hover:underline"
        >
          {expanded ? PLACE_DETAIL_DESKTOP_ABOUT_COLLAPSE : PLACE_DETAIL_DESKTOP_ABOUT_EXPAND}
          <ChevronDown className={`h-4 w-4 transition ${expanded ? "rotate-180" : ""}`} aria-hidden />
        </button>
      ) : null}
    </section>
  );
}
