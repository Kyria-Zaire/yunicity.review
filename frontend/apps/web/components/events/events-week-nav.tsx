"use client";

import type { AgendaWeekDay } from "@yunicity/utils";
import { EVENTS_AGENDA_WEEK_TITLE } from "@yunicity/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef } from "react";

type EventsWeekNavProps = {
  days: AgendaWeekDay[];
  selectedKey: string;
  onSelect: (dayKey: string) => void;
  subtitle?: string;
  headerAction?: ReactNode;
};

const SCROLL_STEP_RATIO = 0.72;

export function EventsWeekNav({
  days,
  selectedKey,
  onSelect,
  subtitle,
  headerAction,
}: EventsWeekNavProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  const scrollByViewport = useCallback((direction: "left" | "right") => {
    const el = scrollerRef.current;
    if (!el) return;
    const delta = el.clientWidth * SCROLL_STEP_RATIO;
    el.scrollBy({ left: direction === "left" ? -delta : delta, behavior: "smooth" });
  }, []);

  useEffect(() => {
    selectedRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [selectedKey]);

  return (
    <section className="space-y-3" aria-label="Calendrier de la semaine">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-bold tracking-tight text-neutral-900 sm:text-xl">
            {EVENTS_AGENDA_WEEK_TITLE}
          </h2>
          {subtitle ? (
            <p className="mt-0.5 text-sm text-neutral-500">{subtitle}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          {headerAction}
          <button
            type="button"
            onClick={() => scrollByViewport("left")}
            aria-label="Afficher les jours précédents"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 shadow-sm transition hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => scrollByViewport("right")}
            aria-label="Afficher les jours suivants"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 shadow-sm transition hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900"
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>

      <nav
        ref={scrollerRef}
        className="-mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <ul className="flex min-w-max gap-3">
          {days.map((day) => {
            const active = day.key === selectedKey;
            return (
              <li key={day.key}>
                <button
                  ref={active ? selectedRef : undefined}
                  type="button"
                  onClick={() => onSelect(day.key)}
                  aria-pressed={active}
                  aria-label={`${day.weekdayShort} ${day.dayNumber}${day.isToday ? ", aujourd'hui" : ""}`}
                  className={`flex h-[4.5rem] w-[4.5rem] flex-col items-center justify-center rounded-2xl border text-center transition sm:h-[4.75rem] sm:w-[4.75rem] ${
                    active
                      ? "border-yunicity-primary bg-yunicity-primary text-white shadow-md shadow-yunicity-primary/20"
                      : "border-neutral-200 bg-white text-neutral-800 hover:border-yunicity-primary/25 hover:bg-neutral-50"
                  }`}
                >
                  <span
                    className={`text-[11px] font-bold uppercase tracking-wide ${
                      active ? "text-white/85" : "text-neutral-400"
                    }`}
                  >
                    {day.weekdayShort}
                  </span>
                  <span
                    className={`mt-1 text-xl font-bold tabular-nums leading-none sm:text-2xl ${
                      active ? "text-white" : "text-neutral-900"
                    }`}
                  >
                    {day.dayNumber}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </section>
  );
}
