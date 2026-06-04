import type { PartnerOfferAdmin } from "@yunicity/types";
import { buildPartnerDetailPath, ORGANIZATION_VISIBILITY_LABELS } from "@yunicity/utils";
import Link from "next/link";

interface OfferDetailPartnerCardProps {
  offer: PartnerOfferAdmin;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-stone-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-stone-900 break-all">{value}</dd>
    </div>
  );
}

export function OfferDetailPartnerCard({ offer }: OfferDetailPartnerCardProps) {
  const org = offer.organization;
  const visibilityLabel =
    ORGANIZATION_VISIBILITY_LABELS[org.visibility as keyof typeof ORGANIZATION_VISIBILITY_LABELS] ??
    org.visibility;

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
          Partenaire
        </h2>
        <Link
          href={buildPartnerDetailPath(org.id)}
          className="text-sm font-medium text-stone-800 underline-offset-2 hover:underline"
        >
          Voir la fiche partenaire
        </Link>
      </div>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Organisation" value={org.name} />
        <Field label="ID organisation" value={org.id} />
        <Field label="Ville" value={org.city} />
        <Field label="Vérification" value={org.verification_status} />
        <Field label="Visibilité" value={visibilityLabel} />
        <Field
          label="Statut partenaire catalogue"
          value="Non disponible dans cette version admin"
        />
      </dl>
    </section>
  );
}
