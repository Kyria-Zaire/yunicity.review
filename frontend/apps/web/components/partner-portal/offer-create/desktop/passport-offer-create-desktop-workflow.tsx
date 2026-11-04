"use client";

import {
  PASSPORT_OFFER_CREATE_WORKFLOW_APPROVED,
  PASSPORT_OFFER_CREATE_WORKFLOW_BODY,
  PASSPORT_OFFER_CREATE_WORKFLOW_PUBLISHED,
  PASSPORT_OFFER_CREATE_WORKFLOW_REVIEW,
  PASSPORT_OFFER_CREATE_WORKFLOW_TITLE,
} from "@yunicity/utils";
import { CheckCircle2, Globe2, Hourglass } from "lucide-react";

export function PassportOfferCreateDesktopWorkflow() {
  return (
    <section
      className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm"
      data-passport-offer-create-workflow=""
    >
      <h2 className="text-sm font-bold text-neutral-900">{PASSPORT_OFFER_CREATE_WORKFLOW_TITLE}</h2>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div>
          <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#EEF0FF] text-yunicity-primary">
            <Hourglass className="h-4 w-4" aria-hidden />
          </span>
          <p className="mt-2 text-xs font-semibold text-neutral-800">
            {PASSPORT_OFFER_CREATE_WORKFLOW_REVIEW}
          </p>
        </div>
        <div>
          <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
            <CheckCircle2 className="h-4 w-4" aria-hidden />
          </span>
          <p className="mt-2 text-xs font-medium text-neutral-500">
            {PASSPORT_OFFER_CREATE_WORKFLOW_APPROVED}
          </p>
        </div>
        <div>
          <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
            <Globe2 className="h-4 w-4" aria-hidden />
          </span>
          <p className="mt-2 text-xs font-medium text-neutral-500">
            {PASSPORT_OFFER_CREATE_WORKFLOW_PUBLISHED}
          </p>
        </div>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-neutral-500">{PASSPORT_OFFER_CREATE_WORKFLOW_BODY}</p>
    </section>
  );
}
