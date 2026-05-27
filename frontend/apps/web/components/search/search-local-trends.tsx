"use client";

import { LocalTrendCard } from "@/components/search/local-trend-card";
import type { LocalTrendItem } from "@yunicity/utils";
import { SEARCH_EXPLORER_TRENDS_SUBTITLE, SEARCH_EXPLORER_TRENDS_TITLE, SEARCH_TRENDS_EMPTY } from "@yunicity/utils";

export function SearchLocalTrends({ items }: { items: LocalTrendItem[] }) {
  return (
    <section className="space-y-3" aria-labelledby="search-trends-title">
      <div>
        <h2 id="search-trends-title" className="text-base font-semibold text-neutral-900">
          {SEARCH_EXPLORER_TRENDS_TITLE}
        </h2>
        <p className="mt-1 text-sm text-neutral-500">{SEARCH_EXPLORER_TRENDS_SUBTITLE}</p>
      </div>
      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/60 px-4 py-5 text-sm text-neutral-500">
          {SEARCH_TRENDS_EMPTY}
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <LocalTrendCard item={item} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
