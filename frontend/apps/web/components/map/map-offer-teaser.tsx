"use client";

import type { PartnerOffer } from "@yunicity/types";
import { MAP_OFFER_CTA, MAP_OFFER_EMPTY, MAP_OFFER_TITLE, formatOfferValidUntil } from "@yunicity/utils";
import Link from "next/link";

export function MapOfferTeaser({ offer }: { offer: PartnerOffer | null }) {
  return (
    <section className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="text-sm font-semibold text-neutral-900">{MAP_OFFER_TITLE}</h2>
      {offer ? (
        <div className="mt-3 space-y-2">
          <p className="font-medium text-neutral-900">{offer.title}</p>
          {offer.description ? (
            <p className="line-clamp-2 text-sm text-neutral-600">{offer.description}</p>
          ) : null}
          {offer.valid_until ? (
            <p className="text-xs text-neutral-500">{formatOfferValidUntil(offer.valid_until)}</p>
          ) : null}
          <Link
            href="/passport"
            className="inline-flex rounded-full bg-yunicity-primary px-4 py-2 text-sm font-semibold text-white hover:bg-yunicity-primary-hover"
          >
            {MAP_OFFER_CTA}
          </Link>
        </div>
      ) : (
        <p className="mt-3 text-sm text-neutral-500">{MAP_OFFER_EMPTY}</p>
      )}
    </section>
  );
}
