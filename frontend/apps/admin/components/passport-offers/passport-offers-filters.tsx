"use client";

import type {
  AdminOfferStatusFilter,
  AdminOfferTypeFilter,
  PassportOffersListState,
} from "@/lib/passport-offers-url";
import type { VerifiedOrganizationOption } from "@yunicity/types";
import { ADMIN_OFFER_STATUS_FILTER_OPTIONS, PARTNER_OFFER_TYPE_LABELS } from "@yunicity/utils";

const TYPE_OPTIONS: { value: AdminOfferTypeFilter; label: string }[] = [
  { value: "", label: "Tous les types" },
  ...(
    Object.entries(PARTNER_OFFER_TYPE_LABELS) as [
      Exclude<AdminOfferTypeFilter, "">,
      string,
    ][]
  ).map(([value, label]) => ({ value, label })),
];

interface PassportOffersFiltersProps {
  state: PassportOffersListState;
  organizations: VerifiedOrganizationOption[];
  isLoading: boolean;
  onStatusChange: (status: AdminOfferStatusFilter) => void;
  onOrganizationChange: (organizationId: string) => void;
  onOfferTypeChange: (offerType: AdminOfferTypeFilter) => void;
  onRefresh: () => void;
}

export function PassportOffersFilters({
  state,
  organizations,
  isLoading,
  onStatusChange,
  onOrganizationChange,
  onOfferTypeChange,
  onRefresh,
}: PassportOffersFiltersProps) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="space-y-1">
          <span className="text-xs font-medium uppercase tracking-wide text-stone-500">
            Statut
          </span>
          <select
            value={state.status}
            onChange={(event) =>
              onStatusChange(event.target.value as AdminOfferStatusFilter)
            }
            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900"
          >
            {ADMIN_OFFER_STATUS_FILTER_OPTIONS.map((option) => (
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
            onChange={(event) => onOrganizationChange(event.target.value)}
            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900"
          >
            <option value="">Toutes les organisations</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-xs font-medium uppercase tracking-wide text-stone-500">
            Type
          </span>
          <select
            value={state.offerType}
            onChange={(event) =>
              onOfferTypeChange(event.target.value as AdminOfferTypeFilter)
            }
            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900"
          >
            {TYPE_OPTIONS.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-end">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => void onRefresh()}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50 disabled:opacity-50"
          >
            Actualiser
          </button>
        </div>
      </div>
    </section>
  );
}
