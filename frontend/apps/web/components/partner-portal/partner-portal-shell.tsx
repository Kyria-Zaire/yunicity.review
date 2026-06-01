"use client";

import { usePartnerPortalContext } from "@/hooks/use-partner-portal-context";
import {
  PARTNER_PORTAL_EMPTY_BODY,
  PARTNER_PORTAL_EMPTY_TITLE,
  buildPartnerPortalCreatorContentHref,
  buildPartnerPortalEventsHref,
  buildPartnerPortalOffersHref,
  buildPartnerPortalOverviewHref,
  buildPartnerPortalPublicHref,
  buildPartnerPortalQrHref,
  partnerPortalStatusLabel,
} from "@yunicity/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const NAV_ITEMS = [
  { href: buildPartnerPortalOverviewHref(), label: "Aperçu" },
  { href: buildPartnerPortalOffersHref(), label: "Offres Passport" },
  { href: buildPartnerPortalEventsHref(), label: "Événements" },
  { href: buildPartnerPortalCreatorContentHref(), label: "Contenus créateurs" },
  { href: buildPartnerPortalQrHref(), label: "QR Passport" },
] as const;

type PartnerPortalShellProps = {
  children: ReactNode;
  title: string;
  subtitle?: string;
};

export function PartnerPortalShell({ children, title, subtitle }: PartnerPortalShellProps) {
  const pathname = usePathname();
  const ctx = usePartnerPortalContext();

  if (!ctx.isLoading && ctx.manageableOrganizations.length === 0) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-6 py-10 text-center">
        <h1 className="text-lg font-bold text-neutral-900">{PARTNER_PORTAL_EMPTY_TITLE}</h1>
        <p className="mt-2 text-sm text-neutral-600">{PARTNER_PORTAL_EMPTY_BODY}</p>
        <Link
          href="/organizations/me"
          className="mt-6 inline-block text-sm font-semibold text-yunicity-primary hover:underline"
        >
          Retour à mes lieux
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
      <aside className="w-full shrink-0 lg:w-56">
        <div className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
          {ctx.organization && ctx.partner ? (
            <div className="mb-4 border-b border-neutral-100 pb-4">
              <p className="text-xs font-bold uppercase tracking-wide text-yunicity-primary">
                Espace partenaire
              </p>
              <p className="mt-1 font-semibold text-neutral-900">{ctx.organization.name}</p>
              <p className="text-xs text-neutral-500">
                {ctx.organization.city} · {partnerPortalStatusLabel(ctx.partner)}
              </p>
              {ctx.manageableOrganizations.length > 1 ? (
                <label className="mt-3 block text-xs">
                  <span className="font-medium text-neutral-700">Changer de lieu</span>
                  <select
                    className="mt-1 w-full rounded-lg border border-neutral-200 px-2 py-1.5 text-sm"
                    value={ctx.organization.id}
                    onChange={(e) => ctx.setOrganizationId(e.target.value)}
                  >
                    {ctx.manageableOrganizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
            </div>
          ) : null}

          <nav className="space-y-1" aria-label="Navigation partenaire">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-yunicity-primary/10 text-yunicity-primary"
                      : "text-neutral-700 hover:bg-neutral-50"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            {ctx.partner ? (
              <a
                href={buildPartnerPortalPublicHref(ctx.partner)}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Voir ma fiche publique ↗
              </a>
            ) : null}
          </nav>
        </div>

        <div className="mt-4 rounded-2xl border border-neutral-100 bg-neutral-50/80 p-4 text-xs text-neutral-600">
          <p className="font-semibold text-neutral-800">Besoin d’aide ?</p>
          <p className="mt-1">
            Les contenus sont validés par l’équipe Yunicity avant publication. Les statuts affichés
            reflètent l’état réel de vos demandes.
          </p>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="mb-6">
          <Link
            href="/organizations/me"
            className="text-sm font-semibold text-yunicity-primary hover:underline"
          >
            ← Mes lieux
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-neutral-900">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-neutral-600">{subtitle}</p> : null}
        </header>
        {ctx.error ? <p className="mb-4 text-sm text-red-600">{ctx.error}</p> : null}
        {ctx.isLoading ? (
          <p className="text-sm text-neutral-500" role="status">
            Chargement…
          </p>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
