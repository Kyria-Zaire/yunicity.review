import type { PartnerOfferAdmin } from "@yunicity/types";
import {
  formatOfferDate,
  offerStatusLabel,
  PARTNER_OFFER_TYPE_LABELS,
} from "@yunicity/utils";

interface OfferDetailIdentityCardProps {
  offer: PartnerOfferAdmin;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-stone-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-stone-900 break-words">{value}</dd>
    </div>
  );
}

export function OfferDetailIdentityCard({ offer }: OfferDetailIdentityCardProps) {
  const publishedAt =
    offer.offer_status === "published" && offer.moderated_at
      ? formatOfferDate(offer.moderated_at)
      : "—";

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
        Identité offre
      </h2>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="ID" value={offer.id} />
        <Field label="Titre" value={offer.title} />
        <Field label="Description" value={offer.description?.trim() || "—"} />
        <Field label="Type" value={PARTNER_OFFER_TYPE_LABELS[offer.offer_type]} />
        <Field label="Préparation" value={offer.readiness.value_category_label} />
        <Field
          label="Éligible Passport"
          value={offer.readiness.is_passport_eligible ? "Oui" : "Non"}
        />
        <Field label="Statut" value={offerStatusLabel(offer.offer_status)} />
        <Field label="Publiée le" value={publishedAt} />
        <Field label="Valide du" value={formatOfferDate(offer.valid_from)} />
        <Field label="Valide jusqu'au" value={formatOfferDate(offer.valid_until)} />
        <Field label="Créée le" value={formatOfferDate(offer.created_at)} />
        <Field label="Mise à jour le" value={formatOfferDate(offer.updated_at)} />
      </dl>
    </section>
  );
}
