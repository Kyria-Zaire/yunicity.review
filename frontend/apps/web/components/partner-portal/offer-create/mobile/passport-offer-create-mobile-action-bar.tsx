"use client";

import {
  PASSPORT_OFFER_CREATE_SAVE_DRAFT,
  PASSPORT_OFFER_CREATE_SAVING,
  PASSPORT_OFFER_CREATE_SUBMIT,
  PASSPORT_OFFER_CREATE_SUBMITTING,
} from "@yunicity/utils";

type PassportOfferCreateMobileActionBarProps = {
  isSaving: boolean;
  isSubmitting: boolean;
  onSaveDraft: () => void;
  onSubmit: () => void;
};

export function PassportOfferCreateMobileActionBar({
  isSaving,
  isSubmitting,
  onSaveDraft,
  onSubmit,
}: PassportOfferCreateMobileActionBarProps) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[var(--z-chrome)] border-t border-neutral-200/90 bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_24px_rgba(15,23,42,0.06)]"
      data-passport-offer-create-mobile-action-bar=""
    >
      <div className="mx-auto flex max-w-lg flex-col gap-2.5">
        <button
          type="button"
          onClick={onSaveDraft}
          disabled={isSaving || isSubmitting}
          className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3.5 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50 disabled:opacity-50"
        >
          {isSaving ? PASSPORT_OFFER_CREATE_SAVING : PASSPORT_OFFER_CREATE_SAVE_DRAFT}
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSaving || isSubmitting}
          className="w-full rounded-xl bg-yunicity-primary px-4 py-3.5 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-50"
        >
          {isSubmitting ? PASSPORT_OFFER_CREATE_SUBMITTING : PASSPORT_OFFER_CREATE_SUBMIT}
        </button>
      </div>
    </div>
  );
}
