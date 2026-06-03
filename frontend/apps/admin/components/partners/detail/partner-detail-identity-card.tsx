"use client";

import type { AdminPartnerOrganizationDetail } from "@yunicity/types";
import {
  formatPartnerDate,
  organizationTypeLabel,
  visibilityLabel,
  verificationStatusLabel,
} from "@yunicity/utils";

interface PartnerDetailIdentityCardProps {
  organization: AdminPartnerOrganizationDetail;
}

export function PartnerDetailIdentityCard({ organization }: PartnerDetailIdentityCardProps) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
        Identité organisation
      </h2>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium text-stone-500">ID</dt>
          <dd className="mt-1 font-mono text-xs text-stone-800">{organization.id}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-stone-500">Nom</dt>
          <dd className="mt-1 text-sm font-medium text-stone-900">{organization.name}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-stone-500">Slug</dt>
          <dd className="mt-1 font-mono text-xs text-stone-700">{organization.slug}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-stone-500">Type</dt>
          <dd className="mt-1 text-sm text-stone-800">
            {organizationTypeLabel(organization.type)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-stone-500">Ville</dt>
          <dd className="mt-1 text-sm text-stone-800">{organization.city}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-stone-500">Visibilité</dt>
          <dd className="mt-1 text-sm text-stone-800">
            {visibilityLabel(organization.visibility)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-stone-500">Vérification</dt>
          <dd className="mt-1 text-sm text-stone-800">
            {verificationStatusLabel(organization.verification_status)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-stone-500">Créée le</dt>
          <dd className="mt-1 text-sm text-stone-800">
            {formatPartnerDate(organization.created_at)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-stone-500">Dernière MAJ</dt>
          <dd className="mt-1 text-sm text-stone-800">
            {formatPartnerDate(organization.updated_at)}
          </dd>
        </div>
      </dl>
    </section>
  );
}
