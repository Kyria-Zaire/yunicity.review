"use client";

import {
  SORTIR_DESKTOP_AGENDA_COUNT,
  SORTIR_DESKTOP_AGENDA_CTA,
  SORTIR_DESKTOP_AGENDA_TITLE,
  MY_AGENDA_HREF,
  type SortirDesktopAgendaRow,
} from "@yunicity/utils";
import { Bookmark, ChevronRight } from "lucide-react";
import Link from "next/link";

type SortirMediumAgendaStripProps = {
  agendaRows: SortirDesktopAgendaRow[];
  savedCount: number;
};

export function SortirMediumAgendaStrip({ agendaRows, savedCount }: SortirMediumAgendaStripProps) {
  return (
    <section
      className="sortir-medium-agenda feed-desktop-surface overflow-hidden rounded-2xl"
      aria-labelledby="sortir-medium-agenda-title"
      data-sortir-medium-agenda=""
    >
      <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center">
        <div className="flex shrink-0 items-start gap-2.5">
          <Bookmark className="mt-0.5 h-4 w-4 text-yunicity-primary" aria-hidden />
          <div>
            <h2 id="sortir-medium-agenda-title" className="text-sm font-bold text-neutral-900">
              {SORTIR_DESKTOP_AGENDA_TITLE}
            </h2>
            <p className="text-xs text-neutral-500">{SORTIR_DESKTOP_AGENDA_COUNT(savedCount)}</p>
          </div>
        </div>

        {agendaRows.length > 0 ? (
          <ul className="flex min-w-0 flex-1 flex-col divide-y divide-neutral-100 sm:flex-row sm:divide-x sm:divide-y-0">
            {agendaRows.map((row) => (
              <li key={row.id} className="min-w-0 flex-1 sm:px-4 first:sm:pl-0 last:sm:pr-0">
                <Link href={row.href} className="flex gap-3 py-2 transition hover:opacity-90 sm:py-0">
                  <div className="w-11 shrink-0 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-yunicity-primary">{row.weekdayLabel}</p>
                    <p className="text-xl font-bold leading-none text-neutral-900">{row.dayLabel}</p>
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
          <p className="min-w-0 flex-1 text-sm text-neutral-500">Enregistrez une sortie pour la retrouver ici.</p>
        )}

        <Link
          href={MY_AGENDA_HREF}
          className="inline-flex shrink-0 items-center justify-center gap-1 self-start rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-semibold text-yunicity-primary transition hover:border-yunicity-primary/30 hover:bg-[#EEF0FF] lg:self-center"
        >
          {SORTIR_DESKTOP_AGENDA_CTA}
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}
