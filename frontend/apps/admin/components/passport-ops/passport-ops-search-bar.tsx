"use client";

import type { PassportOpsListState, PassportOpsStatusFilter } from "@/lib/passport-ops-url";
import {
  ADMIN_PASSPORT_SEARCH_MODE_AUTO,
  ADMIN_PASSPORT_SEARCH_MODE_OPTIONS,
  type AdminPassportSearchModeOption,
} from "@yunicity/utils";
import { useEffect, useState } from "react";

const STATUS_CHIPS: { value: PassportOpsStatusFilter; label: string }[] = [
  { value: "", label: "Tous" },
  { value: "active", label: "Actifs" },
  { value: "suspended", label: "Suspendus" },
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

  return (
    <div className="space-y-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm md:p-5">
      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block text-sm font-medium text-stone-700" htmlFor="passport-ops-q">
          Rechercher
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="passport-ops-q"
            type="search"
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Email, numéro Passport, nom, fragment QR…"
            className="min-w-0 flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 shadow-sm focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-60"
          >
            Rechercher
          </button>
        </div>
        <button
          type="button"
          onClick={() => setAdvancedOpen((open) => !open)}
          className="text-xs font-medium text-stone-600 underline-offset-2 hover:underline"
        >
          {advancedOpen ? "Masquer la recherche avancée" : "Recherche avancée"}
        </button>
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

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtre par statut">
        {STATUS_CHIPS.map((chip) => {
          const active = state.status === chip.value;
          return (
            <button
              key={chip.label}
              type="button"
              onClick={() => onStatusChange(chip.value)}
              className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset transition-colors ${
                active
                  ? "bg-stone-900 text-white ring-stone-900"
                  : "bg-white text-stone-600 ring-stone-300 hover:bg-stone-50"
              }`}
            >
              {chip.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
