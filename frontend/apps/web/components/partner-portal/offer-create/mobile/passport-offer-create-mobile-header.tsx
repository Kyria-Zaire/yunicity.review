"use client";

import {
  PASSPORT_OFFER_CREATE_BREADCRUMB_NEW,
  PASSPORT_OFFER_CREATE_MOBILE_BACK,
  PASSPORT_OFFER_CREATE_MOBILE_MENU,
  buildPartnerPortalOffersHref,
} from "@yunicity/utils";
import { ArrowLeft, MoreVertical } from "lucide-react";
import Link from "next/link";

type PassportOfferCreateMobileHeaderProps = {
  onBack: () => void;
};

export function PassportOfferCreateMobileHeader({ onBack }: PassportOfferCreateMobileHeaderProps) {
  return (
    <header
      className="sticky top-0 z-[var(--z-chrome)] border-b border-neutral-200/80 bg-white pt-[env(safe-area-inset-top)]"
      data-passport-offer-create-mobile-header=""
    >
      <div className="grid grid-cols-[2.5rem_1fr_2.5rem] items-center px-3 py-2.5">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-neutral-800 transition hover:bg-neutral-100"
          aria-label={PASSPORT_OFFER_CREATE_MOBILE_BACK}
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2} aria-hidden />
        </button>
        <h1 className="text-center text-base font-semibold text-neutral-900">
          {PASSPORT_OFFER_CREATE_BREADCRUMB_NEW}
        </h1>
        <Link
          href={buildPartnerPortalOffersHref()}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-neutral-700 transition hover:bg-neutral-100"
          aria-label={PASSPORT_OFFER_CREATE_MOBILE_MENU}
        >
          <MoreVertical className="h-5 w-5" aria-hidden />
        </Link>
      </div>
    </header>
  );
}
