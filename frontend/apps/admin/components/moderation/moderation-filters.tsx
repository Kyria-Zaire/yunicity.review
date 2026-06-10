"use client";

import type { AdminModerationListState } from "@/lib/moderation-url";
import {
  ADMIN_REPORT_REASON_FILTER_OPTIONS,
  ADMIN_REPORT_STATUS_FILTER_OPTIONS,
} from "@yunicity/utils";
import { RefreshCw } from "lucide-react";

interface ModerationFiltersProps {
  state: AdminModerationListState;
  isLoading: boolean;
  onStatusChange: (status: AdminModerationListState["status"]) => void;
  onReasonChange: (reason: AdminModerationListState["reason"]) => void;
  onRefresh: () => void;
}

export function ModerationFilters({
  state,
  isLoading,
  onStatusChange,
  onReasonChange,
  onRefresh,
}: ModerationFiltersProps) {
  return (
    <section className="space-y-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm md:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-stone-900">Piloter la file de modération</h2>
          <p className="mt-1 text-sm text-stone-600">
            Filtrez les signalements citoyens par statut et motif.
          </p>
        </div>
        <button
          type="button"
          disabled={isLoading}
          onClick={() => void onRefresh()}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-800 shadow-sm hover:bg-stone-50 disabled:opacity-60"
        >
          <RefreshCw className="h-4 w-4" aria-hidden />
          Actualiser
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="text-xs font-medium uppercase tracking-wide text-stone-500">Statut</span>
          <select
            value={state.status}
            disabled={isLoading}
            onChange={(event) =>
              onStatusChange(event.target.value as AdminModerationListState["status"])
            }
            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
          >
            {ADMIN_REPORT_STATUS_FILTER_OPTIONS.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-xs font-medium uppercase tracking-wide text-stone-500">Motif</span>
          <select
            value={state.reason}
            disabled={isLoading}
            onChange={(event) =>
              onReasonChange(event.target.value as AdminModerationListState["reason"])
            }
            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
          >
            {ADMIN_REPORT_REASON_FILTER_OPTIONS.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}
