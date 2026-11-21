"use client";

import { EVENT_CREATE_HELP_LINK, EVENT_CREATE_HELP_TITLE } from "@yunicity/utils";
import { ChevronRight, HelpCircle } from "lucide-react";
import Link from "next/link";

export function EventCreateDesktopHelp() {
  return (
    <section
      className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm"
      data-event-create-help=""
    >
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EEF0FF] text-yunicity-primary">
          <HelpCircle className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-neutral-900">{EVENT_CREATE_HELP_TITLE}</h2>
          <Link
            href="/sortir"
            className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-yunicity-primary hover:underline"
          >
            {EVENT_CREATE_HELP_LINK}
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
