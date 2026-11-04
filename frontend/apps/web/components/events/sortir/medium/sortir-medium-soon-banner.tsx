"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { SortirDesktopSoonCard } from "@yunicity/utils";
import { SORTIR_DESKTOP_SOON_CTA, SORTIR_DESKTOP_SOON_TITLE } from "@yunicity/utils";
import { Clock3 } from "lucide-react";
import Link from "next/link";

type SortirMediumSoonBannerProps = {
  soonCard: SortirDesktopSoonCard;
};

export function SortirMediumSoonBanner({ soonCard }: SortirMediumSoonBannerProps) {
  return (
    <section
      className="sortir-medium-soon feed-desktop-surface overflow-hidden rounded-2xl"
      aria-labelledby="sortir-medium-soon-title"
      data-sortir-medium-soon=""
    >
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex shrink-0 items-center gap-2">
            <Clock3 className="h-4 w-4 text-yunicity-primary" aria-hidden />
            <h2 id="sortir-medium-soon-title" className="text-sm font-bold text-neutral-900">
              {SORTIR_DESKTOP_SOON_TITLE}
            </h2>
          </div>
          <span className="inline-flex shrink-0 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-orange-700">
            {soonCard.relativeLabel}
          </span>
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-neutral-200">
            <CulturalImage
              src={soonCard.imageUrl}
              alt=""
              placeName={soonCard.title}
              className="absolute inset-0 size-full"
              sizes="56px"
              showFallbackCaption={false}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-sm font-semibold text-neutral-900">{soonCard.title}</p>
            <p className="mt-0.5 text-xs text-neutral-500">
              {soonCard.timeLabel} · {soonCard.placeLabel}
            </p>
          </div>
        </div>

        <Link
          href={soonCard.href}
          className="inline-flex shrink-0 items-center justify-center self-start rounded-full border border-neutral-200 px-4 py-2 text-sm font-semibold text-yunicity-primary transition hover:border-yunicity-primary/30 hover:bg-[#EEF0FF] sm:self-center"
        >
          {SORTIR_DESKTOP_SOON_CTA}
        </Link>
      </div>
    </section>
  );
}
