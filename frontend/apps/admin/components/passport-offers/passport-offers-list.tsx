"use client";

import { OfferReadinessBadge } from "@/components/passport-offers/offer-readiness-badge";
import { OfferStatusBadge } from "@/components/offer-status-badge";
import type { AdminOfferListItem } from "@yunicity/types";
import {
  buildOfferDetailPathWithListContext,
  canApproveOffer,
  canArchiveOffer,
  canRejectOffer,
  formatOfferDate,
  PARTNER_OFFER_TYPE_LABELS,
} from "@yunicity/utils";
import { Archive, Check, Eye, X } from "lucide-react";
import Link from "next/link";

interface PassportOffersListProps {
  items: AdminOfferListItem[];
  listSearchQuery: URLSearchParams;
  isLoading: boolean;
  error: string | null;
  hasActiveFilters: boolean;
  catalogueIsEmpty: boolean;
  onRetry: () => void;
  onResetFilters: () => void;
}

export function PassportOffersList({
  items,
  listSearchQuery,
  isLoading,
  error,
  hasActiveFilters,
  catalogueIsEmpty,
  onRetry,
  onResetFilters,
}: PassportOffersListProps) {
  if (isLoading) {
    return <p className="text-sm text-stone-500">Chargement des offres…</p>;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
        {error}
        <button type="button" onClick={() => void onRetry()} className="ml-3 font-medium underline">
          Réessayer
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    if (!hasActiveFilters && catalogueIsEmpty) {
      return (
        <div className="rounded-2xl border border-dashed border-stone-200 bg-white px-6 py-16 text-center">
          <p className="text-lg font-medium text-stone-900">
            Le catalogue Passport est prêt à accueillir ses premières offres.
          </p>
          <p className="mt-2 text-sm text-stone-500">
            Ajoutez des avantages proposés par les partenaires pour encourager les citoyens à
            utiliser leur Passport.
          </p>
          <Link
            href="/passport-offers/new"
            className="mt-6 inline-flex rounded-xl bg-yunicity-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:opacity-95"
          >
            Créer une offre
          </Link>
        </div>
      );
    }

    return (
      <div className="rounded-2xl border border-dashed border-stone-200 bg-white px-6 py-16 text-center">
        <p className="text-lg font-medium text-stone-900">
          Aucune offre ne correspond à ces critères.
        </p>
        <p className="mt-2 text-sm text-stone-500">
          Modifiez les filtres ou revenez à l&apos;ensemble du catalogue.
        </p>
        <button
          type="button"
          onClick={onResetFilters}
          className="mt-6 inline-flex rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-800 shadow-sm hover:bg-stone-50"
        >
          Réinitialiser les filtres
        </button>
      </div>
    );
  }

  return (
    <div
      id="passport-offers-registry"
      className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm"
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1200px] text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-[11px] uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-4 py-3 font-medium">Offre</th>
              <th className="px-4 py-3 font-medium">Partenaire</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Préparation</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3 font-medium">Validité</th>
              <th className="px-4 py-3 font-medium">Utilisations</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {items.map((offer) => {
              const detailHref = buildOfferDetailPathWithListContext(offer.id, listSearchQuery);
              const typeLabel = PARTNER_OFFER_TYPE_LABELS[offer.offer_type] ?? offer.offer_type;
              const validity = `${formatOfferDate(offer.valid_from)} → ${formatOfferDate(offer.valid_until)}`;

              return (
                <tr key={offer.id} className="hover:bg-stone-50/80">
                  <td className="px-4 py-3">
                    <p className="font-medium text-stone-900">{offer.title}</p>
                    {offer.description ? (
                      <p className="mt-0.5 line-clamp-1 text-xs text-stone-500">
                        {offer.description}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-stone-700">{offer.organization.name}</td>
                  <td className="px-4 py-3 text-stone-600">{typeLabel}</td>
                  <td className="px-4 py-3">
                    <OfferReadinessBadge readiness={offer.readiness.readiness} />
                  </td>
                  <td className="px-4 py-3">
                    <OfferStatusBadge status={offer.offer_status} />
                  </td>
                  <td className="px-4 py-3 text-xs text-stone-500">{validity}</td>
                  <td className="px-4 py-3 tabular-nums text-stone-700">
                    {offer.redemptions_count}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Link
                        href={detailHref}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50"
                        aria-label={`Ouvrir ${offer.title}`}
                      >
                        <Eye className="h-4 w-4" aria-hidden />
                      </Link>
                      {canApproveOffer(offer.offer_status) ? (
                        <Link
                          href={detailHref}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          aria-label={`Approuver ${offer.title}`}
                          title="Approuver"
                        >
                          <Check className="h-4 w-4" aria-hidden />
                        </Link>
                      ) : null}
                      {canRejectOffer(offer.offer_status) ? (
                        <Link
                          href={detailHref}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50"
                          aria-label={`Rejeter ${offer.title}`}
                          title="Rejeter"
                        >
                          <X className="h-4 w-4" aria-hidden />
                        </Link>
                      ) : null}
                      {canArchiveOffer(offer.offer_status) ? (
                        <Link
                          href={detailHref}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50"
                          aria-label={`Archiver ${offer.title}`}
                          title="Archiver"
                        >
                          <Archive className="h-4 w-4" aria-hidden />
                        </Link>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
