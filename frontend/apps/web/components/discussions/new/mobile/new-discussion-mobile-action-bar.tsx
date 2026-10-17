"use client";

import { DISCUSSION_NEW_CANCEL, DISCUSSION_NEW_PUBLISH, DISCUSSION_NEW_PUBLISHING } from "@yunicity/utils";
import { Send } from "lucide-react";

type NewDiscussionMobileActionBarProps = {
  formId: string;
  submitting: boolean;
  onCancel: () => void;
};

export function NewDiscussionMobileActionBar({
  formId,
  submitting,
  onCancel,
}: NewDiscussionMobileActionBarProps) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[var(--z-chrome)] border-t border-neutral-200/90 bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_24px_rgba(15,23,42,0.06)]"
      data-discussion-new-mobile-action-bar=""
    >
      <div className="mx-auto flex max-w-lg gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="inline-flex flex-1 items-center justify-center rounded-xl border border-neutral-200 px-3 py-3 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50 disabled:opacity-60"
        >
          {DISCUSSION_NEW_CANCEL}
        </button>
        <button
          type="submit"
          form={formId}
          disabled={submitting}
          className="inline-flex flex-[1.15] items-center justify-center gap-1.5 rounded-xl bg-yunicity-primary px-3 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-60"
        >
          {submitting ? DISCUSSION_NEW_PUBLISHING : DISCUSSION_NEW_PUBLISH}
          <Send className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
