"use client";

import { ORGANIZATION_TYPE_OPTIONS, PARTNERSHIP_TYPE_SELECT_OPTIONS } from "@yunicity/utils";
import { Filter, LayoutGrid, List } from "lucide-react";

export type TerrainStatusFilter = "" | "active" | "pending" | "verified" | "inactive";

interface PartnersTerrainToolbarProps {
  search: string;
  status: TerrainStatusFilter;
  partnershipType: string;
  organizationType: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: TerrainStatusFilter) => void;
  onPartnershipTypeChange: (value: string) => void;
  onOrganizationTypeChange: (value: string) => void;
}

export function PartnersTerrainToolbar({
  search,
  status,
  partnershipType,
  organizationType,
  onSearchChange,
  onStatusChange,
  onPartnershipTypeChange,
  onOrganizationTypeChange,
}: PartnersTerrainToolbarProps) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <label className="min-w-0 flex-1 text-sm">
          <span className="sr-only">Recherche</span>
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher un partenaire, lieu, catégorie…"
            className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-stone-500">Statut</span>
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value as TerrainStatusFilter)}
            className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm"
          >
            <option value="">Tous les statuts</option>
            <option value="active">Actifs</option>
            <option value="pending">En attente</option>
            <option value="verified">Vérifiés</option>
            <option value="inactive">Inactifs</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-stone-500">Type</span>
          <select
            value={partnershipType}
            onChange={(e) => onPartnershipTypeChange(e.target.value)}
            className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm"
          >
            <option value="">Tous les types</option>
            {PARTNERSHIP_TYPE_SELECT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-stone-500">Catégorie</span>
          <select
            value={organizationType}
            onChange={(e) => onOrganizationTypeChange(e.target.value)}
            className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm"
          >
            <option value="">Toutes les catégories</option>
            {ORGANIZATION_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm font-medium text-stone-700"
          >
            <Filter className="h-4 w-4" aria-hidden />
            Filtres
          </button>
          <div className="inline-flex rounded-xl border border-stone-200 p-1">
            <button
              type="button"
              aria-pressed="true"
              className="rounded-lg bg-yunicity-primary px-2.5 py-1.5 text-stone-50"
            >
              <List className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button"
              aria-pressed="false"
              disabled
              title="Vue grille bientôt disponible"
              className="rounded-lg px-2.5 py-1.5 text-stone-400"
            >
              <LayoutGrid className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
