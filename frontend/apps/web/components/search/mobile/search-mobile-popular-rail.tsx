"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { SearchMobilePopularPill } from "@yunicity/utils";
import {
  SEARCH_MOBILE_POPULAR_TITLE,
  SEARCH_MOBILE_VIEW_ALL,
} from "@yunicity/utils";
import Link from "next/link";

type SearchMobilePopularRailProps = {
  items: SearchMobilePopularPill[];
  onViewAll?: () => void;
};

/** Rail recherches populaires mobile (MOBILE-SEARCH-01). */
export function SearchMobilePopularRail({ items, onViewAll }: SearchMobilePopularRailProps) {
  if (items.length === 0) return null;

  return (
    <section className="space-y-3" aria-label={SEARCH_MOBILE_POPULAR_TITLE}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-neutral-900">{SEARCH_MOBILE_POPULAR_TITLE}</h2>
        {onViewAll ? (
          <button
            type="button"
            onClick={onViewAll}
            className="text-sm font-semibold text-yunicity-primary"
          >
            {SEARCH_MOBILE_VIEW_ALL}
          </button>
        ) : null}
      </div>

      <div className="-mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ul className="flex min-w-max gap-2.5">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className="inline-flex items-center gap-2 rounded-full border border-neutral-200/90 bg-white py-1.5 pl-1.5 pr-4 shadow-sm"
              >
                <span className="relative h-8 w-8 overflow-hidden rounded-full bg-neutral-100">
                  {item.imageUrl ? (
                    <CulturalImage
                      src={item.imageUrl}
                      alt=""
                      placeName={item.label}
                      className="size-full object-cover"
                      sizes="32px"
                      showFallbackCaption={false}
                      overlay={false}
                    />
                  ) : (
                    <span className="flex size-full items-center justify-center text-[10px] font-bold text-neutral-400">
                      {item.label.charAt(0).toUpperCase()}
                    </span>
                  )}
                </span>
                <span className="text-sm font-semibold text-neutral-800">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
