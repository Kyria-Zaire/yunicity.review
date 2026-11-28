"use client";

import {
  PASSPORT_OFFER_DETAIL_MOBILE_TITLE,
  PASSPORT_OFFER_DETAIL_SAVE,
  PASSPORT_OFFER_DETAIL_SAVED,
} from "@yunicity/utils";
import { ArrowLeft, Bookmark } from "lucide-react";
import Link from "next/link";

type PassportOfferMobileHeaderProps = {
  saved: boolean;
  onToggleSaved: () => void;
};

export function PassportOfferMobileHeader({ saved, onToggleSaved }: PassportOfferMobileHeaderProps) {
  return (
    <header
      className="sticky top-0 z-[var(--z-chrome)] border-b border-neutral-200/80 bg-white pt-[env(safe-area-inset-top)]"
      data-passport-offer-mobile-header=""
    >
      <div className="grid grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-center gap-2 px-3 py-2.5">
        <Link
          href="/passport"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-neutral-800 transition hover:bg-neutral-100"
          aria-label="Retour au Passport"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden />
        </Link>
        <h1 className="truncate text-center text-base font-bold text-neutral-900">
          {PASSPORT_OFFER_DETAIL_MOBILE_TITLE}
        </h1>
        <button
          type="button"
          onClick={onToggleSaved}
          aria-pressed={saved}
          aria-label={saved ? PASSPORT_OFFER_DETAIL_SAVED : PASSPORT_OFFER_DETAIL_SAVE}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-neutral-800 transition hover:bg-neutral-100"
        >
          <Bookmark className={`h-5 w-5 ${saved ? "fill-neutral-900" : ""}`} aria-hidden />
        </button>
      </div>
    </header>
  );
}
