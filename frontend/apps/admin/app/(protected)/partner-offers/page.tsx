"use client";

import { OfferStatusBadge } from "@/components/offer-status-badge";
import { PartnerOfferAccessPanel } from "@/components/partner-offer-access-panel";
import { formatDate } from "@/lib/format";
import { usePartnerOffersList, usePartnerOrganizations } from "@/lib/hooks/use-partner-offers";
import type { PartnerOfferStatus } from "@yunicity/types";
import {
  PARTNER_OFFERS_EMPTY_BODY,
  PARTNER_OFFERS_EMPTY_CTA,
  PARTNER_OFFERS_EMPTY_TITLE,
  PARTNER_OFFER_STATUS_MICROCOPY,
  PARTNER_OFFER_TYPE_LABELS,
} from "@yunicity/utils";
import Link from "next/link";
import { useMemo, useState } from "react";

const STATUS_FILTERS: { value: "" | PartnerOfferStatus; label: string }[] = [
  { value: "", label: "Toutes" },
  { value: "draft", label: "Brouillons" },
  { value: "pending_review", label: "En attente de validation" },
  { value: "published", label: "Publiées" },
  { value: "rejected", label: "Refusées" },
];

export default function PartnerOffersHubPage() {
  const { organizations, manageable, isLoading: orgLoading } = usePartnerOrganizations();
  const [statusFilter, setStatusFilter] = useState<"" | PartnerOfferStatus>("");
  const [orgFilter, setOrgFilter] = useState("");

  const listParams = useMemo(
    () => ({
      status: statusFilter || undefined,
      organization_id: orgFilter || undefined,
    }),
    [statusFilter, orgFilter],
  );

  const { items, total, isLoading, error, reload } = usePartnerOffersList(listParams);

  const orgMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const org of organizations) {
      map.set(org.id, org.name);
    }
    return map;
  }, [organizations]);

  const canCreate = manageable.length > 0;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <header>
        <p className="text-sm font-medium text-amber-800/90">Participation locale</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-stone-900">
          Tes offres pour la ville
        </h2>
        <p className="mt-2 text-sm text-stone-600">
          Propose une expérience aux citoyens Yunicity — simple, humain, validé par notre équipe.
        </p>
      </header>

      <PartnerOfferAccessPanel organizations={organizations} isLoading={orgLoading} />

      {canCreate ? (
        <>
          <div className="flex flex-wrap gap-2">
            {manageable.length > 1 ? (
              <select
                value={orgFilter}
                onChange={(e) => setOrgFilter(e.target.value)}
                className="flex-1 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm"
              >
                <option value="">Tous tes lieux</option>
                {manageable.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            ) : null}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "" | PartnerOfferStatus)}
              className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm"
            >
              {STATUS_FILTERS.map((f) => (
                <option key={f.label} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => void reload()}
              className="rounded-xl border border-stone-200 px-3 py-2 text-sm text-stone-600"
            >
              Actualiser
            </button>
          </div>

          {canCreate && items.length > 0 ? (
            <Link
              href="/partner-offers/new"
              className="block rounded-2xl bg-stone-900 py-3.5 text-center text-sm font-semibold text-white hover:bg-stone-800"
            >
              {PARTNER_OFFERS_EMPTY_CTA}
            </Link>
          ) : null}

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {isLoading ? (
            <p className="text-sm text-stone-500">Chargement de tes offres…</p>
          ) : items.length === 0 && canCreate ? (
            <section className="rounded-2xl border border-dashed border-amber-200/80 bg-white/80 p-8 text-center">
              <h3 className="text-lg font-semibold text-stone-900">{PARTNER_OFFERS_EMPTY_TITLE}</h3>
              <p className="mt-2 text-sm text-stone-600">{PARTNER_OFFERS_EMPTY_BODY}</p>
              <Link
                href="/partner-offers/new"
                className="mt-6 inline-block rounded-2xl bg-stone-900 px-6 py-3 text-sm font-semibold text-white hover:bg-stone-800"
              >
                {PARTNER_OFFERS_EMPTY_CTA}
              </Link>
            </section>
          ) : items.length === 0 ? null : (
            <ul className="space-y-3">
              <p className="text-xs text-stone-500">
                {total} offre{total > 1 ? "s" : ""}
              </p>
              {items.map((offer) => (
                <li key={offer.id}>
                  <Link
                    href={`/partner-offers/${offer.id}`}
                    className="block rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition hover:border-amber-200"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-stone-900">{offer.title}</h3>
                        <p className="mt-1 text-xs text-stone-500">
                          {orgMap.get(offer.organization_id) ?? "Ton lieu"} ·{" "}
                          {PARTNER_OFFER_TYPE_LABELS[offer.offer_type]}
                        </p>
                      </div>
                      <OfferStatusBadge status={offer.offer_status} />
                    </div>
                    <p className="mt-2 text-xs text-stone-600">
                      {PARTNER_OFFER_STATUS_MICROCOPY[offer.offer_status]}
                    </p>
                    <p className="mt-2 text-xs text-stone-400">
                      {offer.valid_from ? formatDate(offer.valid_from) : "—"} →{" "}
                      {offer.valid_until ? formatDate(offer.valid_until) : "—"} ·{" "}
                      {offer.redemptions_count} utilisation
                      {offer.redemptions_count > 1 ? "s" : ""}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : null}
    </div>
  );
}
