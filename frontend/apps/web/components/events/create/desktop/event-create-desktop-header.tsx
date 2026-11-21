"use client";

import {
  EVENT_CREATE_BACK_SORTIR,
  EVENT_CREATE_SAVE_EXIT,
  EVENT_CREATE_SUBTITLE,
  EVENT_CREATE_TITLE,
} from "@yunicity/utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

type EventCreateDesktopHeaderProps = {
  onSaveExit: () => void;
};

export function EventCreateDesktopHeader({ onSaveExit }: EventCreateDesktopHeaderProps) {
  return (
    <header
      className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-neutral-200/80 pb-5"
      data-event-create-header=""
    >
      <div className="min-w-0">
        <Link
          href="/sortir"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-700 transition hover:text-neutral-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {EVENT_CREATE_BACK_SORTIR}
        </Link>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
          {EVENT_CREATE_TITLE}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-neutral-600">{EVENT_CREATE_SUBTITLE}</p>
      </div>
      <button
        type="button"
        onClick={onSaveExit}
        className="shrink-0 rounded-xl border border-yunicity-primary px-4 py-2.5 text-sm font-semibold text-yunicity-primary transition hover:bg-[#EEF0FF]"
      >
        {EVENT_CREATE_SAVE_EXIT}
      </button>
    </header>
  );
}
