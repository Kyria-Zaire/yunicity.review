"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { TribePortalCard, TribePortalCategoryId } from "@yunicity/utils";
import {
  TRIBES_PORTAL_LIST_SUBTITLE,
  TRIBES_PORTAL_LIST_TITLE,
  TRIBES_PORTAL_MEMBERS_LABEL,
} from "@yunicity/utils";
import { MapPin } from "lucide-react";
import Link from "next/link";

const CATEGORY_BADGE_TONE: Record<TribePortalCategoryId, string> = {
  culture: "bg-violet-50 text-violet-800 ring-violet-100",
  nature: "bg-emerald-50 text-emerald-800 ring-emerald-100",
  sport: "bg-sky-50 text-sky-800 ring-sky-100",
  gastronomie: "bg-orange-50 text-orange-800 ring-orange-100",
  musique: "bg-pink-50 text-pink-800 ring-pink-100",
  photo: "bg-indigo-50 text-indigo-800 ring-indigo-100",
  education: "bg-amber-50 text-amber-800 ring-amber-100",
  solidarite: "bg-rose-50 text-rose-800 ring-rose-100",
};

const DEFAULT_BADGE_TONE = "bg-neutral-100 text-neutral-700 ring-neutral-200/80";

type TribesListSectionProps = {
  cards: TribePortalCard[];
};

export function TribesListSection({ cards }: TribesListSectionProps) {
  if (cards.length === 0) return null;

  return (
    <section
      id="tribes-all"
      className="scroll-mt-28 space-y-4"
      aria-labelledby="tribes-all-title"
    >
      <header>
        <h2 id="tribes-all-title" className="text-xl font-bold text-neutral-900">
          {TRIBES_PORTAL_LIST_TITLE}
        </h2>
        <p className="mt-1 text-sm text-neutral-600">{TRIBES_PORTAL_LIST_SUBTITLE}</p>
      </header>

      <ul className="space-y-3">
        {cards.map((card) => {
          const badgeTone = card.categoryId
            ? CATEGORY_BADGE_TONE[card.categoryId]
            : DEFAULT_BADGE_TONE;

          return (
            <li key={card.id}>
              <article className="group overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm transition hover:border-neutral-300 hover:shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-stretch">
                  <Link
                    href={card.href}
                    className="relative block h-40 w-full shrink-0 sm:h-auto sm:w-44 md:w-48"
                    tabIndex={-1}
                    aria-hidden
                  >
                    <CulturalImage
                      src={card.imageUrl}
                      alt=""
                      placeName={card.name}
                      className="absolute inset-0 size-full"
                      imageClassName="transition duration-300 group-hover:scale-[1.02]"
                      sizes="(max-width: 640px) 100vw, 192px"
                      showFallbackCaption={false}
                      overlay={false}
                    />
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4 sm:p-5">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${badgeTone}`}
                        >
                          {card.categoryLabel}
                        </span>
                        {card.themeLabels
                          .filter((label) => label !== card.categoryLabel)
                          .map((label) => (
                            <span
                              key={`${card.id}-${label}`}
                              className="inline-flex rounded-full bg-neutral-50 px-2.5 py-0.5 text-[11px] font-medium text-neutral-600 ring-1 ring-neutral-200/80"
                            >
                              {label}
                            </span>
                          ))}
                      </div>

                      <h3 className="mt-2 text-base font-bold text-neutral-900 sm:text-lg">
                        <Link href={card.href} className="hover:text-yunicity-primary">
                          {card.name}
                        </Link>
                      </h3>

                      <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-neutral-600">
                        {card.description}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500">
                        {card.showNeighborhood ? (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 shrink-0 text-yunicity-primary" aria-hidden />
                            {card.neighborhoodLabel}
                          </span>
                        ) : null}
                        {card.memberCount > 0 ? (
                          <span>{TRIBES_PORTAL_MEMBERS_LABEL(card.memberCount)}</span>
                        ) : null}
                      </div>
                    </div>

                    <Link
                      href={card.href}
                      className="inline-flex shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white px-5 py-2.5 text-sm font-semibold text-yunicity-primary transition hover:border-yunicity-primary/30 hover:bg-yunicity-primary-soft sm:self-center"
                    >
                      {card.cta}
                    </Link>
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
