"use client";

import { PartnersEmptyState } from "@/components/partners/command/partners-empty-state";
import type { AdminPartnersTerrainListItem } from "@yunicity/types";
import {
  TERRAIN_STATUS_LABELS,
  adminPartnerDetailPath,
  formatTerrainRelativeTime,
  partnerTerrainTableEmptyFootnote,
  partnerTerrainTableEmptyState,
  resolveTerrainPartnerUiStatus,
  terrainPartnerCategoryLabel,
  terrainPartnerSubtitle,
} from "@yunicity/utils";
import { Eye, MoreHorizontal, Pencil, Store } from "lucide-react";
import Link from "next/link";

const STATUS_BADGE: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  pending: "bg-amber-50 text-amber-800 ring-amber-200",
  verified: "bg-sky-50 text-sky-800 ring-sky-200",
  inactive: "bg-stone-100 text-stone-600 ring-stone-200",
};

const CATEGORY_BADGE: Record<string, string> = {
  restaurant: "bg-orange-50 text-orange-800",
  local_business: "bg-emerald-50 text-emerald-800",
  sports_club: "bg-teal-50 text-teal-800",
  association: "bg-violet-50 text-violet-800",
};

function PartnerAvatar({ name, logoUrl }: { name: string; logoUrl: string | null }) {
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={logoUrl} alt="" className="h-10 w-10 rounded-full object-cover ring-1 ring-stone-200" />
    );
  }
  return (
    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 text-stone-500 ring-1 ring-stone-200">
      <Store className="h-4 w-4" aria-hidden />
    </span>
  );
}

export function PartnersTerrainTable({
  items,
  city,
  isLoading,
  filtered,
  onResetFilters,
}: {
  items: AdminPartnersTerrainListItem[];
  city: string;
  isLoading: boolean;
  filtered: boolean;
  onResetFilters?: () => void;
}) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm" aria-busy="true">
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-stone-100" />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    const copy = partnerTerrainTableEmptyState(filtered, city);
    return (
      <PartnersEmptyState
        title={copy.title}
        message={copy.message}
        badge={filtered ? undefined : `Pilote ${city}`}
        footnote={filtered ? undefined : partnerTerrainTableEmptyFootnote()}
        action={
          filtered
            ? { label: "Réinitialiser les filtres", onClick: onResetFilters }
            : { label: "Ajouter un partenaire", href: "/partner-leads" }
        }
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50/80 text-[11px] uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-4 py-3 font-medium">Partenaire</th>
              <th className="px-4 py-3 font-medium">Catégorie</th>
              <th className="px-4 py-3 font-medium">Localisation</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3 font-medium">Dernière activité</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {items.map((item) => {
              const uiStatus = resolveTerrainPartnerUiStatus(item);
              const categoryKey = item.partnership_type ?? item.organization_type;
              return (
                <tr key={item.organization_id} className="hover:bg-stone-50/60">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <PartnerAvatar name={item.name} logoUrl={item.logo_url} />
                      <div className="min-w-0">
                        <Link
                          href={adminPartnerDetailPath(item.organization_id)}
                          className="font-semibold text-stone-900 hover:text-yunicity-primary"
                        >
                          {item.name}
                        </Link>
                        <p className="truncate text-xs text-stone-500">
                          {terrainPartnerSubtitle(item)}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                        CATEGORY_BADGE[categoryKey] ?? "bg-stone-100 text-stone-700"
                      }`}
                    >
                      {terrainPartnerCategoryLabel(item)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-stone-800">
                      {item.neighborhood_name ?? item.address ?? "—"}
                    </p>
                    <p className="text-xs text-stone-500">{item.city}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${STATUS_BADGE[uiStatus]}`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
                      {TERRAIN_STATUS_LABELS[uiStatus]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-stone-500">
                    {formatTerrainRelativeTime(item.updated_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Link
                        href={adminPartnerDetailPath(item.organization_id)}
                        className="rounded-lg p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-800"
                        aria-label={`Voir ${item.name}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <Link
                        href={adminPartnerDetailPath(item.organization_id)}
                        className="rounded-lg p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-800"
                        aria-label={`Modifier ${item.name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <button
                        type="button"
                        className="rounded-lg p-2 text-stone-400"
                        aria-label="Plus d'actions"
                        disabled
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
