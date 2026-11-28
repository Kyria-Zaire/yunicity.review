"use client";

import {
  MY_AGENDA_EMPTY_BODY,
  MY_AGENDA_EMPTY_CTA,
  MY_AGENDA_EMPTY_TITLE,
  MY_AGENDA_GUEST_BODY,
  MY_AGENDA_GUEST_CTA,
  MY_AGENDA_GUEST_TITLE,
} from "@yunicity/utils";
import { CalendarHeart } from "lucide-react";
import Link from "next/link";

type MyAgendaEmptyStateProps = {
  mode: "empty" | "guest";
  city: string;
};

export function MyAgendaEmptyState({ mode, city }: MyAgendaEmptyStateProps) {
  const isGuest = mode === "guest";

  return (
    <section className="relative overflow-hidden rounded-[1.75rem] border border-neutral-200/80 bg-white px-5 py-11 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:px-10">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_-10%,rgba(42,47,255,0.09),transparent_55%),linear-gradient(180deg,#FFFFFF_35%,#F6F7FB_100%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-8 top-8 h-28 w-28 rounded-full border border-yunicity-primary/10"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-6 bottom-6 h-20 w-20 rounded-full border border-neutral-200/80"
        aria-hidden
      />
      <div className="relative mx-auto flex max-w-md flex-col items-center">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-yunicity-primary text-white shadow-[0_8px_20px_rgba(42,47,255,0.25)]">
          <CalendarHeart className="h-7 w-7" aria-hidden />
        </span>
        <h2 className="mt-5 text-[1.35rem] font-bold tracking-tight text-neutral-950">
          {isGuest ? MY_AGENDA_GUEST_TITLE : MY_AGENDA_EMPTY_TITLE}
        </h2>
        <p className="mt-2.5 text-sm leading-relaxed text-neutral-600">
          {isGuest ? MY_AGENDA_GUEST_BODY : MY_AGENDA_EMPTY_BODY}
        </p>
        <Link
          href={isGuest ? `/login?next=${encodeURIComponent("/sortir/agenda")}` : "/sortir"}
          className="mt-7 inline-flex min-h-11 items-center justify-center rounded-full bg-yunicity-primary px-5 text-sm font-semibold text-white transition hover:bg-yunicity-primary/90 active:scale-[0.98]"
        >
          {isGuest ? MY_AGENDA_GUEST_CTA : MY_AGENDA_EMPTY_CTA}
        </Link>
        {!isGuest ? (
          <p className="mt-3.5 text-xs text-neutral-500">À {city} et autour</p>
        ) : null}
      </div>
    </section>
  );
}
