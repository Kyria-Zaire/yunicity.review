import Link from "next/link";

import {
  EVENT_DETAIL_CANCELLED_BACK_EVENTS,
  EVENT_DETAIL_CANCELLED_BODY,
  EVENT_DETAIL_CANCELLED_DISCOVER_SORTIR,
  EVENT_DETAIL_CANCELLED_TITLE,
} from "@yunicity/utils";

export function EventDetailCancelledState() {
  return (
    <div className="rounded-2xl border border-stone-200 bg-stone-50 px-6 py-10 text-center shadow-sm">
      <h2 className="text-xl font-semibold tracking-tight text-stone-900">
        {EVENT_DETAIL_CANCELLED_TITLE}
      </h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-stone-600">
        {EVENT_DETAIL_CANCELLED_BODY}
      </p>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link
          href="/events"
          className="inline-flex rounded-full border border-stone-300 bg-white px-5 py-2.5 text-sm font-semibold text-stone-800 shadow-sm transition hover:bg-stone-100"
        >
          ← {EVENT_DETAIL_CANCELLED_BACK_EVENTS}
        </Link>
        <Link
          href="/sortir"
          className="inline-flex rounded-full bg-yunicity-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
        >
          {EVENT_DETAIL_CANCELLED_DISCOVER_SORTIR}
        </Link>
      </div>
    </div>
  );
}
