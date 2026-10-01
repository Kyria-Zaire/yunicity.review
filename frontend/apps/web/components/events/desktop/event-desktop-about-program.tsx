"use client";

import type { EventProgramStep } from "@yunicity/utils";
import {
  EVENT_DETAIL_DESKTOP_ABOUT,
  EVENT_DETAIL_DESKTOP_COLLAPSE,
  EVENT_DETAIL_DESKTOP_EXPAND,
  EVENT_DETAIL_DESKTOP_PROGRAM,
} from "@yunicity/utils";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

type EventDesktopAboutProgramProps = {
  preview: string;
  fullText: string | null;
  programSteps: EventProgramStep[];
};

export function EventDesktopAboutProgram({
  preview,
  fullText,
  programSteps,
}: EventDesktopAboutProgramProps) {
  const [expanded, setExpanded] = useState(false);
  const canExpand = Boolean(fullText && fullText.length > preview.length);

  return (
    <div
      className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm sm:p-6"
      data-event-desktop-about=""
    >
      <div className="grid gap-8 sm:grid-cols-2">
        <section aria-labelledby="event-about-title">
          <h2 id="event-about-title" className="text-base font-bold text-neutral-900">
            {EVENT_DETAIL_DESKTOP_ABOUT}
          </h2>
          {preview ? (
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-neutral-600">
              <p className="whitespace-pre-wrap">{expanded && fullText ? fullText : preview}</p>
              {canExpand ? (
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-yunicity-primary hover:underline"
                >
                  {expanded ? EVENT_DETAIL_DESKTOP_COLLAPSE : EVENT_DETAIL_DESKTOP_EXPAND}
                  <ChevronDown
                    className={`h-4 w-4 transition ${expanded ? "rotate-180" : ""}`}
                    aria-hidden
                  />
                </button>
              ) : null}
            </div>
          ) : (
            <p className="mt-3 text-sm text-neutral-500">Aucune description pour le moment.</p>
          )}
        </section>

        <section aria-labelledby="event-program-title">
          <h2 id="event-program-title" className="text-base font-bold text-neutral-900">
            {EVENT_DETAIL_DESKTOP_PROGRAM}
          </h2>
          {programSteps.length > 0 ? (
            <ol className="relative mt-4 ml-1">
              <span
                className="absolute bottom-3 left-[5px] top-2 w-[2px] bg-yunicity-primary"
                aria-hidden
              />
              {programSteps.map((step) => (
                <li key={`${step.timeLabel}-${step.title}`} className="relative pb-5 pl-6 last:pb-0">
                  <span className="absolute left-0 top-1.5 h-3 w-3 rounded-full bg-yunicity-primary" />
                  <p className="text-sm font-bold tabular-nums text-neutral-900">{step.timeLabel}</p>
                  <p className="text-sm text-neutral-600">{step.title}</p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-3 text-sm text-neutral-500">Programme à confirmer.</p>
          )}
        </section>
      </div>
    </div>
  );
}
