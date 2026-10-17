"use client";

import type { PassportOfferCreateDraft } from "@yunicity/utils";
import {
  PASSPORT_OFFER_CREATE_CHECKLIST_ITEMS,
  PASSPORT_OFFER_CREATE_CHECKLIST_READY,
  PASSPORT_OFFER_CREATE_CHECKLIST_TITLE,
  passportOfferCreateChecklistState,
} from "@yunicity/utils";
import { CheckCircle2, Circle } from "lucide-react";

type PassportOfferCreateDesktopChecklistProps = {
  draft: PassportOfferCreateDraft;
  hasPartner: boolean;
};

export function PassportOfferCreateDesktopChecklist({
  draft,
  hasPartner,
}: PassportOfferCreateDesktopChecklistProps) {
  const state = passportOfferCreateChecklistState(draft, hasPartner);
  const readyCount = PASSPORT_OFFER_CREATE_CHECKLIST_ITEMS.filter((item) => state[item.key]).length;

  return (
    <section
      className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm"
      data-passport-offer-create-checklist=""
    >
      <h2 className="text-sm font-bold text-neutral-900">{PASSPORT_OFFER_CREATE_CHECKLIST_TITLE}</h2>
      <ul className="mt-3 space-y-2.5">
        {PASSPORT_OFFER_CREATE_CHECKLIST_ITEMS.map((item) => {
          const done = state[item.key];
          return (
            <li key={item.key} className="flex items-start gap-2 text-sm">
              {done ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden />
              ) : (
                <Circle className="mt-0.5 h-4 w-4 shrink-0 text-neutral-300" aria-hidden />
              )}
              <span className={done ? "font-medium text-neutral-800" : "text-neutral-500"}>
                {item.label}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-xs font-semibold text-emerald-600">
        {PASSPORT_OFFER_CREATE_CHECKLIST_READY(readyCount)}
      </p>
    </section>
  );
}
