"use client";

import { MyAgendaEmptyState } from "@/components/events/agenda/my-agenda-empty-state";
import { MyAgendaEventRow } from "@/components/events/agenda/my-agenda-event-row";
import type { MyAgendaGroup } from "@yunicity/utils";
import {
  MY_AGENDA_BACK,
  MY_AGENDA_COUNT,
  MY_AGENDA_KICKER,
  MY_AGENDA_SUBTITLE,
  MY_AGENDA_TITLE,
} from "@yunicity/utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

type MyAgendaMobileViewProps = {
  city: string;
  groups: MyAgendaGroup[];
  totalCount: number;
  isGuest: boolean;
  removingId: string | null;
  onRemove: (eventId: string) => void;
};

export function MyAgendaMobileView({
  city,
  groups,
  totalCount,
  isGuest,
  removingId,
  onRemove,
}: MyAgendaMobileViewProps) {
  return (
    <div
      className="web-mobile-sortir-only min-w-0 bg-[linear-gradient(180deg,#FFFFFF_0%,#F4F5F8_28%,#F4F5F8_100%)] pb-10"
      data-my-agenda-mobile=""
    >
      <header className="sticky top-0 z-10 border-b border-neutral-200/70 bg-white/90 px-4 pb-3 pt-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link
            href="/sortir"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-neutral-800 transition hover:bg-neutral-100 active:scale-95"
            aria-label={MY_AGENDA_BACK}
          >
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-yunicity-primary">
              {MY_AGENDA_KICKER}
            </p>
            <h1 className="truncate text-xl font-bold tracking-tight text-neutral-950">
              {MY_AGENDA_TITLE}
            </h1>
          </div>
        </div>
        <p className="mt-2 pl-[3.25rem] text-xs leading-relaxed text-neutral-500">
          {MY_AGENDA_SUBTITLE(city)}
        </p>
        {!isGuest ? (
          <p className="mt-2 pl-[3.25rem] inline-flex rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold text-neutral-700">
            {MY_AGENDA_COUNT(totalCount)}
          </p>
        ) : null}
      </header>

      <div className="space-y-6 px-4 pt-5">
        {isGuest || totalCount === 0 ? (
          <MyAgendaEmptyState mode={isGuest ? "guest" : "empty"} city={city} />
        ) : (
          groups.map((group) => (
            <section key={group.id} className="space-y-3">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-[13px] font-bold uppercase tracking-[0.08em] text-neutral-800">
                  {group.title}
                </h2>
                <span className="text-[11px] font-medium text-neutral-400">
                  {group.items.length}
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
          ))
        )}
      </div>
    </div>
  );
}
