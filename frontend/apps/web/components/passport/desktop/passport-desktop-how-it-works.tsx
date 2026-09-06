"use client";

import {
  PASSPORT_DESKTOP_HOW_FOOTER,
  PASSPORT_DESKTOP_HOW_STEPS,
  PASSPORT_DESKTOP_HOW_TITLE,
} from "@yunicity/utils";
import { ChevronRight, Info } from "lucide-react";

const STEP_TONES = [
  "bg-[#EEF0FF] text-yunicity-primary",
  "bg-emerald-50 text-emerald-600",
  "bg-orange-50 text-orange-600",
  "bg-violet-50 text-violet-600",
] as const;

export function PassportDesktopHowItWorks() {
  return (
    <section
      id="passport-desktop-how"
      className="scroll-mt-28 feed-desktop-surface p-5 sm:p-6"
      aria-labelledby="passport-desktop-how-title"
    >
      <h2 id="passport-desktop-how-title" className="text-lg font-bold text-neutral-900">
        {PASSPORT_DESKTOP_HOW_TITLE}
      </h2>

      <ol className="mt-5 grid gap-3 sm:grid-cols-2 sm:gap-5 xl:grid-cols-4">
        {PASSPORT_DESKTOP_HOW_STEPS.map((step, index) => (
          <li key={step.title} className="flex items-start gap-3 xl:block">
            <span
              className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${STEP_TONES[index] ?? STEP_TONES[0]}`}
            >
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-neutral-900 xl:mt-3">{step.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-neutral-600">{step.body}</p>
            </div>
            <ChevronRight className="mt-1.5 h-4 w-4 shrink-0 text-neutral-400 xl:hidden" aria-hidden />
          </li>
        ))}
      </ol>

      <p className="mt-5 inline-flex items-start gap-2 text-xs text-neutral-600">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-yunicity-primary" aria-hidden />
        {PASSPORT_DESKTOP_HOW_FOOTER}
      </p>
    </section>
  );
}
