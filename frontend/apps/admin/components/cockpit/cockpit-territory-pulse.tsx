import type {
  AdminCockpitAttention,
  AdminCockpitExecutive,
  AdminCockpitPartners,
  AdminCockpitSignals,
} from "@yunicity/types";
import {
  adminPartnerDetailPath,
  cockpitTerritoryPulseIsSparse,
  formatAdminMetric,
} from "@yunicity/utils";
import {
  Activity,
  CalendarDays,
  Sprout,
  Stamp,
  Store,
  Tag,
  Trophy,
  Users,
} from "lucide-react";
import Link from "next/link";

interface CockpitTerritoryPulseProps {
  city: string;
  executive: AdminCockpitExecutive;
  partners: AdminCockpitPartners;
  signals: AdminCockpitSignals;
  attention: AdminCockpitAttention;
}

export function CockpitTerritoryPulse({
  city,
  executive,
  partners,
  signals,
  attention,
}: CockpitTerritoryPulseProps) {
  const topPartner = signals.top_stamp_partner;
  const isSparse = cockpitTerritoryPulseIsSparse(partners, signals, attention);

  const tiles = [
    {
      icon: Store,
      label: "Partenaires actifs",
      value: formatAdminMetric(partners.active),
      accent: "text-yunicity-primary",
    },
    {
      icon: Tag,
      label: "Offres publiées",
      value: formatAdminMetric(signals.offers_published),
      accent: "text-rose-600",
    },
    {
      icon: CalendarDays,
      label: "Événements à venir",
      value: formatAdminMetric(signals.events_upcoming),
      accent: "text-amber-700",
    },
    {
      icon: Stamp,
      label: "Tampons aujourd'hui",
      value: formatAdminMetric(signals.stamps_today),
      accent: "text-sky-700",
    },
    {
      icon: Activity,
      label: "Utilisations aujourd'hui",
      value: formatAdminMetric(signals.redemptions_today),
      accent: "text-emerald-700",
    },
    {
      icon: Users,
      label: "Leads ouverts",
      value: formatAdminMetric(attention.partner_leads_open),
      accent: "text-stone-700",
    },
  ];

  return (
    <section
      className={`rounded-xl border bg-sky-50/80 p-4 shadow-md ${
        isSparse ? "border-sky-300/60" : "border-sky-400/50 ring-1 ring-sky-200/60"
      }`}
      aria-labelledby="cockpit-pulse-title"
    >
      <p className="text-[10px] font-medium uppercase tracking-wide text-sky-800/70">
        Comment va votre territoire ?
      </p>
      <div className="mt-0.5 flex items-start justify-between gap-2">
        <div>
          <h2 id="cockpit-pulse-title" className="text-base font-semibold text-sky-950">
            {city} Pulse
          </h2>
        </div>
        <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-medium text-sky-800">
          Live
        </span>
      </div>

      {isSparse ? (
        <div className="mt-2 rounded-lg border border-sky-200 bg-white/95 px-3 py-2.5">
          <div className="flex items-start gap-2">
            <Sprout className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
            <div className="min-w-0 text-xs text-sky-950">
              <p className="font-semibold">{city} prend vie</p>
              <p className="mt-1 leading-relaxed text-sky-900/85">
                Les données pilotes sont encore limitées. Ajoutez davantage d&apos;activité pour
                révéler :
              </p>
              <ul className="mt-1.5 space-y-0.5 text-sky-900/80">
                <li>• les usages Passport,</li>
                <li>• les partenaires actifs,</li>
                <li>• les événements à venir.</li>
              </ul>
              <Link
                href="/partners"
                className="mt-2 inline-block text-[11px] font-medium text-yunicity-primary hover:underline"
              >
                Activer des partenaires →
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {tiles.map((tile) => {
              const Icon = tile.icon;
              return (
                <div
                  key={tile.label}
                  className="rounded-lg border border-white bg-white/95 px-2.5 py-2 shadow-sm"
                >
                  <div className="flex items-center gap-1.5">
                    <Icon className={`h-3.5 w-3.5 ${tile.accent}`} aria-hidden />
                    <p className="text-[10px] font-medium uppercase tracking-wide text-stone-500">
                      {tile.label}
                    </p>
                  </div>
                  <p className="mt-0.5 text-base font-semibold tabular-nums text-stone-900">
                    {tile.value}
                  </p>
                </div>
              );
            })}
          </div>

          {topPartner.name && topPartner.stamps_count > 0 ? (
            <div className="mt-2 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/90 px-3 py-2">
              <Trophy className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden />
              <div className="min-w-0 text-xs">
                <p className="font-semibold text-amber-950">Top tampons Passport</p>
                <p className="mt-0.5 text-stone-800">
                  {topPartner.name}{" "}
                  <span className="text-stone-600">
                    ({formatAdminMetric(topPartner.stamps_count)} tampon
                    {topPartner.stamps_count > 1 ? "s" : ""})
                  </span>
                </p>
                {topPartner.organization_id ? (
                  <Link
                    href={adminPartnerDetailPath(topPartner.organization_id)}
                    className="mt-1 inline-block font-medium text-yunicity-primary hover:underline"
                  >
                    Fiche partenaire →
                  </Link>
                ) : null}
              </div>
            </div>
          ) : null}

          <p className="mt-2 text-[11px] text-stone-500">
            {formatAdminMetric(executive.offers_total)} offres catalogue ·{" "}
            {formatAdminMetric(executive.partner_leads_total)} leads total
          </p>
        </>
      )}
    </section>
  );
}
