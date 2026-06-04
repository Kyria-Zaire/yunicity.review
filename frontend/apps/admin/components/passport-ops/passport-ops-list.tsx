"use client";

import { PassportStatusBadge } from "@/components/passport-ops/passport-status-badge";
import type { AdminPassportListItem } from "@yunicity/types";
import {
  adminPassportTierLabel,
  buildPassportOpsDetailPath,
  formatPassportDate,
} from "@yunicity/utils";
import Link from "next/link";

interface PassportOpsListProps {
  items: AdminPassportListItem[];
  isLoading: boolean;
  error: string | null;
  hasSearchQuery: boolean;
  onRetry: () => void;
}

function displayName(item: AdminPassportListItem): string {
  return item.user.display_name?.trim() || "—";
}

export function PassportOpsList({
  items,
  isLoading,
  error,
  hasSearchQuery,
  onRetry,
}: PassportOpsListProps) {
  if (isLoading) {
    return <p className="text-sm text-stone-500">Chargement des Passports…</p>;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
        {error}
        <button
          type="button"
          onClick={() => void onRetry()}
          className="ml-3 font-medium underline"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-200 bg-white px-6 py-16 text-center">
        <p className="text-lg font-medium text-stone-900">
          {hasSearchQuery ? "Aucun Passport pour cette recherche" : "Aucun Passport à afficher"}
        </p>
        <p className="mt-2 text-sm text-stone-500">
          {hasSearchQuery
            ? "Vérifiez l’email, le numéro complet, au moins 2 caractères pour le nom, ou un fragment QR d’au moins 12 caractères."
            : "Aucun citoyen enregistré pour cette ville avec les filtres actuels."}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-4 py-3 font-medium">N° Passport</th>
              <th className="px-4 py-3 font-medium">Citoyen</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Ville</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3 font-medium">Palier</th>
              <th className="px-4 py-3 font-medium">Tampons</th>
              <th className="px-4 py-3 font-medium">Redemptions</th>
              <th className="px-4 py-3 font-medium">Activé</th>
              <th className="px-4 py-3 font-medium">Suspendu</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-stone-50/80">
                <td className="px-4 py-3 font-mono text-xs text-stone-800">
                  {item.passport_number}
                </td>
                <td className="px-4 py-3 font-medium text-stone-900">{displayName(item)}</td>
                <td className="px-4 py-3 text-stone-600">{item.user.email}</td>
                <td className="px-4 py-3 text-stone-500">{item.city}</td>
                <td className="px-4 py-3">
                  <PassportStatusBadge status={item.status} />
                </td>
                <td className="px-4 py-3 text-stone-700">
                  {adminPassportTierLabel(item.tier_code)}
                </td>
                <td className="px-4 py-3 tabular-nums text-stone-700">{item.stamps_count}</td>
                <td className="px-4 py-3 tabular-nums text-stone-700">
                  {item.redemptions_count}
                </td>
                <td className="px-4 py-3 text-stone-500 text-xs">
                  {formatPassportDate(item.activated_at)}
                </td>
                <td className="px-4 py-3 text-stone-500 text-xs">
                  {formatPassportDate(item.suspended_at)}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={buildPassportOpsDetailPath(item.id)}
                    className="inline-flex rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-800 hover:bg-stone-50"
                  >
                    Ouvrir
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
