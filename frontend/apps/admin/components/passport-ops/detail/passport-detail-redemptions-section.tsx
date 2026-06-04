"use client";

import { PassportOpsPagination } from "@/components/passport-ops/passport-ops-pagination";
import type { AdminPassportRedemptionItem } from "@yunicity/types";
import {
  buildPartnerDetailPath,
  buildPassportOfferAdminPath,
  formatPassportDate,
  offerRedemptionStatusLabel,
} from "@yunicity/utils";
import Link from "next/link";

interface PassportDetailRedemptionsSectionProps {
  items: AdminPassportRedemptionItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onPageChange: (page: number) => void;
}

export function PassportDetailRedemptionsSection({
  items,
  total,
  page,
  pageSize,
  totalPages,
  isLoading,
  error,
  onRetry,
  onPageChange,
}: PassportDetailRedemptionsSectionProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
        Redemptions
      </h2>

      {isLoading ? (
        <p className="text-sm text-stone-500">Chargement des redemptions…</p>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
          <button type="button" onClick={() => void onRetry()} className="ml-3 font-medium underline">
            Réessayer
          </button>
        </div>
      ) : null}

      {!isLoading && !error && items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-200 bg-white px-6 py-12 text-center">
          <p className="text-sm font-medium text-stone-900">Aucune redemption enregistrée</p>
        </div>
      ) : null}

      {!isLoading && !error && items.length > 0 ? (
        <>
          <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px] text-left text-sm">
                <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Offre</th>
                    <th className="px-4 py-3 font-medium">Partenaire</th>
                    <th className="px-4 py-3 font-medium">Statut</th>
                    <th className="px-4 py-3 font-medium">Validée le</th>
                    <th className="px-4 py-3 font-medium">Créée le</th>
                    <th className="px-4 py-3 font-medium">Liens</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {items.map((redemption) => (
                    <tr key={redemption.id} className="hover:bg-stone-50/80">
                      <td className="px-4 py-3 font-medium text-stone-900">
                        {redemption.offer_title}
                      </td>
                      <td className="px-4 py-3 text-stone-700">{redemption.organization_name}</td>
                      <td className="px-4 py-3 text-stone-600">
                        {offerRedemptionStatusLabel(redemption.status)}
                      </td>
                      <td className="px-4 py-3 text-stone-500 text-xs">
                        {formatPassportDate(redemption.redeemed_at)}
                      </td>
                      <td className="px-4 py-3 text-stone-500 text-xs">
                        {formatPassportDate(redemption.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <Link
                            href={buildPartnerDetailPath(redemption.organization_id)}
                            className="text-xs font-medium text-stone-800 underline-offset-2 hover:underline"
                          >
                            Partenaire
                          </Link>
                          <Link
                            href={buildPassportOfferAdminPath(redemption.offer_id)}
                            className="text-xs font-medium text-stone-800 underline-offset-2 hover:underline"
                          >
                            Offre admin
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <PassportOpsPagination
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={pageSize}
            isLoading={isLoading}
            onPageChange={onPageChange}
          />
        </>
      ) : null}
    </section>
  );
}
