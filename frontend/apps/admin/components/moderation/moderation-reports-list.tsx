"use client";

import type { AdminModerationListState } from "@/lib/moderation-url";
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
import Link from "next/link";

interface ModerationReportsListProps {
  items: AdminReportListItem[];
  listSearchQuery: URLSearchParams;
  state: AdminModerationListState;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function ModerationReportsList({
  items,
  listSearchQuery,
  isLoading,
  error,
  onRetry,
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
    return (
      <div className="rounded-2xl border border-dashed border-stone-200 bg-white px-6 py-12 text-center">
        <p className="text-sm font-medium text-stone-900">Aucun signalement pour ce filtre</p>
        <p className="mt-2 text-sm text-stone-500">
          Ajustez le statut ou le motif, ou revenez plus tard.
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
              <th className="px-4 py-3 font-medium">Report ID</th>
              <th className="px-4 py-3 font-medium">Motif</th>
              <th className="px-4 py-3 font-medium">Reporter</th>
              <th className="px-4 py-3 font-medium">Target Type</th>
              <th className="px-4 py-3 font-medium">Target ID</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3 font-medium">Créé le</th>
              <th className="px-4 py-3 font-medium">Voir</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-stone-50/80">
                <td className="px-4 py-3 font-mono text-xs text-stone-600" title={item.id}>
                  {truncateReportId(item.id)}
                </td>
                <td className="px-4 py-3 text-stone-800">{adminReportReasonLabel(item.reason)}</td>
                <td className="px-4 py-3 text-stone-700">
                  <div className="flex flex-col gap-0.5">
                    <span>{adminReportReporterLabel(item.reporter)}</span>
                    {item.reporter.display_name?.trim() ? (
                      <span className="text-xs text-stone-500">{item.reporter.email}</span>
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-3 text-stone-700">
                  {adminReportTargetTypeLabel(item.target_type)}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-stone-600" title={item.target_id}>
                  {truncateReportId(item.target_id)}
                </td>
                <td className="px-4 py-3 text-stone-700">{adminReportStatusLabel(item.status)}</td>
                <td className="px-4 py-3 text-xs text-stone-500">
                  {formatModerationDate(item.created_at)}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={buildModerationReportDetailPath(item.id, listSearchQuery)}
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
