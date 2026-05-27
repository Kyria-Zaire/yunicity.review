"use client";

import type { AgendaTimeSlot } from "@yunicity/utils";
import {
  EVENTS_AGENDA_HERO_CTA,
  EVENTS_AGENDA_HERO_KICKER,
  EVENTS_AGENDA_HERO_TITLE,
  EVENTS_AGENDA_SEARCH_ARIA,
  EVENTS_AGENDA_THEME_PLACEHOLDER,
  EVENTS_AGENDA_TIME_PLACEHOLDER,
  eventsAgendaHeroSubtitle,
} from "@yunicity/utils";
import { ChevronDown, Clock, Search, Ticket } from "lucide-react";

type EventsAgendaHeroProps = {
  city: string;
  theme: string;
  timeSlot: AgendaTimeSlot;
  onThemeChange: (value: string) => void;
  onTimeSlotChange: (value: AgendaTimeSlot) => void;
  onSubmit: () => void;
};

/** Libellés courts dans le hero pour une meilleure lisibilité. */
const TIME_OPTIONS: { value: AgendaTimeSlot; label: string }[] = [
  { value: "", label: EVENTS_AGENDA_TIME_PLACEHOLDER },
  { value: "tonight", label: "Ce soir" },
  { value: "afternoon", label: "Cet après-midi" },
];

const fieldIconClass = "h-[18px] w-[18px] shrink-0 text-yunicity-primary";

export function EventsAgendaHero({
  city,
  theme,
  timeSlot,
  onThemeChange,
  onTimeSlotChange,
  onSubmit,
}: EventsAgendaHeroProps) {
  return (
    <section className="rounded-[26px] bg-yunicity-primary px-5 py-5 text-white shadow-md sm:px-6 sm:py-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80">
        {EVENTS_AGENDA_HERO_KICKER}
      </p>
      <h1 className="mt-1.5 text-2xl font-bold tracking-tight sm:text-[1.65rem]">
        {EVENTS_AGENDA_HERO_TITLE}
      </h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/90">
        {eventsAgendaHeroSubtitle(city)}
      </p>

      <form
        className="relative z-10 mt-5"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-0 sm:overflow-hidden sm:rounded-2xl sm:border sm:border-neutral-200/90 sm:bg-white sm:shadow-[0_10px_28px_rgba(15,23,42,0.14)]">
          <label className="relative flex min-h-[48px] min-w-0 flex-1 items-center gap-2.5 rounded-xl border border-neutral-200/90 bg-white px-3.5 py-2.5 sm:rounded-none sm:border-0 sm:border-r sm:border-neutral-200 sm:px-4">
            <Clock className={fieldIconClass} aria-hidden />
            <span className="sr-only">{EVENTS_AGENDA_TIME_PLACEHOLDER}</span>
            <select
              value={timeSlot}
              onChange={(event) => onTimeSlotChange(event.target.value as AgendaTimeSlot)}
              style={{ colorScheme: "light" }}
              className={`min-w-0 flex-1 cursor-pointer appearance-none border-0 bg-white py-0.5 pr-7 text-sm font-medium leading-snug focus:outline-none focus:ring-0 ${
                timeSlot === ""
                  ? "text-neutral-600"
                  : "text-neutral-900"
              }`}
            >
              {TIME_OPTIONS.map((option) => (
                <option key={option.value || "any"} value={option.value} className="text-neutral-900">
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500 sm:right-4"
              aria-hidden
            />
          </label>

          <label className="flex min-h-[48px] min-w-0 flex-[1.08] items-center gap-2.5 rounded-xl border border-neutral-200/90 bg-white px-3.5 py-2.5 sm:rounded-none sm:border-0 sm:px-4">
            <Ticket className={fieldIconClass} aria-hidden />
            <span className="sr-only">{EVENTS_AGENDA_THEME_PLACEHOLDER}</span>
            <input
              type="text"
              value={theme}
              onChange={(event) => onThemeChange(event.target.value)}
              placeholder={EVENTS_AGENDA_THEME_PLACEHOLDER}
              className="min-w-0 flex-1 border-0 bg-white py-0.5 text-sm font-medium text-neutral-900 placeholder:font-normal placeholder:text-neutral-500 focus:outline-none focus:ring-0"
            />
          </label>

          <button
            type="submit"
            aria-label={EVENTS_AGENDA_SEARCH_ARIA}
            className="inline-flex min-h-[48px] shrink-0 items-center justify-center gap-2 rounded-xl bg-[#1a32b8] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#142896] sm:min-h-0 sm:rounded-none sm:px-5 sm:py-3.5"
          >
            <Search className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden />
            <span>{EVENTS_AGENDA_HERO_CTA}</span>
          </button>
        </div>
      </form>
    </section>
  );
}
