"use client";

import { LeadStatusBadge } from "@/components/lead-status-badge";
import { useAuth } from "@/lib/auth/auth-provider";
import { formatDate } from "@/lib/format";
import type {
  PartnerLead,
  PartnerLeadSource,
  PartnerLeadStatus,
} from "@yunicity/types";
import { PARTNER_LEAD_SOURCE_LABELS, isAuthError } from "@yunicity/utils";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

const STATUS_OPTIONS: { value: "" | PartnerLeadStatus; label: string }[] = [
  { value: "", label: "Tous les statuts" },
  { value: "new", label: "Nouveau" },
  { value: "contacted", label: "Contacté" },
  { value: "interested", label: "Intéressé" },
  { value: "meeting_scheduled", label: "RDV planifié" },
  { value: "signed", label: "Signé" },
  { value: "converted", label: "Converti" },
  { value: "rejected", label: "Refusé" },
  { value: "archived", label: "Archivé" },
];

const SOURCE_OPTIONS: { value: "" | PartnerLeadSource; label: string }[] = [
  { value: "", label: "Toutes les sources" },
  { value: "physical_prospecting", label: "Terrain" },
  { value: "landing_page", label: "Landing" },
  { value: "referral", label: "Parrainage" },
  { value: "instagram", label: "Instagram" },
  { value: "event", label: "Événement" },
  { value: "manual", label: "Manuel" },
  { value: "other", label: "Autre" },
];

function matchesSearch(lead: PartnerLead, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) {
    return true;
  }
  const name = lead.name.toLowerCase();
  const city = (lead.city ?? "").toLowerCase();
  return name.includes(q) || city.includes(q);
}

type PartnerLeadsListProps = {
  variant?: "page" | "embedded";
};

export function PartnerLeadsList({ variant = "page" }: PartnerLeadsListProps) {
  const { partnerLeadsApi } = useAuth();
  const [items, setItems] = useState<PartnerLead[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | PartnerLeadStatus>("");
  const [sourceFilter, setSourceFilter] = useState<"" | PartnerLeadSource>("");
  const [cityFilter, setCityFilter] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await partnerLeadsApi.listPartnerLeads({
        status: statusFilter || undefined,
        source: sourceFilter || undefined,
        city: cityFilter.trim() || undefined,
        page: 1,
        page_size: 100,
      });
      setItems(response.items);
      setTotal(response.total);
    } catch (err) {
      setError(isAuthError(err) ? err.message : "Impossible de charger les leads.");
    } finally {
      setIsLoading(false);
    }
  }, [partnerLeadsApi, statusFilter, sourceFilter, cityFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const visibleItems = useMemo(
    () => items.filter((lead) => matchesSearch(lead, search)),
    [items, search],
  );

  return (
    <div className="space-y-6">
      {variant === "page" ? (
        <header>
          <h2 className="text-2xl font-bold tracking-tight">Partenaires terrain</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Cockpit CRM — {total} lead{total > 1 ? "s" : ""} au total
          </p>
        </header>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-stone-600">
            CRM terrain — {total} lead{total > 1 ? "s" : ""} chargé{total > 1 ? "s" : ""}
          </p>
          <Link
            href="/partner-leads"
            className="text-sm font-medium text-stone-900 underline-offset-2 hover:underline"
          >
            Ouvrir en plein écran
          </Link>
        </div>
      )}

      <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm">
            <span className="font-medium text-stone-700">Recherche</span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nom ou ville…"
              className="mt-1 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm">
            <span className="font-medium text-stone-700">Statut</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "" | PartnerLeadStatus)}
              className="mt-1 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value || "all"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="font-medium text-stone-700">Source</span>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value as "" | PartnerLeadSource)}
              className="mt-1 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm"
            >
              {SOURCE_OPTIONS.map((opt) => (
                <option key={opt.value || "all"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="font-medium text-stone-700">Ville (API)</span>
            <input
              type="text"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              placeholder="ex. Reims"
              className="mt-1 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm"
            />
          </label>
        </div>
        <p className="mt-2 text-xs text-stone-500">
          La recherche nom/ville s&apos;applique sur les 100 premiers résultats chargés.
        </p>
      </section>

      {isLoading ? (
        <p className="text-sm text-stone-500">Chargement des leads…</p>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
          <button
            type="button"
            onClick={() => void load()}
            className="ml-3 font-medium underline"
          >
            Réessayer
          </button>
        </div>
      ) : null}

      {!isLoading && !error && visibleItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-200 bg-white px-6 py-16 text-center">
          <p className="text-lg font-medium text-stone-900">Aucun lead pour ces filtres.</p>
          <p className="mt-2 text-sm text-stone-500">
            Créez ou importez des leads via l&apos;API staff ou le script backend.
          </p>
        </div>
      ) : null}

      {!isLoading && !error && visibleItems.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Nom</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                  <th className="px-4 py-3 font-medium">Ville</th>
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 font-medium">Tags</th>
                  <th className="px-4 py-3 font-medium">Créé</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {visibleItems.map((lead) => (
                  <tr key={lead.id} className="hover:bg-stone-50/80">
                    <td className="px-4 py-3">
                      <Link
                        href={`/partner-leads/${lead.id}`}
                        className="font-medium text-stone-900 hover:underline"
                      >
                        {lead.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <LeadStatusBadge status={lead.status} />
                    </td>
                    <td className="px-4 py-3 text-stone-500">{lead.city ?? "—"}</td>
                    <td className="px-4 py-3 text-stone-500">
                      {PARTNER_LEAD_SOURCE_LABELS[lead.source]}
                    </td>
                    <td className="px-4 py-3">
                      {lead.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {lead.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-stone-100 px-2 py-0.5 text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                          {lead.tags.length > 3 ? (
                            <span className="text-xs text-stone-500">
                              +{lead.tags.length - 3}
                            </span>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-stone-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-stone-500">
                      {formatDate(lead.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
