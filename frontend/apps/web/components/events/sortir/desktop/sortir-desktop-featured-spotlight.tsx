"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { SortirLiveEventCard } from "@yunicity/utils";
import {
  SORTIR_DESKTOP_FEATURED_BADGE,
  SORTIR_DESKTOP_FEATURED_CTA,
  SORTIR_DESKTOP_FEATURED_MAP,
  SORTIR_DESKTOP_FEATURED_SAVE,
  SORTIR_DESKTOP_SAVE_SOON,
  SORTIR_FEATURED_FALLBACK_BODY,
  SORTIR_FEATURED_FALLBACK_TITLE,
} from "@yunicity/utils";
import type { SortirFeaturedTodayResult } from "@yunicity/utils";
import { Bookmark, CalendarDays, MapPin } from "lucide-react";
import Link from "next/link";

const BADGE_TONE = {
  concert: "bg-violet-100 text-violet-700",
  tasting: "bg-pink-100 text-pink-700",
  exhibition: "bg-blue-100 text-blue-700",
  local: "bg-emerald-100 text-emerald-700",
  default: "bg-orange-100 text-orange-700",
} as const;

type SortirDesktopFeaturedSpotlightProps = {
  featured: SortirFeaturedTodayResult;
};

function FeaturedSpotlightCard({ item }: { item: SortirLiveEventCard }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm">
      <div className="grid md:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <div className="relative min-h-[220px] bg-neutral-900">
          <CulturalImage
            src={item.imageUrl}
            alt=""
            placeName={item.title}
            className="absolute inset-0 size-full"
            sizes="(max-width: 1280px) 100vw, 560px"
            showFallbackCaption={false}
          />
        </div>
        <div className="flex flex-col justify-center gap-4 p-5 sm:p-6">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-orange-700">
              {SORTIR_DESKTOP_FEATURED_BADGE}
            </span>
            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${BADGE_TONE[item.badgeTone]}`}>
              {item.badge}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-bold leading-snug text-neutral-900">{item.title}</h2>
            <p className="mt-2 flex items-center gap-2 text-sm text-neutral-600">
              <CalendarDays className="h-4 w-4 shrink-0 text-orange-500" aria-hidden />
              {item.timeLabel}
            </p>
            <p className="mt-1 flex items-center gap-2 text-sm text-neutral-600">
              <MapPin className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
              {item.locationLine}
            </p>
            {item.subtitle ? (
              <p className="mt-3 text-sm leading-relaxed text-neutral-600">{item.subtitle}</p>
            ) : null}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Link
              href={item.href}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-yunicity-primary px-4 text-sm font-semibold text-white transition hover:bg-yunicity-primary-hover sm:w-auto"
            >
              {SORTIR_DESKTOP_FEATURED_CTA}
            </Link>
            <button
              type="button"
              disabled
              title={SORTIR_DESKTOP_SAVE_SOON}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 px-4 text-sm font-semibold text-neutral-700 sm:w-auto"
            >
              <Bookmark className="h-4 w-4" aria-hidden />
              {SORTIR_DESKTOP_FEATURED_SAVE}
            </button>
          </div>
          <Link
            href={`/map?focus=${encodeURIComponent(item.id)}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-yunicity-primary hover:underline"
          >
            <MapPin className="h-4 w-4" aria-hidden />
            {SORTIR_DESKTOP_FEATURED_MAP}
          </Link>
        </div>
      </div>
    </article>
  );
}

export function SortirDesktopFeaturedSpotlight({ featured }: SortirDesktopFeaturedSpotlightProps) {
  if (featured.kind === "events" && featured.items.length > 0) {
    return <FeaturedSpotlightCard item={featured.items[0]!} />;
  }

  return (
    <div className="rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-neutral-900">{SORTIR_FEATURED_FALLBACK_TITLE}</h2>
      <p className="mt-2 text-sm leading-relaxed text-neutral-600">{SORTIR_FEATURED_FALLBACK_BODY}</p>
      {featured.kind === "fallback" ? (
        <ul className="mt-4 flex flex-wrap gap-2">
          {featured.links.map((link) => (
            <li key={link.id}>
              <Link
                href={link.href}
                className="inline-flex rounded-full border border-yunicity-primary/30 bg-white px-4 py-2 text-sm font-semibold text-yunicity-primary transition hover:bg-[#EEF0FF]"
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
