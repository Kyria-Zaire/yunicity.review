"use client";

import type { OrganizationMeItem } from "@yunicity/types";
import {
  VERIFICATION_STATUS_LABELS,
  hasOfferManagerRole,
  listOfferManageableOrganizations,
} from "@yunicity/utils";
import Link from "next/link";

export function PartnerOfferAccessPanel({
  organizations,
  isLoading,
}: {
  organizations: OrganizationMeItem[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return <p className="text-sm text-stone-500">Chargement de tes lieux…</p>;
  }

  const manageable = listOfferManageableOrganizations(organizations);

  if (manageable.length > 0) {
    return null;
  }

  const pendingVerification = organizations.some(
    (o) => o.verification_status !== "verified" && hasOfferManagerRole(o),
  );
  const noRole = organizations.length > 0 && !organizations.some(hasOfferManagerRole);

  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50/80 p-6 text-center">
      <h2 className="text-lg font-semibold text-stone-900">
        {organizations.length === 0
          ? "Rejoins le territoire Yunicity"
          : pendingVerification
            ? "Ton lieu est en cours de validation"
            : noRole
              ? "Droits insuffisants pour publier"
              : "Publication pas encore disponible"}
      </h2>
      <p className="mt-2 text-sm text-stone-600">
        {organizations.length === 0
          ? "Propose ton commerce ou association à Reims pour pouvoir créer des offres Passport."
          : pendingVerification
            ? "Dès que Yunicity valide ton organisation, tu pourras proposer des offres pour la ville."
            : noRole
              ? "Seuls le propriétaire ou l’administrateur du lieu peut gérer les offres."
              : "Contacte l’équipe Yunicity si tu penses qu’il s’agit d’une erreur."}
      </p>
      {organizations.length === 0 ? (
        <Link
          href="/"
          className="mt-4 inline-block rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-medium text-white"
        >
          En savoir plus
        </Link>
      ) : (
        <ul className="mt-4 space-y-2 text-left text-sm text-stone-600">
          {organizations.map((org) => (
            <li key={org.id} className="rounded-lg bg-white/60 px-3 py-2">
              {org.name} — {VERIFICATION_STATUS_LABELS[org.verification_status]}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
