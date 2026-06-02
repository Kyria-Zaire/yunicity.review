"use client";

import { SortirEmptyState } from "@/components/events/sortir/sortir-empty-state";
import { CulturalImage } from "@/components/culture/cultural-image";
import type { SortirForYouCard } from "@yunicity/utils";
import {
  SORTIR_FOR_YOU_CTA,
  SORTIR_FOR_YOU_EMPTY,
  SORTIR_FOR_YOU_EMPTY_CTA,
  SORTIR_FOR_YOU_SUBTITLE,
  SORTIR_FOR_YOU_TITLE,
} from "@yunicity/utils";
import { Clock3, MapPin, Plus, Users } from "lucide-react";
import Link from "next/link";

type SortirForYouPanelProps = {
  card: SortirForYouCard | null;
};

export function SortirForYouPanel({ card }: SortirForYouPanelProps) {
  return (
    <section className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm">
      <header>
        <h2 className="text-lg font-bold text-neutral-900">{SORTIR_FOR_YOU_TITLE}</h2>
        <p className="mt-1 text-sm text-neutral-500">{SORTIR_FOR_YOU_SUBTITLE}</p>
      </header>

      {!card ? (
        <div className="mt-5">
          <SortirEmptyState
            message={SORTIR_FOR_YOU_EMPTY}
            ctaLabel={SORTIR_FOR_YOU_EMPTY_CTA}
            ctaHref="/settings"
          />
        </div>
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-[7.5rem_minmax(0,1fr)]">
          <div className="relative aspect-square overflow-hidden rounded-xl bg-neutral-100">
            <CulturalImage
              src={card.imageUrl}
              alt=""
              placeName={card.title}
              className="size-full"
              sizes="120px"
              showFallbackCaption={false}
            />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-neutral-900">{card.title}</h3>
            <p className="mt-1 text-sm text-neutral-600">{card.subtitle}</p>
            <ul className="mt-3 space-y-1.5 text-sm text-neutral-600">
              <li className="flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-yunicity-primary" aria-hidden />
                {card.timeLabel}
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-yunicity-primary" aria-hidden />
                {card.locationLine}
              </li>
              {card.spotsLine ? (
                <li className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-yunicity-primary" aria-hidden />
                  {card.spotsLine}
                </li>
              ) : null}
            </ul>
            <Link
              href={card.href}
              className="mt-4 inline-flex rounded-full border border-yunicity-primary px-4 py-2 text-sm font-semibold text-yunicity-primary transition hover:bg-[#EEF0FF]"
            >
              {SORTIR_FOR_YOU_CTA}
            </Link>
          </div>
        </div>
      )}

      {card && card.interestTags.length > 0 ? (
        <ul className="mt-5 flex flex-wrap gap-2">
          {card.interestTags.map((tag) => (
            <li
              key={tag}
              className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-700"
            >
              {tag}
            </li>
          ))}
          <li>
            <Link
              href="/settings"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-neutral-300 text-neutral-500 hover:border-yunicity-primary hover:text-yunicity-primary"
              aria-label="Gérer vos centres d'intérêt"
            >
              <Plus className="h-4 w-4" aria-hidden />
            </Link>
          </li>
        </ul>
      ) : null}
    </section>
  );
}
