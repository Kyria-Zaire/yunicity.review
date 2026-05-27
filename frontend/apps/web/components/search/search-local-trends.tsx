"use client";

import type { LocalTrendItem } from "@yunicity/utils";
import { SEARCH_EXPLORER_TRENDS_SUBTITLE, SEARCH_EXPLORER_TRENDS_TITLE } from "@yunicity/utils";
import Link from "next/link";

export function SearchLocalTrends({ items }: { items: LocalTrendItem[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3" aria-labelledby="search-trends-title">
      <div>
        <h2 id="search-trends-title" className="text-base font-semibold text-neutral-900">
          {SEARCH_EXPLORER_TRENDS_TITLE}
        </h2>
        <p className="mt-1 text-sm text-neutral-500">{SEARCH_EXPLORER_TRENDS_SUBTITLE}</p>
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className="flex flex-col gap-0.5 rounded-xl border border-neutral-100 bg-neutral-50/80 px-4 py-3 transition hover:border-yunicity-primary/20 hover:bg-white"
            >
              <span className="font-medium text-neutral-900">{item.title}</span>
              <span className="text-xs text-neutral-500">{item.subtitle}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
