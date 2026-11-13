"use client";

import {
  PLACE_DETAIL_MOBILE_REPORT_BODY,
  PLACE_DETAIL_MOBILE_REPORT_CHANGE,
  PLACE_DETAIL_MOBILE_REPORT_SOON,
  PLACE_DETAIL_MOBILE_REPORT_SUGGEST,
  PLACE_DETAIL_MOBILE_REPORT_TITLE,
} from "@yunicity/utils";

export function PlaceMobileDetailReportBand() {
  return (
    <section
      className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm"
      data-place-mobile-detail-report=""
    >
      <h2 className="text-sm font-bold text-neutral-900">{PLACE_DETAIL_MOBILE_REPORT_TITLE}</h2>
      <p className="mt-1 text-sm text-neutral-600">{PLACE_DETAIL_MOBILE_REPORT_BODY}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled
          title={PLACE_DETAIL_MOBILE_REPORT_SOON}
          className="rounded-xl border border-neutral-200 px-2 py-2.5 text-[11px] font-semibold text-neutral-800"
        >
          {PLACE_DETAIL_MOBILE_REPORT_CHANGE}
        </button>
        <button
          type="button"
          disabled
          title={PLACE_DETAIL_MOBILE_REPORT_SOON}
          className="rounded-xl border border-neutral-200 px-2 py-2.5 text-[11px] font-semibold text-neutral-800"
        >
          {PLACE_DETAIL_MOBILE_REPORT_SUGGEST}
        </button>
      </div>
    </section>
  );
}
