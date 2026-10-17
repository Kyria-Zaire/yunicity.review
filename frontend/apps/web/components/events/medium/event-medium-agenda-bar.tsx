"use client";

import {
  EVENT_DETAIL_DESKTOP_AGENDA_TITLE,
  EVENT_DETAIL_DESKTOP_NO_CONFLICT,
  EVENT_DETAIL_DESKTOP_VIEW_AGENDA,
  MY_AGENDA_HREF,
} from "@yunicity/utils";
import { CheckCircle2, ChevronRight } from "lucide-react";
import Link from "next/link";

export function EventMediumAgendaBar() {
  return (
    <section
      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-200/90 bg-white px-4 py-3.5 shadow-sm"
      data-event-medium-agenda=""
    >
      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
        <h2 className="text-sm font-bold text-neutral-900">{EVENT_DETAIL_DESKTOP_AGENDA_TITLE}</h2>
        <p className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
          {EVENT_DETAIL_DESKTOP_NO_CONFLICT}
        </p>
      </div>
      <Link
        href={MY_AGENDA_HREF}
        className="inline-flex items-center gap-1 rounded-xl border border-yunicity-primary px-3 py-2 text-sm font-semibold text-yunicity-primary transition hover:bg-[#EEF0FF]"
      >
        {EVENT_DETAIL_DESKTOP_VIEW_AGENDA}
        <ChevronRight className="h-4 w-4" aria-hidden />
      </Link>
    </section>
  );
}
