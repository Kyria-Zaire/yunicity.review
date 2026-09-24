"use client";

import {
  PASSPORT_OFFER_DETAIL_RULES,
  PASSPORT_OFFER_DETAIL_VALIDATION_BODY,
  PASSPORT_OFFER_DETAIL_VALIDATION_BODY_MOBILE,
  PASSPORT_OFFER_DETAIL_VALIDATION_TITLE,
} from "@yunicity/utils";
import { ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";

export function PassportOfferValidationCard() {
  return (
    <section
      className="feed-desktop-surface p-5 passport-offer-area-validation"
      aria-labelledby="passport-offer-validation-title"
      data-passport-offer-validation=""
    >
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-yunicity-primary" aria-hidden />
        <div>
          <h2 id="passport-offer-validation-title" className="text-lg font-bold text-neutral-900">
            {PASSPORT_OFFER_DETAIL_VALIDATION_TITLE}
          </h2>
          <p className="passport-offer-validation-body-desktop mt-2 text-sm leading-relaxed text-neutral-600">
            {PASSPORT_OFFER_DETAIL_VALIDATION_BODY}
          </p>
          <p className="passport-offer-validation-body-mobile mt-2 text-sm leading-relaxed text-neutral-600">
            {PASSPORT_OFFER_DETAIL_VALIDATION_BODY_MOBILE}
          </p>
          <Link
            href="/passport#passport-desktop-how"
            className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-yunicity-primary hover:underline"
          >
            {PASSPORT_OFFER_DETAIL_RULES}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
