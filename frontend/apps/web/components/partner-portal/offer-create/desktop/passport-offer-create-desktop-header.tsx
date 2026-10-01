"use client";

import {
  PASSPORT_OFFER_CREATE_BREADCRUMB_NEW,
  PASSPORT_OFFER_CREATE_BREADCRUMB_OFFERS,
  PASSPORT_OFFER_CREATE_BREADCRUMB_PASSPORT,
  PASSPORT_OFFER_CREATE_CANCEL,
  PASSPORT_OFFER_CREATE_DRAFT_BADGE,
  PASSPORT_OFFER_CREATE_SAVE_DRAFT,
  PASSPORT_OFFER_CREATE_SAVING,
  PASSPORT_OFFER_CREATE_SUBMIT,
  PASSPORT_OFFER_CREATE_SUBMITTING,
  PASSPORT_OFFER_CREATE_SUBTITLE,
  PASSPORT_OFFER_CREATE_TITLE,
  buildPartnerPortalOffersHref,
} from "@yunicity/utils";
import Link from "next/link";

type PassportOfferCreateDesktopHeaderProps = {
  onCancel: () => void;
  onSaveDraft: () => void;
  onSubmit: () => void;
  isSaving: boolean;
  isSubmitting: boolean;
};

export function PassportOfferCreateDesktopHeader({
  onCancel,
  onSaveDraft,
  onSubmit,
  isSaving,
  isSubmitting,
}: PassportOfferCreateDesktopHeaderProps) {
  return (
    <header
      className="mb-6 border-b border-neutral-200/80 pb-5"
      data-passport-offer-create-header=""
    >
      <nav aria-label="Fil d'Ariane" className="text-sm text-neutral-500">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>{PASSPORT_OFFER_CREATE_BREADCRUMB_PASSPORT}</li>
          <li aria-hidden>/</li>
          <li>
            <Link href={buildPartnerPortalOffersHref()} className="hover:text-neutral-800">
              {PASSPORT_OFFER_CREATE_BREADCRUMB_OFFERS}
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="font-medium text-neutral-800">{PASSPORT_OFFER_CREATE_BREADCRUMB_NEW}</li>
        </ol>
      </nav>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
              {PASSPORT_OFFER_CREATE_TITLE}
            </h1>
            <span className="rounded-md bg-neutral-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-neutral-600">
              {PASSPORT_OFFER_CREATE_DRAFT_BADGE}
            </span>
          </div>
          <p className="mt-2 max-w-3xl text-sm text-neutral-600">{PASSPORT_OFFER_CREATE_SUBTITLE}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
          >
            {PASSPORT_OFFER_CREATE_CANCEL}
          </button>
          <button
            type="button"
            onClick={onSaveDraft}
            disabled={isSaving || isSubmitting}
            className="rounded-xl border border-yunicity-primary bg-white px-4 py-2.5 text-sm font-semibold text-yunicity-primary transition hover:bg-[#EEF0FF] disabled:opacity-50"
          >
            {isSaving ? PASSPORT_OFFER_CREATE_SAVING : PASSPORT_OFFER_CREATE_SAVE_DRAFT}
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSaving || isSubmitting}
            className="rounded-xl bg-yunicity-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {isSubmitting ? PASSPORT_OFFER_CREATE_SUBMITTING : PASSPORT_OFFER_CREATE_SUBMIT}
          </button>
        </div>
      </div>
    </header>
  );
}
