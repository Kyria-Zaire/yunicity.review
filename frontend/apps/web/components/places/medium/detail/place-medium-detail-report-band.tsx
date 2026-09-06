"use client";

import {
  PLACE_DETAIL_MEDIUM_REPORT_BODY,
  PLACE_DETAIL_MEDIUM_REPORT_CHANGE,
  PLACE_DETAIL_MEDIUM_REPORT_SOON,
  PLACE_DETAIL_MEDIUM_REPORT_SUGGEST,
  PLACE_DETAIL_MEDIUM_REPORT_TITLE,
} from "@yunicity/utils";

export function PlaceMediumDetailReportBand() {
  return (
    <section
      className="flex flex-col gap-4 rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
      data-place-medium-detail-report=""
    >
      <div>
        <h2 className="text-sm font-bold text-neutral-900">{PLACE_DETAIL_MEDIUM_REPORT_TITLE}</h2>
        <p className="mt-1 text-sm text-neutral-600">{PLACE_DETAIL_MEDIUM_REPORT_BODY}</p>
      </div>
      <div className="grid shrink-0 grid-cols-2 gap-2 sm:w-auto">
        <button
          type="button"
          disabled
          title={PLACE_DETAIL_MEDIUM_REPORT_SOON}
          className="rounded-xl border border-neutral-200 px-3 py-2.5 text-xs font-semibold text-neutral-800"
        >
          {PLACE_DETAIL_MEDIUM_REPORT_CHANGE}
        </button>
        <button
          type="button"
          disabled
          title={PLACE_DETAIL_MEDIUM_REPORT_SOON}
          className="rounded-xl border border-neutral-200 px-3 py-2.5 text-xs font-semibold text-neutral-800"
        >
          {PLACE_DETAIL_MEDIUM_REPORT_SUGGEST}
        </button>
      </div>
    </section>
  );
}
