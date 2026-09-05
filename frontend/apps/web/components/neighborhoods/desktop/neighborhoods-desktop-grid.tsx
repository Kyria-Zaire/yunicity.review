"use client";

import { CulturalImage, CulturalImageCredit } from "@/components/culture/cultural-image";
import type { NeighborhoodsDesktopGridCard, NeighborhoodsDesktopTag } from "@yunicity/utils";
import {
  resolveNeighborhoodsDesktopImageCredit,
  NEIGHBORHOODS_DESKTOP_EXPLORE,
  NEIGHBORHOODS_DESKTOP_GRID_TITLE,
  NEIGHBORHOODS_DESKTOP_SEE_ALL,
} from "@yunicity/utils";
import { Bookmark, CalendarDays, ChevronRight } from "lucide-react";
import Link from "next/link";

const TAG_CLASS: Record<NeighborhoodsDesktopTag["tone"], string> = {
  peach: "bg-orange-100 text-orange-800",
  purple: "bg-violet-100 text-violet-800",
  yellow: "bg-amber-100 text-amber-900",
  blue: "bg-sky-100 text-sky-800",
  indigo: "bg-indigo-100 text-indigo-800",
  green: "bg-emerald-100 text-emerald-800",
  slate: "bg-slate-100 text-slate-700",
};

type NeighborhoodsDesktopGridProps = {
  cards: NeighborhoodsDesktopGridCard[];
  totalCount: number;
  followedSlugs: Set<string>;
  onToggleFollow: (slug: string) => void;
  onSeeAll: () => void;
};

export function NeighborhoodsDesktopGrid({
  cards,
  totalCount,
  followedSlugs,
  onToggleFollow,
  onSeeAll,
}: NeighborhoodsDesktopGridProps) {
  if (cards.length === 0) return null;

  return (
    <section className="space-y-4" data-neighborhoods-desktop-grid="" id="neighborhoods-desktop-grid">
      <div className="flex items-end justify-between gap-3">
        <h2 className="text-xl font-bold text-neutral-900">{NEIGHBORHOODS_DESKTOP_GRID_TITLE}</h2>
        <button
          type="button"
          onClick={onSeeAll}
          className="inline-flex items-center gap-1 text-sm font-semibold text-yunicity-primary hover:underline"
        >
          {NEIGHBORHOODS_DESKTOP_SEE_ALL(totalCount)}
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const followed = followedSlugs.has(card.slug);
          const imageCredit = resolveNeighborhoodsDesktopImageCredit({ slug: card.slug });
          return (
            <li key={card.id}>
              <article className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm">
                <Link href={card.href} className="relative block aspect-[3/2] overflow-hidden bg-neutral-100">
                  <div className="absolute inset-0">
                    <CulturalImage
                      src={card.imageUrl}
                      alt={card.name}
                      placeName={card.name}
                      className="h-full w-full"
                      imageClassName="object-cover transition duration-300 hover:scale-[1.03]"
                      sizes="240px"
                      showFallbackCaption
                      fallbackLabel="Quartier"
                      overlay={false}
                    />
                  </div>
                  {imageCredit ? (
                    <CulturalImageCredit variant="compact" editorialCredit={imageCredit} />
                  ) : null}
                </Link>
                <div className="space-y-3 p-3.5">
                  <div>
                    <h3 className="text-base font-bold text-neutral-900">
                      <Link href={card.href} className="hover:underline">
                        {card.name}
                      </Link>
                    </h3>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {card.tags.map((tag) => (
                        <span
                          key={tag.id}
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${TAG_CLASS[tag.tone]}`}
                        >
                          {tag.label}
                        </span>
                      ))}
                    </div>
                  </div>

                  {card.eventLine ? (
                    <p className="flex items-start gap-1.5 text-xs leading-relaxed text-neutral-600">
                      <CalendarDays className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400" aria-hidden />
                      <span className="line-clamp-2">{card.eventLine}</span>
                    </p>
                  ) : (
                    <p className="h-8" aria-hidden />
                  )}

                  <div className="flex items-center gap-2">
                    <Link
                      href={card.href}
                      className="inline-flex min-h-10 flex-1 items-center justify-center rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50"
                    >
                      {NEIGHBORHOODS_DESKTOP_EXPLORE}
                    </Link>
                    <button
                      type="button"
                      aria-pressed={followed}
                      aria-label={followed ? "Ne plus suivre" : "Suivre"}
                      onClick={() => onToggleFollow(card.slug)}
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-neutral-200 text-neutral-600 transition hover:bg-neutral-50"
                    >
                      <Bookmark
                        className={`h-4 w-4 ${followed ? "fill-yunicity-primary text-yunicity-primary" : ""}`}
                        aria-hidden
                      />
                    </button>
                  </div>
                </div>
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
