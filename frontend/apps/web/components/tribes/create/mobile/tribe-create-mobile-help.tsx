"use client";

import {
  TRIBE_CREATE_DESKTOP_HELP_TITLE,
  TRIBE_CREATE_MEDIUM_HELP_BODY_EXTENDED,
} from "@yunicity/utils";
import { Shield } from "lucide-react";

export function TribeCreateMobileHelp() {
  return (
    <section
      className="rounded-2xl border border-sky-100/80 bg-sky-50/60 p-4"
      data-tribe-create-mobile-help=""
    >
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-yunicity-primary shadow-sm">
          <Shield className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-neutral-900">{TRIBE_CREATE_DESKTOP_HELP_TITLE}</h2>
          <p className="mt-1 text-sm leading-relaxed text-neutral-600">
            {TRIBE_CREATE_MEDIUM_HELP_BODY_EXTENDED}
          </p>
        </div>
      </div>
    </section>
  );
}
