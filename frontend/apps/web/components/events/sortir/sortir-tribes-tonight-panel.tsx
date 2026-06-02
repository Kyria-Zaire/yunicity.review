"use client";

import { SortirEmptyState } from "@/components/events/sortir/sortir-empty-state";
import type { SortirTribeTonightItem } from "@yunicity/utils";
import {
  SORTIR_TRIBES_TONIGHT_CTA,
  SORTIR_TRIBES_TONIGHT_EMPTY,
  SORTIR_TRIBES_TONIGHT_EMPTY_CTA,
  SORTIR_TRIBES_TONIGHT_MORE,
  SORTIR_TRIBES_TONIGHT_SUBTITLE,
  SORTIR_TRIBES_TONIGHT_TITLE,
} from "@yunicity/utils";
import { CalendarDays, Plus } from "lucide-react";
import Link from "next/link";

type SortirTribesTonightPanelProps = {
  items: SortirTribeTonightItem[];
};

export function SortirTribesTonightPanel({ items }: SortirTribesTonightPanelProps) {
  return (
    <section className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm">
      <header>
        <h2 className="text-lg font-bold text-neutral-900">{SORTIR_TRIBES_TONIGHT_TITLE}</h2>
        <p className="mt-1 text-sm text-neutral-500">{SORTIR_TRIBES_TONIGHT_SUBTITLE(items.length)}</p>
      </header>

      {items.length === 0 ? (
        <div className="mt-5">
          <SortirEmptyState
            message={SORTIR_TRIBES_TONIGHT_EMPTY}
            ctaLabel={SORTIR_TRIBES_TONIGHT_EMPTY_CTA}
            ctaHref="/tribes"
          />
        </div>
      ) : (
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className="flex items-start gap-3 rounded-xl border border-neutral-100 px-3 py-3 transition hover:border-yunicity-primary/30 hover:bg-neutral-50"
              >
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EEF0FF] text-yunicity-primary">
                  <CalendarDays className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-neutral-900">{item.tribeName}</span>
                  <span className="mt-0.5 block truncate text-sm text-neutral-600">{item.eventTitle}</span>
                  <span className="mt-1 block text-xs text-neutral-500">{item.timeLabel}</span>
                </span>
              </Link>
            </li>
          ))}
          <li>
            <Link
              href="/tribes"
              className="flex h-full min-h-[4.5rem] flex-col items-center justify-center rounded-xl border border-dashed border-yunicity-primary/40 px-3 py-3 text-center text-sm font-semibold text-yunicity-primary transition hover:bg-[#EEF0FF]/60"
            >
              <Plus className="mb-1 h-5 w-5" aria-hidden />
              {SORTIR_TRIBES_TONIGHT_MORE}
            </Link>
          </li>
        </ul>
      )}

      <Link
        href="/tribes"
        className="mt-5 inline-flex w-full items-center justify-center rounded-full border border-yunicity-primary px-4 py-2.5 text-sm font-semibold text-yunicity-primary transition hover:bg-[#EEF0FF]"
      >
        {SORTIR_TRIBES_TONIGHT_CTA}
      </Link>
    </section>
  );
}
