import type { AdminCockpitPassport } from "@yunicity/types";
import { COCKPIT_PASSPORT_METRIC_LABELS, formatAdminMetric } from "@yunicity/utils";
import Link from "next/link";

const PASSPORT_KEYS = Object.keys(COCKPIT_PASSPORT_METRIC_LABELS) as (keyof AdminCockpitPassport)[];

export function CockpitPassportSnapshot({ passport }: { passport: AdminCockpitPassport }) {
  return (
    <section
      className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm"
      aria-labelledby="cockpit-passport-title"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="cockpit-passport-title" className="text-sm font-semibold text-stone-900">
            Passport
          </h2>
          <p className="mt-1 text-xs text-stone-500">Engagement citoyen sur le territoire</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/passport-ops"
            className="rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50"
          >
            Passport Ops
          </Link>
          <Link
            href="/partner-scan"
            className="rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50"
          >
            Scanner une offre
          </Link>
        </div>
      </div>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PASSPORT_KEYS.map((key) => (
          <div
            key={key}
            className="flex items-center justify-between rounded-lg border border-stone-100 bg-stone-50/60 px-3 py-2"
          >
            <dt className="text-xs text-stone-600">{COCKPIT_PASSPORT_METRIC_LABELS[key]}</dt>
            <dd className="text-sm font-semibold tabular-nums text-stone-900">
              {formatAdminMetric(passport[key])}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
