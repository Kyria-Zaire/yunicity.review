"use client";

import type { AdminReportListItem } from "@yunicity/types";
import {
  adminReportReasonLabel,
  adminReportReporterLabel,
  adminReportStatusLabel,
  adminReportTargetTypeLabel,
  buildModerationReportDetailPath,
  formatModerationDate,
  truncateReportId,
} from "@yunicity/utils";
import { Eye } from "lucide-react";
import Link from "next/link";

interface ModerationReportsListProps {
  items: AdminReportListItem[];
  listSearchQuery: URLSearchParams;
  isLoading: boolean;
  error: string | null;
  hasActiveFilters: boolean;
  trustSafetyIsEmpty: boolean;
  onRetry: () => void;
  onResetFilters: () => void;
}

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "pending"
      ? "bg-amber-50 text-amber-900 ring-amber-200"
      : status === "dismissed"
        ? "bg-stone-100 text-stone-700 ring-stone-200"
        : status === "action_taken"
          ? "bg-rose-50 text-rose-900 ring-rose-200"
          : "bg-emerald-50 text-emerald-900 ring-emerald-200";

  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${tone}`}
    >
      {adminReportStatusLabel(status)}
    </span>
  );
}

export function ModerationReportsList({
  items,
  listSearchQuery,
  isLoading,
  error,
  hasActiveFilters,
  trustSafetyIsEmpty,
  onRetry,
  onResetFilters,
}: ModerationReportsListProps) {
  if (isLoading) {
    return <p className="text-sm text-stone-500">Chargement des signalements…</p>;
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
    if (!hasActiveFilters && trustSafetyIsEmpty) {
      return (
        <div className="rounded-2xl border border-dashed border-stone-200 bg-white px-6 py-16 text-center">
          <p className="text-lg font-medium text-stone-900">
            Aucun signalement citoyen pour le moment.
          </p>
          <p className="mt-2 text-sm text-stone-500">
            La communauté est calme. Les signalements apparaîtront ici dès qu&apos;un contenu sera
            remonté.
          </p>
          <Link
            href="/creator-content"
            className="mt-6 inline-flex rounded-xl bg-yunicity-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:opacity-95"
          >
            Voir les contenus créateurs
          </Link>
        </div>
      );
    }

    return (
      <div className="rounded-2xl border border-dashed border-stone-200 bg-white px-6 py-16 text-center">
        <p className="text-lg font-medium text-stone-900">
          Aucun signalement ne correspond à ces critères.
        </p>
        <p className="mt-2 text-sm text-stone-500">
          Modifiez les filtres ou revenez à l&apos;ensemble de la file.
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
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-4 py-3 font-medium">Signalement</th>
              <th className="px-4 py-3 font-medium">Motif</th>
              <th className="px-4 py-3 font-medium">Cible</th>
              <th className="px-4 py-3 font-medium">Auteur du signalement</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-stone-50/80">
                <td className="px-4 py-3">
                  <span className="font-mono text-xs text-stone-600" title={item.id}>
                    {truncateReportId(item.id)}
                  </span>
                </td>
                <td className="px-4 py-3 text-stone-800">{adminReportReasonLabel(item.reason)}</td>
                <td className="px-4 py-3 text-stone-700">
                  <div className="flex flex-col gap-0.5">
                    <span>{adminReportTargetTypeLabel(item.target_type)}</span>
                    <span className="font-mono text-xs text-stone-500" title={item.target_id}>
                      {truncateReportId(item.target_id)}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-stone-700">
                  <div className="flex flex-col gap-0.5">
                    <span>{adminReportReporterLabel(item.reporter)}</span>
                    {item.reporter.display_name?.trim() ? (
                      <span className="text-xs text-stone-500">{item.reporter.email}</span>
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={item.status} />
                </td>
                <td className="px-4 py-3 text-xs text-stone-500">
                  {formatModerationDate(item.created_at)}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={buildModerationReportDetailPath(item.id, listSearchQuery)}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-yunicity-primary hover:underline"
                  >
                    <Eye className="h-4 w-4" aria-hidden />
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
