"use client";

import type { PartnerOfferPublic } from "@yunicity/types";
import {
  EVENT_DETAIL_MOBILE_PASSPORT_ACTIVATE,
  EVENT_DETAIL_MOBILE_PASSPORT_EMPTY,
  EVENT_DETAIL_MOBILE_PASSPORT_MORE,
  EVENT_DETAIL_MOBILE_PASSPORT_TITLE,
} from "@yunicity/utils";
import { Crown } from "lucide-react";
import Link from "next/link";

type EventMobileDetailPassportOffersProps = {
  offers: PartnerOfferPublic[];
};

/** Bloc offres Passport mobile (MOBILE-SORTIR-02). */
export function EventMobileDetailPassportOffers({ offers }: EventMobileDetailPassportOffersProps) {
  const featured = offers.slice(0, 2);

  return (
    <section className="space-y-3 px-4" aria-label={EVENT_DETAIL_MOBILE_PASSPORT_TITLE}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <h2 className="text-base font-bold text-neutral-900">{EVENT_DETAIL_MOBILE_PASSPORT_TITLE}</h2>
          <Crown className="h-4 w-4 text-amber-500" aria-hidden />
        </div>
        <Link href="/passport" className="text-sm font-semibold text-yunicity-primary">
          {EVENT_DETAIL_MOBILE_PASSPORT_MORE}
        </Link>
      </div>

      {featured.length === 0 ? (
        <p className="rounded-2xl border border-neutral-200/80 bg-white px-4 py-3 text-sm text-neutral-500">
          {EVENT_DETAIL_MOBILE_PASSPORT_EMPTY}
        </p>
      ) : (
        <ul className="space-y-2">
          {featured.map((offer) => (
            <li
              key={offer.id}
              className="flex items-center gap-3 rounded-2xl border border-neutral-200/80 bg-white p-3"
            >
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-yunicity-primary text-xs font-bold text-white">
                {offer.value_label?.trim() || "—"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-bold text-neutral-900">{offer.title}</p>
                <p className="mt-0.5 text-xs text-neutral-500">Avec votre YuniPassport</p>
              </div>
              <Link
                href="/passport"
                className="shrink-0 rounded-full border border-yunicity-primary px-3 py-1.5 text-xs font-semibold text-yunicity-primary transition hover:bg-violet-50"
              >
                {EVENT_DETAIL_MOBILE_PASSPORT_ACTIVATE}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
