"use client";

import type {
  AdminOfferStatusFilter,
  AdminOfferTypeFilter,
  PassportOffersListState,
} from "@/lib/passport-offers-url";
import type { VerifiedOrganizationOption } from "@yunicity/types";
import { ADMIN_OFFER_STATUS_FILTER_OPTIONS, PARTNER_OFFER_TYPE_LABELS } from "@yunicity/utils";
import { RefreshCw, Search } from "lucide-react";
import { useEffect, useState } from "react";

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
  onSearchSubmit: (q: string) => void;
  onRefresh: () => void;
}

export function PassportOffersFilters({
  state,
  organizations,
  isLoading,
  onStatusChange,
  onOrganizationChange,
  onOfferTypeChange,
  onSearchSubmit,
  onRefresh,
}: PassportOffersFiltersProps) {
  const [q, setQ] = useState(state.q);

  useEffect(() => {
    setQ(state.q);
  }, [state.q]);

  function handleSearchSubmit(event: React.FormEvent) {
    event.preventDefault();
    onSearchSubmit(q);
  }

  return (
    <section className="space-y-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm md:p-5">
      <div>
        <h2 className="text-sm font-semibold text-stone-900">Piloter le catalogue</h2>
        <p className="mt-1 text-sm text-stone-600">
          Filtrez et recherchez les offres du catalogue Passport.
        </p>
      </div>

      <form onSubmit={handleSearchSubmit} className="flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor="passport-offers-q">
          Rechercher une offre
        </label>
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
            aria-hidden
          />
          <input
            id="passport-offers-q"
            type="search"
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Rechercher par titre d'offre…"
            className="w-full rounded-lg border border-stone-300 py-2 pl-9 pr-3 text-sm text-stone-900 shadow-sm focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
            autoComplete="off"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-lg bg-stone-900 px-5 py-2 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-60"
        >
          Rechercher
        </button>
      </form>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-stone-600">Statut</span>
          <select
            value={state.status}
            onChange={(event) =>
              onStatusChange(event.target.value as AdminOfferStatusFilter)
            }
            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm"
          >
            {ADMIN_OFFER_STATUS_FILTER_OPTIONS.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-stone-600">Organisation</span>
          <select
            value={state.organizationId}
            onChange={(event) => onOrganizationChange(event.target.value)}
            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm"
          >
            <option value="">Toutes les organisations</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-stone-600">Type</span>
          <select
            value={state.offerType}
            onChange={(event) =>
              onOfferTypeChange(event.target.value as AdminOfferTypeFilter)
            }
            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm"
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
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-700 shadow-sm hover:bg-stone-50 disabled:opacity-50"
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
            Actualiser
          </button>
        </div>
      </div>
    </section>
  );
}
