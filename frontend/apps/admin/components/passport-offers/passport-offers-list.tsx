"use client";

import { OfferStatusBadge } from "@/components/offer-status-badge";
import { formatDateTime } from "@/lib/format";
import type { AdminOfferListItem } from "@yunicity/types";
import type { PassportTierCode } from "@yunicity/types";
import { adminPassportTierLabel, buildOfferDetailPathWithListContext } from "@yunicity/utils";
import Link from "next/link";

interface PassportOffersListProps {
  items: AdminOfferListItem[];
  listSearchQuery: URLSearchParams;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

function tierRequirementLabel(tierCode: string | null): string {
  if (!tierCode) {
    return "Tous niveaux";
  }
  return adminPassportTierLabel(tierCode as PassportTierCode);
}

export function PassportOffersList({
  items,
  listSearchQuery,
  isLoading,
  error,
  onRetry,
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
    return (
      <div className="rounded-2xl border border-dashed border-stone-200 bg-white px-6 py-12 text-center">
        <p className="text-sm font-medium text-stone-900">Aucune offre pour ce filtre</p>
        <p className="mt-2 text-sm text-stone-500">
          Ajustez le statut ou l&apos;organisation, ou revenez plus tard.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1080px] text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-4 py-3 font-medium">Offre</th>
              <th className="px-4 py-3 font-medium">Organisation</th>
              <th className="px-4 py-3 font-medium">Ville</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3 font-medium">Tier requis</th>
              <th className="px-4 py-3 font-medium">Redemptions</th>
              <th className="px-4 py-3 font-medium">Créée le</th>
              <th className="px-4 py-3 font-medium">Mise à jour</th>
              <th className="px-4 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {items.map((offer) => (
              <tr key={offer.id} className="hover:bg-stone-50/80">
                <td className="px-4 py-3 font-medium text-stone-900">{offer.title}</td>
                <td className="px-4 py-3 text-stone-700">{offer.organization.name}</td>
                <td className="px-4 py-3 text-stone-600">{offer.organization.city}</td>
                <td className="px-4 py-3">
                  <OfferStatusBadge status={offer.offer_status} />
                </td>
                <td className="px-4 py-3 text-stone-600">
                  {tierRequirementLabel(offer.tier_code_required)}
                </td>
                <td className="px-4 py-3 tabular-nums text-stone-700">
                  {offer.redemptions_count}
                </td>
                <td className="px-4 py-3 text-xs text-stone-500">
                  {formatDateTime(offer.created_at)}
                </td>
                <td className="px-4 py-3 text-xs text-stone-500">
                  {formatDateTime(offer.updated_at)}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={buildOfferDetailPathWithListContext(offer.id, listSearchQuery)}
                    className="text-sm font-medium text-stone-800 underline-offset-2 hover:underline"
                  >
                    Voir
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
