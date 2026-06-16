"use client";

import { PartnersTerrainBottomGrid } from "@/components/partners/terrain/partners-terrain-bottom-grid";
import { PartnersNetworkSignal } from "@/components/partners/command/partners-network-signal";
import { PartnersTerrainHeader } from "@/components/partners/terrain/partners-terrain-header";
import { PartnersTerrainInsights } from "@/components/partners/terrain/partners-terrain-insights";
import { PartnersTerrainTable } from "@/components/partners/terrain/partners-terrain-table";
import {
  PartnersTerrainToolbar,
  type TerrainStatusFilter,
} from "@/components/partners/terrain/partners-terrain-toolbar";
import { PartnersKpiStrip } from "@/components/partners/terrain/partners-kpi-strip";
import { useAdminPartnersTerrainList } from "@/lib/hooks/use-admin-partners-terrain-list";
import { useAdminPartnersWorkspaceSummary } from "@/lib/hooks/use-admin-partners-workspace-summary";
import { formatAdminMetric } from "@yunicity/utils";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

const DEFAULT_CITY = "Reims";

export function PartnersTerrainCommandPage() {
  const searchParams = useSearchParams();
  const initialStatus = (searchParams.get("status") ?? "") as TerrainStatusFilter;
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<TerrainStatusFilter>(initialStatus);
  const [partnershipType, setPartnershipType] = useState("");
  const [organizationType, setOrganizationType] = useState("");

  const { data: summary, error: summaryError, reload } =
    useAdminPartnersWorkspaceSummary(DEFAULT_CITY);

  const listParams = useMemo(
    () => ({
      city: DEFAULT_CITY,
      search: search.trim() || undefined,
      status: status || undefined,
      partnership_type: partnershipType || undefined,
      organization_type: organizationType || undefined,
      page: 1,
      page_size: 20,
    }),
    [search, status, partnershipType, organizationType],
  );

  const {
    items,
    total,
    isLoading: listLoading,
    error: listError,
    reload: reloadList,
  } = useAdminPartnersTerrainList(listParams);

  const filtered = Boolean(search || status || partnershipType || organizationType);

  if (summaryError && !summary) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-rose-200 bg-rose-50 p-6">
        <h2 className="text-lg font-semibold text-rose-900">Réseau partenaires indisponible</h2>
        <p className="mt-2 text-sm text-rose-800">{summaryError}</p>
        <button
          type="button"
          onClick={() => void reload()}
          className="mt-4 text-sm font-medium text-rose-900 underline"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10">
      {summary ? (
        <>
          <PartnersTerrainHeader city={DEFAULT_CITY} partnersTotal={summary.partners_total} />
          <PartnersNetworkSignal summary={summary} />
          <PartnersKpiStrip summary={summary} />
        </>
      ) : (
        <div className="space-y-4 animate-pulse" aria-busy="true">
          <div className="h-24 rounded-2xl bg-stone-100" />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-32 rounded-2xl bg-stone-100" />
            ))}
          </div>
        </div>
      )}

      <PartnersTerrainToolbar
        search={search}
        status={status}
        partnershipType={partnershipType}
        organizationType={organizationType}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
        onPartnershipTypeChange={setPartnershipType}
        onOrganizationTypeChange={setOrganizationType}
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-3 xl:col-span-2">
          {total > 0 || filtered || listError ? (
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-stone-600">
                {listError
                  ? "Impossible de charger la liste partenaires."
                  : filtered && total === 0
                    ? "Aucun résultat — élargissez la recherche ou réinitialisez les filtres."
                    : `${formatAdminMetric(total)} partenaire${total > 1 ? "s" : ""} affiché${total > 1 ? "s" : ""}`}
              </p>
              {listError ? (
                <button
                  type="button"
                  onClick={() => void reloadList()}
                  className="text-sm font-medium text-yunicity-primary underline"
                >
                  Réessayer
                </button>
              ) : null}
            </div>
          ) : null}
          <PartnersTerrainTable
            items={items}
            city={DEFAULT_CITY}
            isLoading={listLoading}
            filtered={filtered}
            onResetFilters={() => {
              setSearch("");
              setStatus("");
              setPartnershipType("");
              setOrganizationType("");
            }}
          />
        </div>
        {summary ? (
          <PartnersTerrainInsights summary={summary} />
        ) : (
          <div
            className="hidden h-96 animate-pulse rounded-2xl bg-stone-100 xl:block"
            aria-busy="true"
          />
        )}
      </div>

      {summary ? <PartnersTerrainBottomGrid summary={summary} /> : null}
    </div>
  );
}
