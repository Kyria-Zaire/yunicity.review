"use client";

import type { AdminModerationListState } from "@/lib/moderation-url";
import {
  ADMIN_REPORT_REASON_FILTER_OPTIONS,
  ADMIN_REPORT_STATUS_FILTER_OPTIONS,
} from "@yunicity/utils";

interface ModerationFiltersProps {
  state: AdminModerationListState;
  isLoading: boolean;
  onStatusChange: (status: AdminModerationListState["status"]) => void;
  onReasonChange: (reason: AdminModerationListState["reason"]) => void;
}

export function ModerationFilters({
  state,
  isLoading,
  onStatusChange,
  onReasonChange,
}: ModerationFiltersProps) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="text-xs font-medium uppercase tracking-wide text-stone-500">
            Statut
          </span>
          <select
            value={state.status}
            disabled={isLoading}
            onChange={(event) =>
              onStatusChange(event.target.value as AdminModerationListState["status"])
            }
            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900"
          >
            {ADMIN_REPORT_STATUS_FILTER_OPTIONS.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-xs font-medium uppercase tracking-wide text-stone-500">
            Motif
          </span>
          <select
            value={state.reason}
            disabled={isLoading}
            onChange={(event) =>
              onReasonChange(event.target.value as AdminModerationListState["reason"])
            }
            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900"
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
