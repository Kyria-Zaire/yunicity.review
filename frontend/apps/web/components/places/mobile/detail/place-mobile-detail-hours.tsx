"use client";

import type { PlaceDetailDesktopHourRow } from "@yunicity/utils";
import {
  PLACE_DETAIL_MOBILE_HOURS_EMPTY,
  PLACE_DETAIL_MOBILE_HOURS_FOOTER,
  PLACE_DETAIL_MOBILE_HOURS_TITLE,
  PLACE_DETAIL_MOBILE_HOURS_TODAY,
  PLACE_DETAIL_MOBILE_HOURS_VIEW_ALL,
} from "@yunicity/utils";
import { CalendarDays, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

type PlaceMobileDetailHoursProps = {
  hourRows: PlaceDetailDesktopHourRow[];
};

export function PlaceMobileDetailHours({ hourRows }: PlaceMobileDetailHoursProps) {
  const [open, setOpen] = useState(true);
  const hoursEmpty = hourRows.length === 0;

  return (
    <section
      className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm"
      data-place-mobile-detail-hours=""
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between border-b border-neutral-100 px-4 py-3 text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-bold text-neutral-900">{PLACE_DETAIL_MOBILE_HOURS_TITLE}</span>
        <ChevronDown className={`h-4 w-4 text-neutral-500 transition ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>

      {open ? (
        <div className="space-y-3 p-4">
          {!hoursEmpty ? (
            <>
              <p className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
                <CalendarDays className="h-4 w-4 shrink-0" aria-hidden />
                {PLACE_DETAIL_MOBILE_HOURS_TODAY}
              </p>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                {hourRows.map((row) => (
                  <div key={row.day} className="contents">
                    <dt className="text-neutral-500">{row.day}</dt>
                    <dd className="text-right font-medium text-neutral-900">{row.hours}</dd>
                  </div>
                ))}
              </dl>
              <button
                type="button"
                disabled
                className="inline-flex items-center gap-1 text-sm font-semibold text-yunicity-primary opacity-70"
              >
                {PLACE_DETAIL_MOBILE_HOURS_VIEW_ALL}
                <ChevronRight className="h-4 w-4" aria-hidden />
              </button>
            </>
          ) : (
            <p className="text-sm text-neutral-600">{PLACE_DETAIL_MOBILE_HOURS_EMPTY}</p>
          )}
          <p className="text-xs text-neutral-500">{PLACE_DETAIL_MOBILE_HOURS_FOOTER}</p>
        </div>
      ) : null}
    </section>
  );
}
