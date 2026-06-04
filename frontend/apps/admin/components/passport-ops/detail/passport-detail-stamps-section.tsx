"use client";

import { PassportOpsPagination } from "@/components/passport-ops/passport-ops-pagination";
import type { AdminPassportStampItem } from "@yunicity/types";
import {
  buildPartnerDetailPath,
  formatPassportDate,
  passportStampSourceLabel,
} from "@yunicity/utils";
import Link from "next/link";

interface PassportDetailStampsSectionProps {
  items: AdminPassportStampItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onPageChange: (page: number) => void;
}

export function PassportDetailStampsSection({
  items,
  total,
  page,
  pageSize,
  totalPages,
  isLoading,
  error,
  onRetry,
  onPageChange,
}: PassportDetailStampsSectionProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Tampons</h2>

      {isLoading ? (
        <p className="text-sm text-stone-500">Chargement des tampons…</p>
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
          <p className="text-sm font-medium text-stone-900">Aucun tampon enregistré</p>
        </div>
      ) : null}

      {!isLoading && !error && items.length > 0 ? (
        <>
          <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Partenaire</th>
                    <th className="px-4 py-3 font-medium">Source</th>
                    <th className="px-4 py-3 font-medium">Tamponné le</th>
                    <th className="px-4 py-3 font-medium">Créé le</th>
                    <th className="px-4 py-3 font-medium">Lien</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {items.map((stamp) => (
                    <tr key={stamp.id} className="hover:bg-stone-50/80">
                      <td className="px-4 py-3 font-medium text-stone-900">
                        {stamp.organization_name}
                      </td>
                      <td className="px-4 py-3 text-stone-600">
                        {passportStampSourceLabel(stamp.stamp_source)}
                      </td>
                      <td className="px-4 py-3 text-stone-500 text-xs">
                        {formatPassportDate(stamp.stamped_at)}
                      </td>
                      <td className="px-4 py-3 text-stone-500 text-xs">
                        {formatPassportDate(stamp.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={buildPartnerDetailPath(stamp.organization_id)}
                          className="text-xs font-medium text-stone-800 underline-offset-2 hover:underline"
                        >
                          Fiche partenaire
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
