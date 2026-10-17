"use client";

import type { OrganizationRequestStepId } from "@yunicity/utils";
import {
  ORG_REQUEST_MOBILE_CONTINUE,
  ORG_REQUEST_MOBILE_SAVE_DRAFT,
  ORG_REQUEST_SUBMIT,
  ORG_REQUEST_SUBMITTING,
} from "@yunicity/utils";
import { ArrowRight, Bookmark } from "lucide-react";

type OrganizationRequestMobileActionBarProps = {
  step: OrganizationRequestStepId;
  isSubmitting: boolean;
  onSaveDraft: () => void;
  onNext: () => void;
  onSubmit: () => void;
};

/** Barre sticky Brouillon / Continuer (MOBILE-ORG-REQUEST-01). */
export function OrganizationRequestMobileActionBar({
  step,
  isSubmitting,
  onSaveDraft,
  onNext,
  onSubmit,
}: OrganizationRequestMobileActionBarProps) {
  const isVerification = step === "verification";

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[var(--z-chrome)] border-t border-neutral-200/90 bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_24px_rgba(15,23,42,0.06)]"
      data-org-request-mobile-action-bar=""
    >
      <div className="mx-auto flex max-w-lg gap-3">
        <button
          type="button"
          onClick={onSaveDraft}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-yunicity-primary px-3 py-3 text-sm font-semibold text-yunicity-primary transition hover:bg-[#EEF0FF]"
        >
          <Bookmark className="h-4 w-4" aria-hidden />
          {ORG_REQUEST_MOBILE_SAVE_DRAFT}
        </button>
        {isVerification ? (
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="inline-flex flex-[1.15] items-center justify-center gap-1.5 rounded-xl bg-yunicity-primary px-3 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-60"
          >
            {isSubmitting ? ORG_REQUEST_SUBMITTING : ORG_REQUEST_SUBMIT}
          </button>
        ) : (
          <button
            type="button"
            onClick={onNext}
            className="inline-flex flex-[1.15] items-center justify-center gap-1.5 rounded-xl bg-yunicity-primary px-3 py-3 text-sm font-semibold text-white transition hover:opacity-95"
          >
            {ORG_REQUEST_MOBILE_CONTINUE}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        )}
      </div>
    </div>
  );
}
