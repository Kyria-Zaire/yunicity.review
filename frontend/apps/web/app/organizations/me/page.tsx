"use client";

import { OrganizationsMeAside } from "@/components/layout/web-page-asides";
import { WebAppShell } from "@/components/layout";
import { ProtectedRoute } from "@/components/protected-route";
import { VerificationBadge } from "@/components/verification-badge";
import { useYunicityApi } from "@/hooks/use-yunicity-api";
import type { OrganizationMeItem } from "@yunicity/types";
import { ORGANIZATION_TYPE_OPTIONS, isAuthError } from "@yunicity/utils";
import Link from "next/link";
import { useEffect, useState } from "react";

function orgTypeLabel(type: string): string {
  return ORGANIZATION_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
}

function OrganizationsMeContent() {
  const api = useYunicityApi();
  const [items, setItems] = useState<OrganizationMeItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await api.listMyOrganizations();
        if (!cancelled) {
          setItems(data.items);
        }
      } catch (err) {
        if (!cancelled) {
          setError(isAuthError(err) ? err.message : "Impossible de charger tes lieux.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [api]);

  return (
    <WebAppShell
      header={{
        title: "Mes lieux",
        subtitle: "Les acteurs locaux que tu représentes sur Yunicity.",
      }}
      context={<OrganizationsMeAside />}
      contentWidth="wide"
    >
      <div className="mb-6 flex justify-end xl:hidden">
        <Link
          href="/organizations/request"
          className="rounded-xl bg-yunicity-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-yunicity-primary-hover"
        >
          Proposer un lieu
        </Link>
      </div>

      {isLoading ? <p className="text-sm text-neutral-600">Chargement…</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {!isLoading && !error && items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white/60 px-6 py-12 text-center">
          <p className="font-medium text-neutral-800">Aucun lieu pour l&apos;instant</p>
          <p className="mt-2 text-sm text-neutral-600">
            Tu peux proposer ton commerce, association ou projet local en quelques clics.
          </p>
          <Link
            href="/organizations/request"
            className="mt-4 inline-block text-sm font-medium text-yunicity-primary hover:underline"
          >
            Créer une demande
          </Link>
        </div>
      ) : null}

      <ul className="space-y-4">
        {items.map((org) => (
          <li
            key={org.id}
            className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">{org.name}</h2>
                <p className="text-sm text-neutral-500">
                  {orgTypeLabel(org.type)} · {org.city}
                </p>
                <p className="text-xs text-neutral-400">
                  Rôle {org.member_role} · membre {org.member_status}
                </p>
              </div>
              <VerificationBadge status={org.verification_status} />
            </div>
            <p className="mt-3 text-xs text-neutral-500">
              Visibilité {org.visibility}
              {org.visibility === "private" ? " (non publique)" : ""}
            </p>
          </li>
        ))}
      </ul>

    </WebAppShell>
  );
}

export default function OrganizationsMePage() {
  return (
    <ProtectedRoute>
      <OrganizationsMeContent />
    </ProtectedRoute>
  );
}
