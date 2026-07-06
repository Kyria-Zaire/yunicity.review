"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { ExplorerSuggestionCard } from "@yunicity/utils";
import {
  SEARCH_EXPLORER_SUGGESTIONS_CTA,
  SEARCH_EXPLORER_SUGGESTIONS_TITLE,
  SEARCH_MOBILE_VIEW_ALL,
} from "@yunicity/utils";
import Link from "next/link";

type SearchMobileSuggestionsRailProps = {
  items: ExplorerSuggestionCard[];
  viewAllHref: string;
};

/** Suggestions éditoriales — mêmes cartes que desktop, rail mobile. */
export function SearchMobileSuggestionsRail({
  items,
  viewAllHref,
}: SearchMobileSuggestionsRailProps) {
  if (items.length === 0) return null;

  return (
    <section className="space-y-3" aria-labelledby="search-mobile-suggestions-title">
      <div className="flex items-center justify-between gap-3">
        <h2 id="search-mobile-suggestions-title" className="text-base font-bold text-neutral-900">
          {SEARCH_EXPLORER_SUGGESTIONS_TITLE}
        </h2>
        <Link href={viewAllHref} className="text-sm font-semibold text-yunicity-primary">
          {SEARCH_MOBILE_VIEW_ALL} →
        </Link>
      </div>

      <div className="-mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ul className="flex min-w-max gap-3">
          {items.map((item) => (
            <li key={item.id} className="w-[10.5rem] shrink-0">
              <Link
                href={item.href}
                className="flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-neutral-200">
                  <CulturalImage
                    src={item.imageUrl}
                    alt={item.title}
                    placeName={item.title}
                    className="absolute inset-0"
                    sizes="168px"
                    showFallbackCaption={false}
                    overlay={false}
                  />
                  <span className="absolute left-2 top-2 z-10 rounded-md bg-white/95 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-neutral-800">
                    {item.badge}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-2.5">
                  <h3 className="line-clamp-2 text-sm font-bold text-neutral-900">{item.title}</h3>
                  <p className="mt-0.5 line-clamp-1 text-[11px] text-neutral-500">{item.subtitle}</p>
                  {item.metaLine ? (
                    <p className="mt-1 text-[10px] font-medium text-yunicity-primary">
                      {item.metaLine}
                    </p>
                  ) : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <p className="sr-only">{SEARCH_EXPLORER_SUGGESTIONS_CTA}</p>
    </section>
  );
}
