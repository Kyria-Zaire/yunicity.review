"use client";

import type { PartnerOffer } from "@yunicity/types";
import {
  PARTNER_OFFER_TYPE_LABELS,
  PASSPORT_CITIZEN_OFFERS_EMPTY,
} from "@yunicity/utils";
import { FlashOfferBadge } from "@/components/feed/flash-offer-badge";
import { yunicityBtnPrimary } from "@/lib/brand-classes";

type PassportOffersListProps = {
  offers: PartnerOffer[];
  isLoading: boolean;
  message: string | null;
  redeemingId: string | null;
  onRedeem: (offerId: string) => void;
};

export function PassportOffersList({
  offers,
  isLoading,
  message,
  redeemingId,
  onRedeem,
}: PassportOffersListProps) {
  return (
    <section>
      <h3 className="text-xl font-bold text-neutral-900">Mes privilèges</h3>
      <p className="mt-1 text-sm text-neutral-600">Offres partenaires actives autour de vous.</p>
      {message ? <p className="mt-2 text-sm text-emerald-700">{message}</p> : null}
      {isLoading ? (
        <p className="mt-4 text-sm text-neutral-500">Chargement…</p>
      ) : offers.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-6 text-sm text-neutral-600">
          {PASSPORT_CITIZEN_OFFERS_EMPTY}
        </p>
      ) : (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {offers.map((offer) => (
            <li key={offer.id} className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
              <FlashOfferBadge offer={offer} />
              <p className="text-xs font-semibold uppercase text-yunicity-primary">
                {PARTNER_OFFER_TYPE_LABELS[offer.offer_type]}
              </p>
              <p className="mt-1 font-semibold text-neutral-900">{offer.title}</p>
              <p className="text-sm text-neutral-500">{offer.organization.name}</p>
              <button
                type="button"
                onClick={() => onRedeem(offer.id)}
                disabled={redeemingId === offer.id}
                className={`mt-3 rounded-full px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${yunicityBtnPrimary}`}
              >
                {redeemingId === offer.id ? "…" : "Utiliser"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
