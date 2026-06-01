"use client";

import { usePartnerPortalContext } from "@/hooks/use-partner-portal-context";
import {
  buildPartnerPortalCreatorContentHref,
  buildPartnerPortalEventsHref,
  buildPartnerPortalOffersHref,
  buildPartnerPortalPublicHref,
  buildPartnerPortalQrHref,
  partnerDisplayCategory,
  partnerPortalReadinessChecklist,
  partnerPortalStatusLabel,
} from "@yunicity/utils";
import Link from "next/link";

export function PartnerPortalOverview() {
  const ctx = usePartnerPortalContext();
  const { partner, organization, offers, publicOffers, events, creatorContents } = ctx;

  if (!partner || !organization) {
    return null;
  }

  const checklist = partnerPortalReadinessChecklist({
    partner,
    offers,
    publicOffers,
    events,
    creatorContents,
  });

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wide text-yunicity-primary">
          {partnerPortalStatusLabel(partner)}
        </p>
        <h2 className="mt-1 text-xl font-bold text-neutral-900">{partner.name}</h2>
        <p className="mt-1 text-sm text-neutral-600">
          {partnerDisplayCategory(partner)} · {partner.city}
        </p>
        {partner.description ? (
          <p className="mt-3 text-sm leading-relaxed text-neutral-700">{partner.description}</p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href={buildPartnerPortalPublicHref(partner)}
            className="text-sm font-semibold text-yunicity-primary hover:underline"
          >
            Voir la fiche publique
          </Link>
          <Link
            href={buildPartnerPortalQrHref()}
            className="text-sm font-semibold text-neutral-700 hover:underline"
          >
            Générer un QR Passport
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
          <p className="text-2xl font-bold text-neutral-900">{offers.length}</p>
          <p className="text-sm text-neutral-600">Offres (gestion)</p>
          <Link href={buildPartnerPortalOffersHref()} className="mt-2 inline-block text-xs font-semibold text-yunicity-primary hover:underline">
            Gérer
          </Link>
        </div>
        <div className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
          <p className="text-2xl font-bold text-neutral-900">{events.length}</p>
          <p className="text-sm text-neutral-600">Événements</p>
          <Link href={buildPartnerPortalEventsHref()} className="mt-2 inline-block text-xs font-semibold text-yunicity-primary hover:underline">
            Gérer
          </Link>
        </div>
        <div className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
          <p className="text-2xl font-bold text-neutral-900">{creatorContents.length}</p>
          <p className="text-sm text-neutral-600">Contenus créateurs</p>
          <Link
            href={buildPartnerPortalCreatorContentHref()}
            className="mt-2 inline-block text-xs font-semibold text-yunicity-primary hover:underline"
          >
            Gérer
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-neutral-900">Checklist recette pilote</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Points à valider avant démo — sans métriques marketing inventées.
        </p>
        <ul className="mt-4 space-y-3">
          {checklist.map((item) => (
            <li key={item.id} className="flex gap-3 rounded-xl bg-neutral-50/80 px-4 py-3">
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  item.done
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-neutral-200 text-neutral-600"
                }`}
                aria-hidden
              >
                {item.done ? "✓" : "·"}
              </span>
              <div>
                <p className="text-sm font-semibold text-neutral-900">{item.label}</p>
                <p className="text-xs text-neutral-600">{item.hint}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
