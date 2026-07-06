"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { TribesFeaturedCard } from "@yunicity/utils";
import {
  TRIBES_MOBILE_CARD_MENU_ARIA,
  TRIBES_MOBILE_SUGGESTIONS_EMPTY,
  TRIBES_MOBILE_SUGGESTIONS_TITLE,
  TRIBES_MOBILE_VIEW_ALL,
  TRIBE_JOIN_CTA,
  TRIBES_PORTAL_MEMBERS_LABEL,
  tribeDiscoveryTheme,
} from "@yunicity/utils";
import { BadgeCheck, ChevronRight, MoreVertical } from "lucide-react";
import Link from "next/link";

const JOIN_TONE: Record<string, string> = {
  sport_local: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
  photography: "bg-pink-50 text-pink-700 hover:bg-pink-100",
  music: "bg-violet-50 text-violet-700 hover:bg-violet-100",
  cafe_culture: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100",
  students: "bg-sky-50 text-sky-700 hover:bg-sky-100",
  volunteering: "bg-amber-50 text-amber-800 hover:bg-amber-100",
  association: "bg-amber-50 text-amber-800 hover:bg-amber-100",
  other: "bg-neutral-100 text-neutral-800 hover:bg-neutral-200",
};

type TribesMobileSuggestionsRailProps = {
  cards: TribesFeaturedCard[];
  showAll: boolean;
  onShowAll: () => void;
};

/** Carrousel « Suggestions pour toi » mobile (MOBILE-TRIBES-01). */
export function TribesMobileSuggestionsRail({
  cards,
  showAll,
  onShowAll,
}: TribesMobileSuggestionsRailProps) {
  const visibleCards = showAll ? cards : cards.slice(0, 4);

  return (
    <section id="tribes-mobile-suggestions" className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-neutral-900">{TRIBES_MOBILE_SUGGESTIONS_TITLE}</h2>
        {cards.length > 4 && !showAll ? (
          <button
            type="button"
            onClick={onShowAll}
            className="inline-flex items-center gap-0.5 text-sm font-semibold text-yunicity-primary"
          >
            {TRIBES_MOBILE_VIEW_ALL}
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
      </div>

      {visibleCards.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-neutral-200 bg-white px-4 py-8 text-center text-sm text-neutral-600">
          {TRIBES_MOBILE_SUGGESTIONS_EMPTY}
        </p>
      ) : (
        <div className="-mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <ul className="flex min-w-max gap-3">
            {visibleCards.map((card) => (
              <li key={card.id} className="w-[11.5rem] shrink-0">
                <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm">
                  <div className="relative aspect-[4/3] bg-neutral-100">
                    <CulturalImage
                      src={card.imageUrl}
                      alt=""
                      placeName={card.name}
                      className="absolute inset-0 size-full"
                      sizes="184px"
                      showFallbackCaption={false}
                      overlay={false}
                    />
                    <Link
                      href={card.href}
                      aria-label={TRIBES_MOBILE_CARD_MENU_ARIA}
                      className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm"
                    >
                      <MoreVertical className="h-3.5 w-3.5" aria-hidden />
                    </Link>
                  </div>

                  <div className="flex flex-1 flex-col p-3">
                    <div className="flex items-start gap-1">
                      <h3 className="line-clamp-1 flex-1 text-sm font-bold text-neutral-900">
                        {card.name}
                      </h3>
                      {card.badgeVariant === "featured" ? (
                        <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-yunicity-primary" aria-hidden />
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-xs text-neutral-500">
                      {tribeDiscoveryTheme(card.iconKey).badge} ·{" "}
                      {TRIBES_PORTAL_MEMBERS_LABEL(card.memberCount)}
                    </p>
                    <Link
                      href={card.href}
                      className={`mt-auto flex w-full items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold transition ${
                        JOIN_TONE[card.iconKey] ?? JOIN_TONE.other
                      }`}
                    >
                      {TRIBE_JOIN_CTA}
                    </Link>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
