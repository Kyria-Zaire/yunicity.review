"use client";

import type { AdminCreatorContentListState } from "@/lib/creator-content-url";
import type { VerifiedOrganizationOption } from "@yunicity/types";
import { ADMIN_CREATOR_CONTENT_STATUS_FILTER_OPTIONS } from "@yunicity/utils";

interface CreatorContentFiltersProps {
  state: AdminCreatorContentListState;
  organizations: VerifiedOrganizationOption[];
  isLoading: boolean;
  onStatusChange: (status: AdminCreatorContentListState["status"]) => void;
  onOrganizationChange: (organizationId: string) => void;
}

export function CreatorContentFilters({
  state,
  organizations,
  isLoading,
  onStatusChange,
  onOrganizationChange,
}: CreatorContentFiltersProps) {
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
              onStatusChange(event.target.value as AdminCreatorContentListState["status"])
            }
            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900"
          >
            {ADMIN_CREATOR_CONTENT_STATUS_FILTER_OPTIONS.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-xs font-medium uppercase tracking-wide text-stone-500">
            Organisation
          </span>
          <select
            value={state.organizationId}
            disabled={isLoading}
            onChange={(event) => onOrganizationChange(event.target.value)}
            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900"
          >
            <option value="">Toutes les organisations</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name} · {org.city}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}
