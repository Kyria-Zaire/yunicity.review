"use client";

import {
  TRIBE_CREATE_DESKTOP_BACK,
  TRIBE_CREATE_DESKTOP_DRAFT_SAVED,
  TRIBE_CREATE_DESKTOP_SAVE_EXIT,
  TRIBE_CREATE_DESKTOP_SUBTITLE,
  TRIBE_CREATE_DESKTOP_TITLE,
} from "@yunicity/utils";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";

type TribeCreateDesktopHeaderProps = {
  city: string;
  draftSavedMessage: string | null;
  onSaveExit: () => void;
};

export function TribeCreateDesktopHeader({
  city,
  draftSavedMessage,
  onSaveExit,
}: TribeCreateDesktopHeaderProps) {
  return (
    <header
      className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-neutral-200/80 pb-5"
      data-tribe-create-header=""
    >
      <div className="min-w-0">
        <Link
          href={`/tribes?city=${encodeURIComponent(city)}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-700 transition hover:text-neutral-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {TRIBE_CREATE_DESKTOP_BACK}
        </Link>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
          {TRIBE_CREATE_DESKTOP_TITLE}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-neutral-600">{TRIBE_CREATE_DESKTOP_SUBTITLE}</p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2">
        {draftSavedMessage ? (
          <p className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600" role="status">
            <CheckCircle2 className="h-4 w-4" aria-hidden />
            {TRIBE_CREATE_DESKTOP_DRAFT_SAVED}
          </p>
        ) : null}
        <button
          type="button"
          onClick={onSaveExit}
          className="rounded-xl border border-yunicity-primary px-4 py-2.5 text-sm font-semibold text-yunicity-primary transition hover:bg-[#EEF0FF]"
        >
          {TRIBE_CREATE_DESKTOP_SAVE_EXIT}
        </button>
      </div>
    </header>
  );
}
