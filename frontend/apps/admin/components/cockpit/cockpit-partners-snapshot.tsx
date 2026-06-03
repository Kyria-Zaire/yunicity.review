import type { AdminCockpitPartners } from "@yunicity/types";
import { COCKPIT_PARTNER_METRIC_LABELS, formatAdminMetric } from "@yunicity/utils";
import Link from "next/link";

const PARTNER_KEYS = Object.keys(COCKPIT_PARTNER_METRIC_LABELS) as (keyof AdminCockpitPartners)[];

export function CockpitPartnersSnapshot({ partners }: { partners: AdminCockpitPartners }) {
  return (
    <section
      className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm"
      aria-labelledby="cockpit-partners-title"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="cockpit-partners-title" className="text-sm font-semibold text-stone-900">
            Partenaires
          </h2>
          <p className="mt-1 text-xs text-stone-500">Répartition statuts et visibilité</p>
        </div>
        <Link
          href="/partner-leads"
          className="rounded-lg bg-stone-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-stone-800"
        >
          Gérer partenaires
        </Link>
      </div>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PARTNER_KEYS.map((key) => (
          <div
            key={key}
            className="flex items-center justify-between rounded-lg border border-stone-100 bg-stone-50/60 px-3 py-2"
          >
            <dt className="text-xs text-stone-600">{COCKPIT_PARTNER_METRIC_LABELS[key]}</dt>
            <dd className="text-sm font-semibold tabular-nums text-stone-900">
              {formatAdminMetric(partners[key])}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
