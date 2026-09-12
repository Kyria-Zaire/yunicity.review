"use client";

import {
  PASSPORT_DESKTOP_BREADCRUMB,
  PASSPORT_DESKTOP_EDITORIAL_BANNER,
  PASSPORT_DESKTOP_EDITORIAL_BODY,
  PASSPORT_DESKTOP_EDITORIAL_TITLE,
  PASSPORT_DESKTOP_OFFERS_TAB_BODY,
  PASSPORT_DESKTOP_OFFERS_TAB_TITLE,
  PASSPORT_MOBILE_OFFERS_TAB_BODY,
  PASSPORT_MOBILE_OFFERS_TAB_TITLE,
} from "@yunicity/utils";
import { ShieldCheck } from "lucide-react";

type PassportDesktopEditorialHeaderProps = {
  city: string;
  variant?: "overview" | "offers";
};

export function PassportDesktopEditorialHeader({
  city,
  variant = "overview",
}: PassportDesktopEditorialHeaderProps) {
  const isOffers = variant === "offers";

  return (
    <section className="space-y-2" aria-label="Passport" data-passport-desktop-editorial="">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-yunicity-primary">
          {PASSPORT_DESKTOP_BREADCRUMB(city)}
        </p>
        {isOffers ? (
          <>
            <h1 className="mt-2 text-2xl font-bold leading-tight tracking-tight text-neutral-900 sm:hidden">
              {PASSPORT_MOBILE_OFFERS_TAB_TITLE}
            </h1>
            <h1 className="mt-2 hidden text-2xl font-bold leading-tight tracking-tight text-neutral-900 sm:block sm:text-[1.75rem] lg:text-3xl">
              {PASSPORT_DESKTOP_OFFERS_TAB_TITLE}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600 sm:hidden">
              {PASSPORT_MOBILE_OFFERS_TAB_BODY}
            </p>
            <p className="mt-2 hidden max-w-2xl text-sm leading-relaxed text-neutral-600 sm:block">
              {PASSPORT_DESKTOP_OFFERS_TAB_BODY}
            </p>
          </>
        ) : (
          <>
            <h1 className="mt-2 text-2xl font-bold leading-tight tracking-tight text-neutral-900 sm:text-[1.75rem] lg:text-3xl">
              {PASSPORT_DESKTOP_EDITORIAL_TITLE}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-600">
              {PASSPORT_DESKTOP_EDITORIAL_BODY}
            </p>
          </>
        )}
      </div>

      {isOffers ? null : (
        <div className="inline-flex max-w-full items-start gap-2 rounded-2xl border border-[#DDE3FF] bg-[#F5F7FF] px-4 py-3">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-yunicity-primary" aria-hidden />
          <p className="text-sm font-medium text-neutral-800">{PASSPORT_DESKTOP_EDITORIAL_BANNER}</p>
        </div>
      )}
    </section>
  );
}
