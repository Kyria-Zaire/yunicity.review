"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type {
  SortirDesktopAgendaRow,
  SortirDesktopSoonCard,
  SortirDesktopWeekendCard,
} from "@yunicity/utils";
import {
  MY_AGENDA_HREF,
  SORTIR_DESKTOP_AGENDA_COUNT,
  SORTIR_DESKTOP_AGENDA_CTA,
  SORTIR_DESKTOP_AGENDA_TITLE,
  SORTIR_DESKTOP_EXPLORE_MAP,
  SORTIR_DESKTOP_EXPLORE_MAP_BODY,
  SORTIR_DESKTOP_EXPLORE_NEIGHBORHOOD,
  SORTIR_DESKTOP_EXPLORE_NEIGHBORHOOD_BODY,
  SORTIR_DESKTOP_EXPLORE_PASSPORT,
  SORTIR_DESKTOP_EXPLORE_PASSPORT_BODY,
  SORTIR_DESKTOP_SOON_CTA,
  SORTIR_DESKTOP_SOON_TITLE,
  SORTIR_DESKTOP_WEEKEND_CTA,
  SORTIR_DESKTOP_WEEKEND_TITLE,
  sortirNeighborhoodsHref,
} from "@yunicity/utils";
import { Bookmark, ChevronRight, Clock3, Compass, MapPin, Ticket } from "lucide-react";
import Link from "next/link";

type SortirDesktopRightRailProps = {
  city: string;
  agendaRows: SortirDesktopAgendaRow[];
  savedCount: number;
  soonCard: SortirDesktopSoonCard | null;
  weekendCard: SortirDesktopWeekendCard | null;
};

