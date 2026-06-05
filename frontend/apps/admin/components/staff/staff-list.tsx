"use client";

import type { AdminStaffListState } from "@/lib/staff-url";
import type { AdminStaffListItem } from "@yunicity/types";
import {
  buildStaffDetailPath,
  formatStaffDate,
  formatStaffRolesList,
  staffStatusLabel,
} from "@yunicity/utils";
import Link from "next/link";

interface StaffListProps {
  items: AdminStaffListItem[];
  listSearchQuery: URLSearchParams;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function StaffList({ items, listSearchQuery, isLoading, error, onRetry }: StaffListProps) {
  if (isLoading) {
    return <p className="text-sm text-stone-500">Chargement des comptes staff…</p>;
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
        <p className="text-sm font-medium text-stone-900">Aucun compte staff pour ce filtre</p>
        <p className="mt-2 text-sm text-stone-500">Ajustez le rôle ou le statut du compte.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-4 py-3 font-medium">Nom</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Rôle(s)</th>
              <th className="px-4 py-3 font-medium">Permissions</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3 font-medium">Créé le</th>
              <th className="px-4 py-3 font-medium">Voir</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-stone-50/80">
                <td className="px-4 py-3 font-medium text-stone-900">{item.full_name}</td>
                <td className="px-4 py-3 text-stone-700">{item.email}</td>
                <td className="px-4 py-3 text-stone-700">{formatStaffRolesList(item.roles)}</td>
                <td className="px-4 py-3 tabular-nums text-stone-700">
                  {item.permissions.length}
                </td>
                <td className="px-4 py-3 text-stone-700">{staffStatusLabel(item.is_active)}</td>
                <td className="px-4 py-3 text-xs text-stone-500">
                  {formatStaffDate(item.created_at)}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={buildStaffDetailPath(item.id, listSearchQuery)}
                    className="text-sm font-medium text-stone-900 underline-offset-2 hover:underline"
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
