import type { PartnerOfferAdmin, PassportTierCode } from "@yunicity/types";
import { adminPassportTierLabel, formatOfferDate } from "@yunicity/utils";

interface OfferDetailPassportConditionsCardProps {
  offer: PartnerOfferAdmin;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-stone-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-stone-900">{value}</dd>
    </div>
  );
}

function tierLabel(tierCode: string | null): string {
  if (!tierCode) {
    return "Tous niveaux";
  }
  return adminPassportTierLabel(tierCode as PassportTierCode);
}

export function OfferDetailPassportConditionsCard({
  offer,
}: OfferDetailPassportConditionsCardProps) {
  const maxRedemptions =
    offer.max_redemptions_total === null
      ? "Illimité"
      : String(offer.max_redemptions_total);

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
        Conditions Passport
      </h2>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Palier requis" value={tierLabel(offer.tier_code_required)} />
        <Field label="Quota global max" value={maxRedemptions} />
        <Field label="Limite par passport" value={String(offer.redemption_limit)} />
        <Field label="Redemptions enregistrées" value={String(offer.redemptions_count)} />
        <Field label="Valide du" value={formatOfferDate(offer.valid_from)} />
        <Field label="Valide jusqu'au" value={formatOfferDate(offer.valid_until)} />
      </dl>
    </section>
  );
}
