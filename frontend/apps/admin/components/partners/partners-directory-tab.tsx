"use client";

import { PartnersEmptyState } from "@/components/partners/command/partners-empty-state";
import { usePublicPartnersList } from "@/lib/hooks/use-public-partners-list";
import { partnerPublicPlaceUrl } from "@/lib/partners-workspace";
import { adminPartnerDetailPath, partnerEmptyStateCopy, partnerStatusLabel } from "@yunicity/utils";
import Link from "next/link";

export function PartnersDirectoryTab({ city = "Reims" }: { city?: string }) {
  const { items, total, isLoading, error, reload, city: listCity } = usePublicPartnersList(city);

  return (
    <div className="space-y-6">
      <p className="text-sm text-stone-600">
        Partenaires visibles sur le territoire — catalogue public {listCity}.
      </p>

      {isLoading ? (
        <p className="text-sm text-stone-500">Chargement des partenaires…</p>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
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

      {!isLoading && !error && items.length === 0 ? (
        <PartnersEmptyState {...partnerEmptyStateCopy("partners", listCity)} />
      ) : null}

      {!isLoading && !error && items.length > 0 ? (
        <>
          <p className="text-sm text-stone-600">
            {items.length} affiché{items.length > 1 ? "s" : ""} sur {total} partenaire
            {total > 1 ? "s" : ""} publics — {city}
          </p>
          <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Nom</th>
                    <th className="px-4 py-3 font-medium">Slug</th>
                    <th className="px-4 py-3 font-medium">Statut</th>
                    <th className="px-4 py-3 font-medium">Ville</th>
                    <th className="px-4 py-3 font-medium">Vérifié</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {items.map((partner) => (
                    <tr key={partner.id} className="hover:bg-stone-50/80">
                      <td className="px-4 py-3 font-medium text-stone-900">{partner.name}</td>
                      <td className="px-4 py-3 font-mono text-xs text-stone-600">
                        {partner.slug}
                      </td>
                      <td className="px-4 py-3 text-stone-700">
                        {partnerStatusLabel(partner.partner_status)}
                      </td>
                      <td className="px-4 py-3 text-stone-500">{partner.city}</td>
                      <td className="px-4 py-3">
                        {partner.is_verified ? (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200">
                            Oui
                          </span>
                        ) : (
                          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600">
                            Non
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <Link
                            href={adminPartnerDetailPath(partner.organization_id)}
                            className="text-sm font-medium text-violet-900 underline-offset-2 hover:underline"
                          >
                            Fiche admin 360°
                          </Link>
                          <Link
                            href={partnerPublicPlaceUrl(partner.slug, partner.city)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-stone-700 underline-offset-2 hover:underline"
                          >
                            Fiche publique
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
