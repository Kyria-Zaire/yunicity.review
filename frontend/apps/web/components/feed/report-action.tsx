"use client";

import type { FeedReportReason } from "@yunicity/types";
import { FEED_REPORT_LABEL, FEED_REPORT_REASON_LABELS } from "@yunicity/utils";
import { useState } from "react";

const REASONS: FeedReportReason[] = ["spam", "inappropriate", "other"];

export function ReportAction({
  onReport,
}: {
  onReport: (reason: FeedReportReason) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(reason: FeedReportReason) {
    setIsSubmitting(true);
    try {
      await onReport(reason);
      setDone(true);
      setOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (done) {
    return <span className="text-xs text-neutral-500">Signalement envoyé</span>;
  }

  return (
    <div className="relative">
      <button
        type="button"
        data-feed-publication-report=""
        onClick={() => setOpen((value) => !value)}
        className="inline-flex min-h-[36px] min-w-[36px] items-center justify-center text-xs text-neutral-500 underline-offset-2 hover:text-neutral-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary"
      >
        {FEED_REPORT_LABEL}
      </button>
      {open ? (
        <div
          className="absolute right-0 z-10 mt-2 min-w-[12rem] rounded-xl border border-yunicity-border bg-white p-2 shadow-md"
          role="menu"
        >
          {REASONS.map((reason) => (
            <button
              key={reason}
              type="button"
              role="menuitem"
              disabled={isSubmitting}
              onClick={() => void submit(reason)}
              className="block w-full rounded-lg px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 focus:bg-neutral-50 focus:outline-none"
            >
              {FEED_REPORT_REASON_LABELS[reason]}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
