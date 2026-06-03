"use client";

import { usePublicPartnersList } from "@/lib/hooks/use-public-partners-list";
import { partnerPublicPlaceUrl } from "@/lib/partners-workspace";
import { partnerStatusLabel } from "@yunicity/utils";
import Link from "next/link";

export function PartnersDirectoryTab() {
  const { items, total, isLoading, error, reload, city } = usePublicPartnersList();

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
        <p className="font-medium">Périmètre API actuel (catalogue public)</p>
        <p className="mt-1 text-amber-900/90">
          Cette liste provient de <code className="text-xs">GET /api/v1/partners</code> et
          n&apos;affiche que les partenaires au statut public (
          <strong>active</strong>, <strong>premium</strong>, <strong>founding_partner</strong>
          ). Les partenaires <strong>signed</strong> ou <strong>privés</strong> seront
          disponibles après ADMIN-02D.
        </p>
      </div>

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
        <div className="rounded-2xl border border-dashed border-stone-200 bg-white px-6 py-16 text-center">
          <p className="text-lg font-medium text-stone-900">Aucun partenaire public à Reims.</p>
          <p className="mt-2 text-sm text-stone-500">
            Les profils signés ou en attente d&apos;activation n&apos;apparaissent pas encore ici.
          </p>
        </div>
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
                        <Link
                          href={partnerPublicPlaceUrl(partner.slug, partner.city)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-stone-900 underline-offset-2 hover:underline"
                        >
                          Fiche publique
                        </Link>
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
