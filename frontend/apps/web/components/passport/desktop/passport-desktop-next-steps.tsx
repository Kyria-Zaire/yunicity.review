"use client";

import type { PassportDesktopNextStep } from "@yunicity/utils";
import {
  PASSPORT_DESKTOP_NEXT_STEP_DONE,
  PASSPORT_DESKTOP_NEXT_STEP_TODO,
  PASSPORT_DESKTOP_NEXT_STEPS_TITLE,
} from "@yunicity/utils";
import { CalendarDays, ChevronRight, MapPin, Tag } from "lucide-react";
import Link from "next/link";

type PassportDesktopNextStepsProps = {
  steps: PassportDesktopNextStep[];
};

const TONE_STYLES = {
  blue: {
    icon: "bg-[#EEF0FF] text-yunicity-primary",
    badge: "text-yunicity-primary",
  },
  green: {
    icon: "bg-emerald-50 text-emerald-600",
    badge: "text-emerald-600",
  },
  orange: {
    icon: "bg-orange-50 text-orange-600",
    badge: "text-orange-600",
  },
} as const;

function StepIcon({ tone }: { tone: PassportDesktopNextStep["tone"] }) {
  const className = `inline-flex h-10 w-10 items-center justify-center rounded-full ${TONE_STYLES[tone].icon}`;
  if (tone === "green") {
    return (
      <span className={className}>
        <CalendarDays className="h-4 w-4" aria-hidden />
      </span>
    );
  }
  if (tone === "orange") {
    return (
      <span className={className}>
        <Tag className="h-4 w-4" aria-hidden />
      </span>
    );
  }
  return (
    <span className={className}>
      <MapPin className="h-4 w-4" aria-hidden />
    </span>
  );
}

export function PassportDesktopNextSteps({ steps }: PassportDesktopNextStepsProps) {
  return (
    <section className="space-y-4" aria-labelledby="passport-desktop-next-steps-title">
      <h2 id="passport-desktop-next-steps-title" className="text-lg font-bold text-neutral-900">
        {PASSPORT_DESKTOP_NEXT_STEPS_TITLE}
      </h2>

      <div className="grid gap-3 md:grid-cols-3">
        {steps.map((step, index) => {
          const statusLabel = step.done ? PASSPORT_DESKTOP_NEXT_STEP_DONE : PASSPORT_DESKTOP_NEXT_STEP_TODO;
          const badgeTone = TONE_STYLES[step.tone].badge;

          return (
            <Link
              key={step.id}
              href={step.href}
              className="group feed-desktop-surface flex items-center gap-3 p-4 transition hover:border-yunicity-primary/20 hover:shadow-md"
            >
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-neutral-200 text-sm font-bold text-neutral-700">
                {index + 1}
              </span>
              <StepIcon tone={step.tone} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-neutral-900">{step.title}</p>
                <p className="mt-0.5 text-xs text-neutral-500">{step.category}</p>
                <p className={`mt-2 inline-flex items-center gap-1 text-xs font-semibold ${badgeTone}`}>
                  <span className="rounded-full bg-current/10 px-2 py-0.5">{statusLabel}</span>
                  <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" aria-hidden />
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
