"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { NeighborhoodListCard } from "@yunicity/utils";
import {
  NEIGHBORHOODS_PORTAL_LIST_TITLE,
  NEIGHBORHOODS_PORTAL_MOMENTS_LABEL,
} from "@yunicity/utils";
import { ChevronRight, Sparkles } from "lucide-react";
import Link from "next/link";

type NeighborhoodsListSectionProps = {
  cards: NeighborhoodListCard[];
};

export function NeighborhoodsListSection({ cards }: NeighborhoodsListSectionProps) {
  if (cards.length === 0) return null;

  return (
    <section
      id="neighborhoods-all"
      className="scroll-mt-28 space-y-4"
      aria-labelledby="neighborhoods-all-title"
    >
      <h2 id="neighborhoods-all-title" className="text-xl font-bold text-neutral-900">
        {NEIGHBORHOODS_PORTAL_LIST_TITLE}
      </h2>

      <ul className="grid gap-3 sm:grid-cols-2">
        {cards.map((card) => (
          <li key={card.id}>
            <Link
              href={card.href}
              className="group flex items-center gap-3 rounded-2xl border border-neutral-200/90 bg-white p-3 shadow-sm transition hover:border-neutral-300 hover:shadow-md"
            >
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                <CulturalImage
                  src={card.imageUrl}
                  alt={card.name}
                  placeName={card.name}
                  className="size-full"
                  sizes="64px"
                  showFallbackCaption={false}
                  overlay={false}
                />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-bold text-neutral-900">{card.name}</h3>
                <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-neutral-500">
                  {card.tagline}
                </p>
                <p className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-neutral-600">
                  <Sparkles className="h-3 w-3 text-yunicity-primary" aria-hidden />
                  {NEIGHBORHOODS_PORTAL_MOMENTS_LABEL(card.momentsCount)}
                </p>
              </div>
              <ChevronRight
                className="h-5 w-5 shrink-0 text-neutral-400 transition group-hover:text-yunicity-primary"
                aria-hidden
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
