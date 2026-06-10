"use client";

import type { PassportOpsListState, PassportOpsStatusFilter } from "@/lib/passport-ops-url";
import {
  ADMIN_PASSPORT_SEARCH_MODE_AUTO,
  ADMIN_PASSPORT_SEARCH_MODE_OPTIONS,
  DEFAULT_PASSPORT_OPS_CITY,
  type AdminPassportSearchModeOption,
} from "@yunicity/utils";
import { Building2, Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useState } from "react";

const STATUS_CHIPS: {
  value: PassportOpsStatusFilter;
  label: string;
  dotClass: string;
}[] = [
  { value: "", label: "Tous", dotClass: "" },
  { value: "active", label: "Actifs", dotClass: "bg-emerald-500" },
  { value: "suspended", label: "Suspendus", dotClass: "bg-amber-500" },
];

interface PassportOpsSearchBarProps {
  state: PassportOpsListState;
  isLoading: boolean;
  onSubmit: (draft: Pick<PassportOpsListState, "q" | "searchMode" | "status">) => void;
  onStatusChange: (status: PassportOpsStatusFilter) => void;
}

export function PassportOpsSearchBar({
  state,
  isLoading,
  onSubmit,
  onStatusChange,
}: PassportOpsSearchBarProps) {
  const [q, setQ] = useState(state.q);
  const [searchMode, setSearchMode] = useState<AdminPassportSearchModeOption>(state.searchMode);
  const [advancedOpen, setAdvancedOpen] = useState(
    state.searchMode !== ADMIN_PASSPORT_SEARCH_MODE_AUTO,
  );

  useEffect(() => {
    setQ(state.q);
    setSearchMode(state.searchMode);
  }, [state.q, state.searchMode]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    onSubmit({ q, searchMode, status: state.status });
  }

  function handleStatusSelect(value: PassportOpsStatusFilter) {
    onStatusChange(value);
  }

  return (
    <div className="space-y-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm md:p-5">
      <div className="grid gap-3 md:grid-cols-3">
        <label className="block">
          <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-stone-600">
            <Building2 className="h-3.5 w-3.5 text-yunicity-primary" aria-hidden />
            Ville active
          </span>
          <select
            value={state.city}
            disabled
            className="w-full cursor-not-allowed rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700"
            aria-label="Ville active"
          >
            <option value={DEFAULT_PASSPORT_OPS_CITY}>{DEFAULT_PASSPORT_OPS_CITY}</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-stone-600">Statut</span>
          <select
            value={state.status}
            onChange={(event) =>
              handleStatusSelect(event.target.value as PassportOpsStatusFilter)
            }
            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
          >
            <option value="">Tous les statuts</option>
            <option value="active">Actifs</option>
            <option value="suspended">Suspendus</option>
          </select>
        </label>

        <div className="flex items-end justify-end">
          <button
            type="button"
            onClick={() => setAdvancedOpen((open) => !open)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-700 shadow-sm hover:bg-stone-50 md:w-auto"
          >
            <SlidersHorizontal className="h-4 w-4 text-stone-500" aria-hidden />
            Plus de filtres
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="sr-only" htmlFor="passport-ops-q">
          Rechercher un Passport
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
              aria-hidden
            />
            <input
              id="passport-ops-q"
              type="search"
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Rechercher par email, numéro de Passport, nom ou fragment QR…"
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
        </div>

        {advancedOpen ? (
          <div>
            <label
              className="block text-xs font-medium text-stone-500"
              htmlFor="passport-ops-search-mode"
            >
              Mode de recherche
            </label>
            <select
              id="passport-ops-search-mode"
              value={searchMode}
              onChange={(event) =>
                setSearchMode(event.target.value as AdminPassportSearchModeOption)
              }
              className="mt-1 w-full max-w-xs rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900"
            >
              {ADMIN_PASSPORT_SEARCH_MODE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </form>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtre rapide par statut">
          {STATUS_CHIPS.map((chip) => {
            const active = state.status === chip.value;
            return (
              <button
                key={chip.label}
                type="button"
                onClick={() => onStatusChange(chip.value)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset transition-colors ${
                  active
                    ? "bg-stone-900 text-white ring-stone-900"
                    : "bg-white text-stone-600 ring-stone-300 hover:bg-stone-50"
                }`}
              >
                {chip.dotClass ? (
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${chip.dotClass}`}
                    aria-hidden
                  />
                ) : null}
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