export function SortirDesktopRightRail({
  city,
  agendaRows,
  savedCount,
  soonCard,
  weekendCard,
}: SortirDesktopRightRailProps) {
  return (
    <aside className="sortir-desktop-right-rail" aria-label="Agenda et découvertes" data-sortir-desktop-right-rail="">
      <section className="feed-desktop-surface mb-4 overflow-hidden" aria-labelledby="sortir-agenda-title">
        <div className="flex items-start gap-2 border-b border-neutral-100 px-4 py-3">
          <Bookmark className="mt-0.5 h-4 w-4 text-yunicity-primary" aria-hidden />
          <div>
            <h2 id="sortir-agenda-title" className="text-sm font-bold text-neutral-900">
              {SORTIR_DESKTOP_AGENDA_TITLE}
            </h2>
            <p className="text-xs text-neutral-500">{SORTIR_DESKTOP_AGENDA_COUNT(savedCount)}</p>
          </div>
        </div>

        {agendaRows.length > 0 ? (
          <ul className="divide-y divide-neutral-100">
            {agendaRows.map((row) => (
              <li key={row.id}>
                <Link href={row.href} className="flex gap-3 px-4 py-3 transition hover:bg-neutral-50">
                  <div className="w-12 shrink-0 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">{row.weekdayLabel}</p>
                    <p className="text-lg font-bold leading-none text-neutral-900">{row.dayLabel}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">{row.monthLabel}</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-semibold text-neutral-900">{row.title}</p>
                    <p className="mt-0.5 text-xs text-neutral-500">
                      {row.timeLabel} · {row.placeLabel}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-4 py-4 text-sm text-neutral-500">Enregistrez une sortie pour la retrouver ici.</p>
        )}

        <div className="border-t border-neutral-100 p-3">
          <Link
            href={MY_AGENDA_HREF}
            className="inline-flex w-full items-center justify-center gap-1 rounded-xl border border-neutral-200 px-3 py-2.5 text-sm font-semibold text-yunicity-primary transition hover:border-yunicity-primary/30 hover:bg-[#EEF0FF]"
          >
            {SORTIR_DESKTOP_AGENDA_CTA}
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </section>

      {soonCard ? (
        <section className="feed-desktop-surface mb-4 overflow-hidden" aria-labelledby="sortir-soon-title">
          <div className="flex items-center gap-2 border-b border-neutral-100 px-4 py-3">
            <Clock3 className="h-4 w-4 text-yunicity-primary" aria-hidden />
            <h2 id="sortir-soon-title" className="text-sm font-bold text-neutral-900">
              {SORTIR_DESKTOP_SOON_TITLE}
            </h2>
          </div>
          <div className="flex gap-3 p-4">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-neutral-200">
              <CulturalImage
                src={soonCard.imageUrl}
                alt=""
                placeName={soonCard.title}
                className="absolute inset-0 size-full"
                sizes="64px"
                showFallbackCaption={false}
              />
            </div>
            <div className="min-w-0 flex-1">
              <span className="inline-flex rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-orange-700">
                {soonCard.relativeLabel}
              </span>
              <p className="mt-1 line-clamp-2 text-sm font-semibold text-neutral-900">{soonCard.title}</p>
              <p className="mt-0.5 text-xs text-neutral-500">
                {soonCard.timeLabel} · {soonCard.placeLabel}
              </p>
              <Link
                href={soonCard.href}
                className="mt-2 inline-flex rounded-full border border-neutral-200 px-3 py-1 text-xs font-semibold text-yunicity-primary transition hover:border-yunicity-primary/30"
              >
                {SORTIR_DESKTOP_SOON_CTA}
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      <section className="feed-desktop-surface mb-4 overflow-hidden" aria-label="Explorer autrement">
        <ul className="divide-y divide-neutral-100">
          <li>
            <Link href={`/map?city=${encodeURIComponent(city)}`} className="flex items-center gap-3 px-4 py-3 transition hover:bg-neutral-50">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EEF0FF] text-yunicity-primary">
                <MapPin className="h-4 w-4" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-neutral-900">{SORTIR_DESKTOP_EXPLORE_MAP}</span>
                <span className="block text-xs text-neutral-500">{SORTIR_DESKTOP_EXPLORE_MAP_BODY}</span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
            </Link>
          </li>
          <li>
            <Link href={sortirNeighborhoodsHref(city)} className="flex items-center gap-3 px-4 py-3 transition hover:bg-neutral-50">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-50 text-orange-600">
                <Compass className="h-4 w-4" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-neutral-900">{SORTIR_DESKTOP_EXPLORE_NEIGHBORHOOD}</span>
                <span className="block text-xs text-neutral-500">{SORTIR_DESKTOP_EXPLORE_NEIGHBORHOOD_BODY}</span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
            </Link>
          </li>
          <li>
            <Link href="/passport" className="flex items-center gap-3 px-4 py-3 transition hover:bg-neutral-50">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-50 text-violet-600">
                <Ticket className="h-4 w-4" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-neutral-900">{SORTIR_DESKTOP_EXPLORE_PASSPORT}</span>
                <span className="block text-xs text-neutral-500">{SORTIR_DESKTOP_EXPLORE_PASSPORT_BODY}</span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
            </Link>
          </li>
        </ul>
      </section>

      {weekendCard ? (
        <section className="feed-desktop-surface overflow-hidden" aria-labelledby="sortir-weekend-title">
          <h2 id="sortir-weekend-title" className="border-b border-neutral-100 px-4 py-3 text-sm font-bold text-neutral-900">
            {SORTIR_DESKTOP_WEEKEND_TITLE}
          </h2>
          <div className="p-4">
            <div className="flex gap-3">
              <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-neutral-200">
                <CulturalImage
                  src={weekendCard.imageUrl}
                  alt=""
                  placeName={weekendCard.title}
                  className="absolute inset-0 size-full"
                  sizes="96px"
                  showFallbackCaption={false}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-semibold text-neutral-900">{weekendCard.title}</p>
                <p className="mt-0.5 text-xs font-semibold text-yunicity-primary">{weekendCard.dayLabel}</p>
              </div>
            </div>
            <Link
              href={weekendCard.href}
              className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-yunicity-primary/40 px-3 py-2.5 text-sm font-semibold text-yunicity-primary transition hover:border-yunicity-primary hover:bg-[#EEF0FF]"
            >
              {SORTIR_DESKTOP_WEEKEND_CTA}
            </Link>
          </div>
        </section>
      ) : null}
    </aside>
  );
}
