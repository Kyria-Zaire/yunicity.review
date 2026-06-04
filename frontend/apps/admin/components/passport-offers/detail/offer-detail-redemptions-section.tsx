"use client";

import { PassportOpsPagination } from "@/components/passport-ops/passport-ops-pagination";
import type { PartnerOfferAdminRedemptionItem } from "@yunicity/types";
import {
  buildPassportOpsDetailPath,
  formatOfferDate,
  offerRedemptionChannelLabel,
  offerRedemptionStatusLabel,
} from "@yunicity/utils";
import Link from "next/link";

interface OfferDetailRedemptionsSectionProps {
  items: PartnerOfferAdminRedemptionItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onPageChange: (page: number) => void;
}

function citizenLabel(item: PartnerOfferAdminRedemptionItem): string {
  const { display_name: displayName, email } = item.citizen;
  if (displayName?.trim()) {
    return displayName;
  }
  return email;
}

export function OfferDetailRedemptionsSection({
  items,
  total,
  page,
  pageSize,
  totalPages,
  isLoading,
  error,
  onRetry,
  onPageChange,
}: OfferDetailRedemptionsSectionProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
        Historique des utilisations
      </h2>

      {isLoading ? (
        <p className="text-sm text-stone-500">Chargement de l&apos;historique…</p>
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
          <p className="text-sm font-medium text-stone-900">Aucune utilisation enregistrée</p>
          <p className="mt-2 text-sm text-stone-500">
            Les redemptions citoyennes ou scan partenaire apparaîtront ici.
          </p>
        </div>
      ) : null}

      {!isLoading && !error && items.length > 0 ? (
        <>
          <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px] text-left text-sm">
                <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Passport</th>
                    <th className="px-4 py-3 font-medium">Citoyen</th>
                    <th className="px-4 py-3 font-medium">Canal</th>
                    <th className="px-4 py-3 font-medium">Statut</th>
                    <th className="px-4 py-3 font-medium">Validée le</th>
                    <th className="px-4 py-3 font-medium">Liens</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {items.map((redemption) => (
                    <tr key={redemption.id} className="hover:bg-stone-50/80">
                      <td className="px-4 py-3 font-mono text-xs text-stone-900">
                        {redemption.passport.passport_number}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-stone-900">{citizenLabel(redemption)}</p>
                        {redemption.citizen.display_name?.trim() ? (
                          <p className="text-xs text-stone-500">{redemption.citizen.email}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-stone-700">
                        {offerRedemptionChannelLabel(redemption.channel)}
                      </td>
                      <td className="px-4 py-3 text-stone-600">
                        {offerRedemptionStatusLabel(redemption.status)}
                      </td>
                      <td className="px-4 py-3 text-xs text-stone-500">
                        {formatOfferDate(redemption.redeemed_at)}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={buildPassportOpsDetailPath(redemption.passport.id)}
                          className="text-xs font-medium text-stone-800 underline-offset-2 hover:underline"
                        >
                          Passport Ops
                        </Link>
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
