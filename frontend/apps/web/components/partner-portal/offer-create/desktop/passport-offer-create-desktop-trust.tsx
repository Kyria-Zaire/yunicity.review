"use client";

import {
  PASSPORT_OFFER_CREATE_TRUST_BODY,
  PASSPORT_OFFER_CREATE_HONEST_OFFER_TITLE,
  PASSPORT_OFFER_CREATE_TRUST_TITLE,
} from "@yunicity/utils";
import { ShieldCheck } from "lucide-react";

type PassportOfferCreateDesktopTrustProps = {
  variant?: "desktop" | "medium";
};

export function PassportOfferCreateDesktopTrust({ variant = "desktop" }: PassportOfferCreateDesktopTrustProps) {
  const title =
    variant === "medium" ? PASSPORT_OFFER_CREATE_HONEST_OFFER_TITLE : PASSPORT_OFFER_CREATE_TRUST_TITLE;

  return (
    <section
      className="rounded-2xl border border-yunicity-primary/20 bg-[#EEF0FF]/50 p-4"
      data-passport-offer-create-trust=""
    >
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-yunicity-primary" aria-hidden />
        <div>
          <h2 className="text-sm font-bold text-neutral-900">{title}</h2>
          <p className="mt-1 text-xs leading-relaxed text-neutral-600">
            {PASSPORT_OFFER_CREATE_TRUST_BODY}
          </p>
        </div>
      </div>
    </section>
  );
}
