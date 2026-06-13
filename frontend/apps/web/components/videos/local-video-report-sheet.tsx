"use client";

import type { LocalVideoReportReason } from "@yunicity/types";
import {
  LOCAL_VIDEO_REPORT_LABEL,
  LOCAL_VIDEO_REPORT_REASON_LABELS,
  LOCAL_VIDEO_REPORT_REASONS,
  LOCAL_VIDEO_REPORT_SUCCESS,
} from "@yunicity/utils";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

type LocalVideoReportSheetProps = {
  open: boolean;
  onClose: () => void;
  onReport: (reason: LocalVideoReportReason) => Promise<void>;
  alreadyReported?: boolean;
  errorMessage?: string | null;
};

export function LocalVideoReportSheet({
  open,
  onClose,
  onReport,
  alreadyReported = false,
  errorMessage = null,
}: LocalVideoReportSheetProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(alreadyReported);

  useEffect(() => {
    if (!open) return;
    setDone(alreadyReported);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [alreadyReported, onClose, open]);

  if (!open) return null;

  async function submit(reason: LocalVideoReportReason) {
    setIsSubmitting(true);
    try {
      await onReport(reason);
      setDone(true);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex flex-col justify-end" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Fermer le signalement"
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Signaler la vidéo"
        className="relative z-10 rounded-t-3xl bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-neutral-900">{LOCAL_VIDEO_REPORT_LABEL}</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-100"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        {done ? (
          <p className="py-4 text-sm text-neutral-600">{LOCAL_VIDEO_REPORT_SUCCESS}</p>
        ) : (
          <div className="flex flex-col gap-1 pb-2">
            {LOCAL_VIDEO_REPORT_REASONS.map((reason) => (
              <button
                key={reason}
                type="button"
                disabled={isSubmitting}
                onClick={() => void submit(reason)}
                className="rounded-xl px-3 py-3 text-left text-sm text-neutral-800 hover:bg-neutral-50 disabled:opacity-50"
              >
                {LOCAL_VIDEO_REPORT_REASON_LABELS[reason]}
              </button>
            ))}
          </div>
        )}

        {errorMessage ? (
          <p className="pb-2 text-sm text-red-600" role="alert">
            {errorMessage}
          </p>
        ) : null}
      </section>
    </div>
  );
}
