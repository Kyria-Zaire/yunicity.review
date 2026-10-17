"use client";

import {
  TRIBE_CREATE_DESKTOP_HELP_BODY,
  TRIBE_CREATE_DESKTOP_HELP_LINK,
  TRIBE_CREATE_DESKTOP_HELP_TITLE,
} from "@yunicity/utils";
import { ChevronRight, Shield } from "lucide-react";

export function TribeCreateDesktopHelp() {
  return (
    <section
      className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm"
      data-tribe-create-help=""
    >
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EEF0FF] text-yunicity-primary">
          <Shield className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-neutral-900">{TRIBE_CREATE_DESKTOP_HELP_TITLE}</h2>
          <p className="mt-1 text-xs leading-relaxed text-neutral-600">{TRIBE_CREATE_DESKTOP_HELP_BODY}</p>
          <button
            type="button"
            className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-yunicity-primary hover:underline"
          >
            {TRIBE_CREATE_DESKTOP_HELP_LINK}
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </section>
  );
}
