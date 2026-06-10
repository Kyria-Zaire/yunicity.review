"use client";

import { PassportStatusBadge } from "@/components/passport-ops/passport-status-badge";
import type { AdminPassportListItem } from "@yunicity/types";
import {
  adminPassportTierLabel,
  buildPassportOpsDetailPath,
  formatPassportDate,
  passportOpsCitizenInitials,
  passportOpsLastActivityAt,
} from "@yunicity/utils";
import { Eye, MoreHorizontal, QrCode, UserCog } from "lucide-react";
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
    <div
      id="passport-registry"
      className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm"
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px] text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-[11px] uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-4 py-3 font-medium">N° Passport</th>
              <th className="px-4 py-3 font-medium">Citoyen</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Ville</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3 font-medium">Palier</th>
              <th className="px-4 py-3 font-medium">Tampons</th>
              <th className="px-4 py-3 font-medium">Rédemptions</th>
              <th className="px-4 py-3 font-medium">Dernière activité</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {items.map((item) => {
              const detailHref = buildPassportOpsDetailPath(item.id);
              const initials = passportOpsCitizenInitials(
                item.user.display_name,
                item.user.email,
              );
              const lastActivity = passportOpsLastActivityAt(item);

              return (
                <tr key={item.id} className="hover:bg-stone-50/80">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 font-mono text-xs text-stone-800">
                      <span>{item.passport_number}</span>
                      <QrCode
                        className="h-3.5 w-3.5 shrink-0 text-yunicity-primary"
                        aria-hidden
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-yunicity-primary-soft text-xs font-semibold text-yunicity-primary"
                        aria-hidden
                      >
                        {initials}
                      </span>
                      <span className="font-medium text-stone-900">{displayName(item)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-stone-600">{item.user.email}</td>
                  <td className="px-4 py-3 text-stone-500">{item.city}</td>
                  <td className="px-4 py-3">
                    <PassportStatusBadge status={item.status} showDot />
                  </td>
                  <td className="px-4 py-3 text-stone-700">
                    {adminPassportTierLabel(item.tier_code)}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-stone-700">{item.stamps_count}</td>
                  <td className="px-4 py-3 tabular-nums text-stone-700">
                    {item.redemptions_count}
                  </td>
                  <td className="px-4 py-3 text-xs text-stone-500">
                    {formatPassportDate(lastActivity)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Link
                        href={detailHref}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50"
                        aria-label={`Voir le Passport ${item.passport_number}`}
                      >
                        <Eye className="h-4 w-4" aria-hidden />
                      </Link>
                      <Link
                        href={`${detailHref}#actions`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50"
                        aria-label={`Gérer le Passport ${item.passport_number}`}
                      >
                        <UserCog className="h-4 w-4" aria-hidden />
                      </Link>
                      <Link
                        href={detailHref}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50"
                        aria-label={`Options pour ${item.passport_number}`}
                      >
                        <MoreHorizontal className="h-4 w-4" aria-hidden />
                      </Link>
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
