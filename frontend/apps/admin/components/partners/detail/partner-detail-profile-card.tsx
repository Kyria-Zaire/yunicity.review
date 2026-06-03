"use client";

import type { AdminPartnerProfileDetail } from "@yunicity/types";
import {
  formatPartnerDate,
  partnerStatusLabel,
  partnershipTypeLabel,
} from "@yunicity/utils";

interface PartnerDetailProfileCardProps {
  profile: AdminPartnerProfileDetail | null;
}

export function PartnerDetailProfileCard({ profile }: PartnerDetailProfileCardProps) {
  if (!profile) {
    return (
      <section className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/40 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-900">
          Profil partenaire
        </h2>
        <p className="mt-3 text-sm text-amber-950/90">
          Cette organisation n&apos;a pas encore de profil partenaire.
        </p>
        <button
          type="button"
          disabled
          className="mt-4 cursor-not-allowed rounded-lg border border-amber-200 bg-white px-4 py-2 text-sm font-medium text-stone-500 opacity-70"
          title="Disponible dans ADMIN-02D3"
        >
          Créer le profil partenaire — ADMIN-02D3
        </button>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
        Profil partenaire
      </h2>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium text-stone-500">Statut partenaire</dt>
          <dd className="mt-1 text-sm font-medium text-stone-900">
            {partnerStatusLabel(profile.partner_status)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-stone-500">Type de partenariat</dt>
          <dd className="mt-1 text-sm text-stone-800">
            {partnershipTypeLabel(profile.partnership_type)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-stone-500">Mis en avant</dt>
          <dd className="mt-1 text-sm text-stone-800">{profile.is_featured ? "Oui" : "Non"}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-stone-500">Signé le</dt>
          <dd className="mt-1 text-sm text-stone-800">{formatPartnerDate(profile.signed_at)}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-stone-500">Activé le</dt>
          <dd className="mt-1 text-sm text-stone-800">
            {formatPartnerDate(profile.activated_at)}
          </dd>
        </div>
      </dl>
    </section>
  );
}
