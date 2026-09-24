"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { SortirFeaturedTodayResult, SortirLiveEventCard } from "@yunicity/utils";
import {
  SORTIR_DESKTOP_FEATURED_BADGE,
  SORTIR_DESKTOP_FEATURED_CTA,
  SORTIR_DESKTOP_FEATURED_SAVE,
  SORTIR_DESKTOP_SAVE_SOON,
  SORTIR_FEATURED_FALLBACK_BODY,
  SORTIR_FEATURED_FALLBACK_TITLE,
  SORTIR_MOBILE_FEATURED_MAP,
} from "@yunicity/utils";
import { Bookmark, CalendarDays, MapPin } from "lucide-react";
import Link from "next/link";

const BADGE_TONE = {
  concert: "bg-violet-100 text-violet-700",
  tasting: "bg-pink-100 text-pink-700",
  exhibition: "bg-blue-100 text-blue-700",
  local: "bg-emerald-100 text-emerald-700",
  default: "bg-orange-100 text-orange-700",
} as const;

type SortirMobileFeaturedSpotlightProps = {
  featured: SortirFeaturedTodayResult;
};

function FeaturedCard({ item }: { item: SortirLiveEventCard }) {
  return (
    <article
      className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm"
      data-sortir-mobile-featured=""
    >
      <div className="relative aspect-[16/10] bg-neutral-900">
        <CulturalImage
          src={item.imageUrl}
          alt=""
          placeName={item.title}
          className="absolute inset-0 size-full"
          sizes="100vw"
          showFallbackCaption={false}
        />
      </div>
      <div className="space-y-3 p-4">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-amber-200 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-neutral-900">
            {SORTIR_DESKTOP_FEATURED_BADGE}
          </span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${BADGE_TONE[item.badgeTone]}`}
          >
            {item.badge}
          </span>
        </div>
        <div>
          <h2 className="text-lg font-bold leading-snug text-neutral-900">{item.title}</h2>
          <p className="mt-2 flex items-center gap-2 text-sm text-neutral-600">
            <CalendarDays className="h-4 w-4 shrink-0 text-orange-500" aria-hidden />
            {item.timeLabel}
          </p>
          <p className="mt-1 flex items-center gap-2 text-sm text-neutral-600">
            <MapPin className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
            {item.locationLine}
          </p>
          {item.subtitle ? (
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">{item.subtitle}</p>
          ) : null}
        </div>
        <Link
          href={item.href}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-yunicity-primary px-4 text-sm font-semibold text-white"
        >
          {SORTIR_DESKTOP_FEATURED_CTA}
        </Link>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled
            title={SORTIR_DESKTOP_SAVE_SOON}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-neutral-200 px-3 text-sm font-semibold text-neutral-800"
          >
            <Bookmark className="h-4 w-4" aria-hidden />
            {SORTIR_DESKTOP_FEATURED_SAVE}
          </button>
          <Link
            href={`/map?focus=${encodeURIComponent(item.id)}`}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-neutral-200 px-3 text-sm font-semibold text-yunicity-primary"
          >
            <MapPin className="h-4 w-4" aria-hidden />
            {SORTIR_MOBILE_FEATURED_MAP}
          </Link>
        </div>
      </div>
    </article>
  );
}

export function SortirMobileFeaturedSpotlight({ featured }: SortirMobileFeaturedSpotlightProps) {
  if (featured.kind === "events" && featured.items.length > 0) {
    return <FeaturedCard item={featured.items[0]!} />;
  }

  return (
    <div className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm" data-sortir-mobile-featured="">
      <h2 className="text-base font-bold text-neutral-900">{SORTIR_FEATURED_FALLBACK_TITLE}</h2>
      <p className="mt-2 text-sm leading-relaxed text-neutral-600">{SORTIR_FEATURED_FALLBACK_BODY}</p>
      {featured.kind === "fallback" ? (
        <ul className="mt-4 flex flex-wrap gap-2">
          {featured.links.map((link) => (
            <li key={link.id}>
              <Link
                href={link.href}
                className="inline-flex rounded-full border border-yunicity-primary/30 bg-white px-4 py-2 text-sm font-semibold text-yunicity-primary"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
