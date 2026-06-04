"use client";

import { OfferStatusBadge } from "@/components/offer-status-badge";
import type { PartnerOfferAdmin } from "@yunicity/types";
import { buildOffersListBackPath } from "@yunicity/utils";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

interface OfferDetailHeaderProps {
  offer: PartnerOfferAdmin;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export function OfferDetailHeader({ offer, isRefreshing, onRefresh }: OfferDetailHeaderProps) {
  const searchParams = useSearchParams();
  const backHref = useMemo(() => buildOffersListBackPath(searchParams), [searchParams]);

  return (
    <header className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-200 pb-6">
      <div className="space-y-3">
        <Link
          href={backHref}
          className="text-sm font-medium text-stone-600 underline-offset-2 hover:text-stone-900 hover:underline"
        >
          ← Retour aux offres
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900">{offer.title}</h1>
          <p className="mt-1 text-sm text-stone-600">
            {offer.organization.name} · {offer.organization.city}
          </p>
        </div>
        <OfferStatusBadge status={offer.offer_status} />
      </div>
      <button
        type="button"
        onClick={onRefresh}
        disabled={isRefreshing}
        className="rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-800 shadow-sm hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isRefreshing ? "Actualisation…" : "Actualiser"}
      </button>
    </header>
  );
}
