"use client";

import { PartnerLeadsCreateModal } from "@/components/partners/leads/partner-leads-create-modal";
import { PartnerLeadsEmptyState } from "@/components/partners/leads/partner-leads-empty-state";
import { PartnerLeadsHero } from "@/components/partners/leads/partner-leads-hero";
import { PartnerLeadsInsights } from "@/components/partners/leads/partner-leads-insights";
import { PartnerLeadsKpiStrip } from "@/components/partners/leads/partner-leads-kpi-strip";
import { PartnerLeadsPipeline } from "@/components/partners/leads/partner-leads-pipeline";
import { PartnerLeadsRecommendedAction } from "@/components/partners/leads/partner-leads-recommended-action";
import { PartnerLeadsSignal } from "@/components/partners/leads/partner-leads-signal";
import { PartnerLeadsTable } from "@/components/partners/leads/partner-leads-table";
import { PartnerLeadsToolbar } from "@/components/partners/leads/partner-leads-toolbar";
import { usePartnerLeadsPipeline } from "@/lib/hooks/use-partner-leads-pipeline";
import type { OrganizationType, PartnerLeadSource, PartnerLeadStatus } from "@yunicity/types";
import {
  buildPartnerLeadInsights,
  buildPartnerLeadPipeline,
  buildPartnerLeadRecommendedAction,
  buildPartnerLeadSignal,
  formatAdminMetric,
  partnerLeadEmptyStateCopy,
  partnerLeadFocusKpiCards,
} from "@yunicity/utils";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

const DEFAULT_CITY = "Reims";

function matchesSearch(lead: { name: string; city: string | null }, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) {
    return true;
  }
  return (
    lead.name.toLowerCase().includes(q) || (lead.city ?? "").toLowerCase().includes(q)
  );
}

type PartnerLeadsCommandPageProps = {
  variant?: "page" | "embedded";
  city?: string;
};

export function PartnerLeadsCommandPage({
  variant = "page",
  city = DEFAULT_CITY,
}: PartnerLeadsCommandPageProps) {
  const searchParams = useSearchParams();
  const initialStatus = (searchParams.get("status") ?? "") as "" | PartnerLeadStatus;
  const initialSource = (searchParams.get("source") ?? "") as "" | PartnerLeadSource;

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | PartnerLeadStatus>(initialStatus);
  const [source, setSource] = useState<"" | PartnerLeadSource>(initialSource);
  const [organizationType, setOrganizationType] = useState<"" | OrganizationType>("");
  const [createOpen, setCreateOpen] = useState(false);

  const { leads, isLoading, error, reload } = usePartnerLeadsPipeline(city);

  const signal = useMemo(() => buildPartnerLeadSignal(leads, city), [leads, city]);
  const kpiCards = useMemo(() => partnerLeadFocusKpiCards(leads), [leads]);
  const pipeline = useMemo(() => buildPartnerLeadPipeline(leads, city), [leads, city]);
  const recommended = useMemo(
    () => buildPartnerLeadRecommendedAction(leads, city),
    [leads, city],
  );
  const insights = useMemo(() => buildPartnerLeadInsights(leads), [leads]);

  const filtered = Boolean(search || status || source || organizationType);

  const visibleItems = useMemo(
    () =>
      leads.filter((lead) => {
        if (status && lead.status !== status) {
          return false;
        }
        if (source && lead.source !== source) {
          return false;
        }
        if (organizationType && lead.organization_type !== organizationType) {
          return false;
        }
        return matchesSearch(lead, search);
      }),
    [leads, search, status, source, organizationType],
  );

  const canCreate = true;
  const openCreate = () => setCreateOpen(true);

  if (isLoading && leads.length === 0) {
    return (
      <div className="mx-auto max-w-7xl space-y-4 animate-pulse pb-8" aria-busy="true">
        <div className="h-32 rounded-2xl bg-stone-100" />
        <div className="h-24 rounded-2xl bg-stone-100" />
        <div className="h-28 rounded-2xl bg-stone-100" />
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-stone-100" />
          ))}
        </div>
        <div className="h-72 rounded-2xl bg-stone-100" />
      </div>
    );
  }

  if (error && leads.length === 0) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-rose-200 bg-rose-50 p-6">
        <h2 className="text-lg font-semibold text-rose-900">Pipeline prospects indisponible</h2>
        <p className="mt-2 text-sm text-rose-800">{error}</p>
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
    <div className={`mx-auto max-w-7xl space-y-5 ${variant === "page" ? "pb-10" : "pb-4"}`}>
      {variant === "page" ? (
        <PartnerLeadsHero canCreate={canCreate} onAddProspect={openCreate} />
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-stone-600">
            {formatAdminMetric(leads.length)} prospect{leads.length > 1 ? "s" : ""} pour {city}
          </p>
          <a
            href="/partner-leads"
            className="text-sm font-medium text-yunicity-primary underline-offset-2 hover:underline"
          >
            Ouvrir le pipeline complet
          </a>
        </div>
      )}

      <PartnerLeadsSignal signal={signal} />

      <PartnerLeadsRecommendedAction action={recommended} onAddProspect={openCreate} />

      {variant === "page" ? (
        <>
          <PartnerLeadsKpiStrip cards={kpiCards} />
          <PartnerLeadsPipeline pipeline={pipeline} />
        </>
      ) : null}

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-stone-950">Prospects à traiter</h2>
          <p className="mt-1 text-sm text-stone-600">
            Filtrez et ouvrez les contacts terrain pour les faire avancer.
          </p>
        </div>

        <PartnerLeadsToolbar
          search={search}
          status={status}
          source={source}
          organizationType={organizationType}
          onSearchChange={setSearch}
          onStatusChange={setStatus}
          onSourceChange={setSource}
          onOrganizationTypeChange={setOrganizationType}
          filtered={filtered}
          onReset={() => {
            setSearch("");
            setStatus("");
            setSource("");
            setOrganizationType("");
          }}
        />

        {error ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {error}
            <button
              type="button"
              onClick={() => void reload()}
              className="ml-3 font-medium underline"
            >
              Réessayer
            </button>
          </div>
        ) : null}

        {!isLoading && visibleItems.length === 0 ? (
          <PartnerLeadsEmptyState
            {...partnerLeadEmptyStateCopy(city, filtered)}
            canCreate={canCreate && !filtered}
            onAddProspect={openCreate}
          />
        ) : (
          <>
            <p className="text-sm text-stone-500">
              {filtered
                ? `${formatAdminMetric(visibleItems.length)} résultat${visibleItems.length > 1 ? "s" : ""}`
                : `${formatAdminMetric(visibleItems.length)} prospect${visibleItems.length > 1 ? "s" : ""} affiché${visibleItems.length > 1 ? "s" : ""}`}
            </p>
            <PartnerLeadsTable items={visibleItems} isLoading={isLoading} />
          </>
        )}
      </section>

      {variant === "page" ? <PartnerLeadsInsights insights={insights} /> : null}

      <PartnerLeadsCreateModal
        city={city}
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => void reload()}
      />
    </div>
  );
}
