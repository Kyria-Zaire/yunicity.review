import type { AdminPassportDetailResponse } from "@yunicity/types";
import { adminPassportTierLabel, formatPassportDate } from "@yunicity/utils";

interface PassportDetailIdentityCardProps {
  data: AdminPassportDetailResponse;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-stone-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-stone-900">{value}</dd>
    </div>
  );
}

export function PassportDetailIdentityCard({ data }: PassportDetailIdentityCardProps) {
  const displayName = data.user.display_name?.trim() || "—";

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
        Identité citoyen
      </h2>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Nom affiché" value={displayName} />
        <Field label="Email" value={data.user.email} />
        <Field label="Compte actif" value={data.user.is_active ? "Oui" : "Non"} />
        <Field
          label="Palier"
          value={`${adminPassportTierLabel(data.tier.code)} (${data.tier.label})`}
        />
        <Field label="Activé le" value={formatPassportDate(data.activated_at)} />
        <Field label="Suspendu le" value={formatPassportDate(data.suspended_at)} />
        <Field label="Créé le" value={formatPassportDate(data.created_at)} />
        <Field label="Mis à jour le" value={formatPassportDate(data.updated_at)} />
      </dl>
    </section>
  );
}
