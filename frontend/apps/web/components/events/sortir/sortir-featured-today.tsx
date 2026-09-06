"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { SortirFeaturedTodayResult } from "@yunicity/utils";
import {
  SORTIR_FEATURED_FALLBACK_BODY,
  SORTIR_FEATURED_FALLBACK_TITLE,
  SORTIR_FEATURED_TODAY_CTA,
  SORTIR_FEATURED_TODAY_TITLE,
} from "@yunicity/utils";
import { Clock3, MapPin } from "lucide-react";
import Link from "next/link";

const BADGE_TONE = {
  concert: "bg-violet-600/95",
  tasting: "bg-pink-600/95",
  exhibition: "bg-blue-600/95",
  local: "bg-emerald-600/95",
  default: "bg-yunicity-primary/95",
} as const;

type SortirFeaturedTodayProps = {
  featured: SortirFeaturedTodayResult;
};

export function SortirFeaturedToday({ featured }: SortirFeaturedTodayProps) {
  return (
    <section className="space-y-4" aria-label={SORTIR_FEATURED_TODAY_TITLE}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-neutral-900">{SORTIR_FEATURED_TODAY_TITLE}</h2>
        {featured.kind === "events" ? (
          <a href="#sortir-live-events" className="text-sm font-semibold text-yunicity-primary hover:underline">
            {SORTIR_FEATURED_TODAY_CTA}
          </a>
        ) : null}
      </div>

      {featured.kind === "events" ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.items.map((item) => (
            <li key={item.id}>
              <Link href={item.href} className="group block">
                <article className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-neutral-900 shadow-sm">
                  <CulturalImage
                    src={item.imageUrl}
                    alt=""
                    placeName={item.title}
                    className="absolute inset-0 size-full"
                    sizes="(max-width: 768px) 100vw, 33vw"
                    showFallbackCaption={false}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                  <span
                    className={`absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white ${BADGE_TONE[item.badgeTone]}`}
                  >
                    {item.badge}
                  </span>
                  <div className="absolute inset-x-0 bottom-0 space-y-1 p-4 text-white">
                    <h3 className="line-clamp-2 text-base font-bold leading-snug">{item.title}</h3>
                    <p className="flex items-center gap-1.5 text-xs text-white/85">
                      <Clock3 className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      {item.timeLabel}
                    </p>
                    <p className="flex items-center gap-1.5 text-xs text-white/75">
                      <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      {item.locationLine}
                    </p>
                  </div>
                </article>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-2xl border border-neutral-200/90 bg-gradient-to-br from-[#EEF0FF]/80 to-white p-5 shadow-sm">
          <h3 className="text-base font-bold text-neutral-900">{SORTIR_FEATURED_FALLBACK_TITLE}</h3>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">{SORTIR_FEATURED_FALLBACK_BODY}</p>
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
        </div>
      )}
    </section>
  );
}
