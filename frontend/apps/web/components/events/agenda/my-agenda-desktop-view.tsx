"use client";

import { MyAgendaEmptyState } from "@/components/events/agenda/my-agenda-empty-state";
import { MyAgendaEventRow } from "@/components/events/agenda/my-agenda-event-row";
import type { MyAgendaGroup } from "@yunicity/utils";
import {
  MY_AGENDA_BACK,
  MY_AGENDA_COUNT,
  MY_AGENDA_EXPLORE_CTA,
  MY_AGENDA_EXPLORE_TITLE,
  MY_AGENDA_KICKER,
  MY_AGENDA_SUBTITLE,
  MY_AGENDA_TIP_BODY,
  MY_AGENDA_TIP_TITLE,
  MY_AGENDA_TITLE,
} from "@yunicity/utils";
import { ArrowLeft, Lightbulb, Sparkles } from "lucide-react";
import Link from "next/link";

type MyAgendaDesktopViewProps = {
  city: string;
  groups: MyAgendaGroup[];
  totalCount: number;
  isGuest: boolean;
  removingId: string | null;
  onRemove: (eventId: string) => void;
};

export function MyAgendaDesktopView({
  city,
  groups,
  totalCount,
  isGuest,
  removingId,
  onRemove,
}: MyAgendaDesktopViewProps) {
  return (
    <div
      className="sortir-desktop-shell-only mx-auto w-full max-w-[1120px] px-3 pb-16 sm:px-4 lg:px-6"
      data-my-agenda-desktop=""
    >
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-neutral-200/70 pb-7">
        <div>
          <Link
            href="/sortir"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 transition hover:text-yunicity-primary"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {MY_AGENDA_BACK}
          </Link>
          <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.16em] text-yunicity-primary">
            {MY_AGENDA_KICKER}
          </p>
          <h1 className="mt-1 text-[2.15rem] font-bold tracking-tight text-neutral-950">
            {MY_AGENDA_TITLE}
          </h1>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-neutral-600">
            {MY_AGENDA_SUBTITLE(city)}
          </p>
        </div>
        {!isGuest ? (
          <p className="rounded-full bg-white px-3.5 py-1.5 text-sm font-semibold text-neutral-700 shadow-sm ring-1 ring-neutral-200/90">
            {MY_AGENDA_COUNT(totalCount)}
          </p>
        ) : null}
      </div>

      {isGuest || totalCount === 0 ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <MyAgendaEmptyState mode={isGuest ? "guest" : "empty"} city={city} />
          <aside className="space-y-4">
            <TipCard />
            <ExploreCard />
          </aside>
        </div>
      ) : (
        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
          <div className="relative space-y-8 pl-0 sm:pl-1">
            {groups.map((group) => (
              <section key={group.id} className="space-y-3.5">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="text-lg font-bold tracking-tight text-neutral-950">{group.title}</h2>
                  <span className="text-xs font-medium text-neutral-400">
                    {group.items.length}{" "}
                    {group.items.length > 1 ? "sorties" : "sortie"}
                  </span>
                </div>
                <ul className="space-y-3">
                  {group.items.map((item) => (
                    <li key={item.id}>
                      <MyAgendaEventRow
                        item={item}
                        onRemove={onRemove}
                        removing={removingId === item.id}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
          <aside className="sticky top-20 space-y-4">
            <TipCard />
            <ExploreCard />
          </aside>
        </div>
      )}
    </div>
  );
}

function TipCard() {
  return (
    <section className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex items-start gap-2.5">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
          <Lightbulb className="h-4 w-4" aria-hidden />
        </span>
        <div>
          <h2 className="text-sm font-bold text-neutral-950">{MY_AGENDA_TIP_TITLE}</h2>
          <p className="mt-1 text-xs leading-relaxed text-neutral-600">{MY_AGENDA_TIP_BODY}</p>
        </div>
      </div>
    </section>
  );
}

function ExploreCard() {
  return (
    <section className="overflow-hidden rounded-2xl border border-yunicity-primary/15 bg-[linear-gradient(165deg,#EEF0FF_0%,#ffffff_58%)] p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex items-start gap-2.5">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-yunicity-primary shadow-sm">
          <Sparkles className="h-4 w-4" aria-hidden />
        </span>
        <div>
          <h2 className="text-sm font-bold text-neutral-950">{MY_AGENDA_EXPLORE_TITLE}</h2>
          <Link
            href="/sortir"
            className="mt-3 inline-flex min-h-10 items-center rounded-full bg-yunicity-primary px-4 text-sm font-semibold text-white transition hover:bg-yunicity-primary/90 active:scale-[0.98]"
          >
            {MY_AGENDA_EXPLORE_CTA}
          </Link>
        </div>
      </div>
    </section>
  );
}
