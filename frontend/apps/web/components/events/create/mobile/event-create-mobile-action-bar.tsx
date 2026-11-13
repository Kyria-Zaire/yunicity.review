"use client";

import type { EventCreateStepId } from "@yunicity/utils";
import {
  EVENT_CREATE_MOBILE_CONTINUE,
  EVENT_CREATE_MOBILE_SAVE_DRAFT,
  EVENT_CREATE_SUBMIT,
  EVENT_CREATE_SUBMITTING,
} from "@yunicity/utils";
import { ArrowRight, Bookmark } from "lucide-react";

type EventCreateMobileActionBarProps = {
  step: EventCreateStepId;
  isSubmitting: boolean;
  onSaveDraft: () => void;
  onNext: () => void;
  onSubmit: () => void;
};

export function EventCreateMobileActionBar({
  step,
  isSubmitting,
  onSaveDraft,
  onNext,
  onSubmit,
}: EventCreateMobileActionBarProps) {
  const isReview = step === "review";

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[var(--z-chrome)] border-t border-neutral-200/90 bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_24px_rgba(15,23,42,0.06)]"
      data-event-create-mobile-action-bar=""
    >
      <div className="mx-auto flex max-w-lg gap-3">
        <button
          type="button"
          onClick={onSaveDraft}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-yunicity-primary px-3 py-3 text-sm font-semibold text-yunicity-primary transition hover:bg-[#EEF0FF]"
        >
          <Bookmark className="h-4 w-4" aria-hidden />
          {EVENT_CREATE_MOBILE_SAVE_DRAFT}
        </button>
        {isReview ? (
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="inline-flex flex-[1.15] items-center justify-center gap-1.5 rounded-xl bg-yunicity-primary px-3 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-60"
          >
            {isSubmitting ? EVENT_CREATE_SUBMITTING : EVENT_CREATE_SUBMIT}
          </button>
        ) : (
          <button
            type="button"
            onClick={onNext}
            className="inline-flex flex-[1.15] items-center justify-center gap-1.5 rounded-xl bg-yunicity-primary px-3 py-3 text-sm font-semibold text-white transition hover:opacity-95"
          >
            {EVENT_CREATE_MOBILE_CONTINUE}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        )}
      </div>
    </div>
  );
}
