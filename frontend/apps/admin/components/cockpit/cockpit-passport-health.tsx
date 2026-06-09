import type { AdminCockpitPassport, AdminCockpitSignals } from "@yunicity/types";
import { adminPartnerDetailPath, formatAdminMetric } from "@yunicity/utils";
import { Trophy } from "lucide-react";
import Link from "next/link";

interface CockpitPassportHealthProps {
  passport: AdminCockpitPassport;
  signals: AdminCockpitSignals;
}

export function CockpitPassportHealth({ passport, signals }: CockpitPassportHealthProps) {
  const top = signals.top_stamp_partner;
  const isQuietToday =
    passport.passports_total === 0 &&
    signals.stamps_today === 0 &&
    signals.redemptions_today === 0;

  return (
    <section
      className="rounded-xl border border-stone-200 bg-white p-3 shadow-sm"
      aria-labelledby="cockpit-passport-health-title"
    >
      <p className="text-[10px] font-medium uppercase tracking-wide text-stone-400">
        Comment se comporte Passport ?
      </p>
      <div className="mt-0.5 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 id="cockpit-passport-health-title" className="text-sm font-semibold text-stone-900">
            Passport Health
          </h2>
          <p className="text-[11px] text-stone-500">Engagement citoyen sur le territoire</p>
        </div>
        <Link
          href="/passport-ops"
          className="text-xs font-medium text-yunicity-primary hover:underline"
        >
          Voir le détail →
        </Link>
      </div>

      <div className="mt-2 grid gap-2 sm:grid-cols-3">
        <div className="rounded-lg border border-stone-100 bg-stone-50/80 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wide text-stone-500">Passports créés</p>
          <p className="text-xl font-semibold tabular-nums text-stone-900">
            {formatAdminMetric(passport.passports_total)}
          </p>
          {signals.passports_last_7_days > 0 ? (
            <p className="text-[11px] font-medium text-emerald-700">
              +{formatAdminMetric(signals.passports_last_7_days)} cette semaine
            </p>
          ) : null}
        </div>
        <div className="rounded-lg border border-stone-100 bg-stone-50/80 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wide text-stone-500">Tampons aujourd&apos;hui</p>
          <p className="text-xl font-semibold tabular-nums text-stone-900">
            {formatAdminMetric(signals.stamps_today)}
          </p>
          <p className="text-[11px] text-stone-500">
            {formatAdminMetric(passport.stamps_total)} au total
          </p>
        </div>
        <div className="rounded-lg border border-stone-100 bg-stone-50/80 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wide text-stone-500">Utilisations d&apos;offres</p>
          <p className="text-xl font-semibold tabular-nums text-stone-900">
            {formatAdminMetric(signals.redemptions_today)}
          </p>
          <p className="text-[11px] text-stone-500">
            {formatAdminMetric(passport.redemptions_completed)} validées
          </p>
        </div>
      </div>

      {isQuietToday ? (
        <p className="mt-2 rounded-lg border border-stone-100 bg-stone-50/60 px-3 py-2 text-xs leading-relaxed text-stone-600">
          Aucune activité Passport enregistrée aujourd&apos;hui. Les premiers tampons et
          utilisations apparaîtront ici.
        </p>
      ) : null}

      {top.name && top.stamps_count > 0 ? (
        <div className="mt-2 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2">
          <Trophy className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden />
          <div className="text-xs">
            <p className="font-semibold uppercase tracking-wide text-amber-900">
              Top partenaire Passport
            </p>
            <p className="mt-0.5 font-medium text-stone-900">
              {top.name}
              <span className="ml-1 text-stone-600">
                {formatAdminMetric(top.stamps_count)} tampon{top.stamps_count > 1 ? "s" : ""}
              </span>
            </p>
            {top.organization_id ? (
              <Link
                href={adminPartnerDetailPath(top.organization_id)}
                className="mt-1 inline-block font-medium text-yunicity-primary hover:underline"
              >
                Voir la fiche →
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
