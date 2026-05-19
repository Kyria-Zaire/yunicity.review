"use client";

import { OfferStatusBadge } from "@/components/offer-status-badge";
import { useAuth } from "@/lib/auth/auth-provider";
import { formatDate } from "@/lib/format";
import type {
  PartnerOfferAdmin,
  PartnerOfferAdminStatus,
  PartnerOfferType,
  VerifiedOrganizationOption,
} from "@yunicity/types";
import { PARTNER_OFFER_TYPE_LABELS, isAuthError } from "@yunicity/utils";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

const STATUS_OPTIONS: { value: "" | PartnerOfferAdminStatus; label: string }[] = [
  { value: "", label: "Tous les statuts" },
  { value: "draft", label: "Brouillon" },
  { value: "pending_review", label: "En attente de validation" },
  { value: "published", label: "Visible dans Yunicity" },
  { value: "rejected", label: "À ajuster" },
  { value: "archived", label: "Archivée" },
];

const TYPE_OPTIONS: { value: "" | PartnerOfferType; label: string }[] = [
  { value: "", label: "Tous les types" },
  { value: "drink", label: "Boisson" },
  { value: "discount", label: "Réduction" },
  { value: "vip", label: "VIP" },
  { value: "gift", label: "Cadeau" },
  { value: "event_access", label: "Événement" },
  { value: "custom", label: "Sur mesure" },
];

export default function PassportOffersPage() {
  const { partnerOffersAdminApi } = useAuth();
  const [items, setItems] = useState<PartnerOfferAdmin[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | PartnerOfferAdminStatus>("pending_review");
  const [typeFilter, setTypeFilter] = useState<"" | PartnerOfferType>("");
  const [orgFilter, setOrgFilter] = useState("");
  const [orgs, setOrgs] = useState<VerifiedOrganizationOption[]>([]);

  useEffect(() => {
    void partnerOffersAdminApi.listVerifiedOrganizations().then((data) => {
      setOrgs(data.items);
    });
  }, [partnerOffersAdminApi]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await partnerOffersAdminApi.listOffers({
        status: statusFilter || undefined,
        offer_type: typeFilter || undefined,
        organization_id: orgFilter || undefined,
        page: 1,
        page_size: 100,
      });
      setItems(response.items);
      setTotal(response.total);
    } catch (err) {
      setError(isAuthError(err) ? err.message : "Impossible de charger les offres.");
    } finally {
      setIsLoading(false);
    }
  }, [partnerOffersAdminApi, statusFilter, typeFilter, orgFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      return items;
    }
    return items.filter(
      (offer) =>
        offer.title.toLowerCase().includes(q) ||
        offer.organization.name.toLowerCase().includes(q),
    );
  }, [items, search]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Modération offres Passport</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            File d&apos;attente — {total} offre{total > 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/passport-offers/new"
          className="rounded-xl bg-yunicity-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-yunicity-primary-hover"
        >
          Créer (staff)
        </Link>
      </header>

      <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <input
            type="search"
            placeholder="Rechercher titre ou organisation…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <select
            value={orgFilter}
            onChange={(e) => setOrgFilter(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">Toutes les organisations</option>
            {orgs.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "" | PartnerOfferAdminStatus)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.label} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as "" | PartnerOfferType)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt.label} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
          >
            Actualiser
          </button>
        </div>
      </section>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Aucune offre pour ce filtre.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Offre</th>
                <th className="px-4 py-3 font-medium">Organisation</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium">Redemptions</th>
                <th className="px-4 py-3 font-medium">Validité</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((offer) => (
                <tr key={offer.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link
                      href={`/passport-offers/${offer.id}`}
                      className="font-medium text-foreground hover:underline"
                    >
                      {offer.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{offer.organization.name}</td>
                  <td className="px-4 py-3">{PARTNER_OFFER_TYPE_LABELS[offer.offer_type]}</td>
                  <td className="px-4 py-3">
                    <OfferStatusBadge status={offer.offer_status} />
                  </td>
                  <td className="px-4 py-3">{offer.redemptions_count}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {offer.valid_from ? formatDate(offer.valid_from) : "—"} →{" "}
                    {offer.valid_until ? formatDate(offer.valid_until) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
