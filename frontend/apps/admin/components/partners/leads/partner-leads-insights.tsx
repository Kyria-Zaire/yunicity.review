import { LeadStatusBadge } from "@/components/lead-status-badge";
import { formatDate } from "@/lib/format";
import type { PartnerLeadInsightsResult } from "@yunicity/utils";
import { organizationTypeLabel } from "@yunicity/utils";
import Link from "next/link";

export function PartnerLeadsInsights({ insights }: { insights: PartnerLeadInsightsResult }) {
  if (!insights.hasData) {
    return (
      <section className="rounded-xl border border-dashed border-stone-200 bg-stone-50/30 px-4 py-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400">
          Intelligence terrain
        </p>
        <p className="mt-2 text-sm text-stone-500">
          Les tendances du pipeline apparaîtront dès les premiers contacts.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-3" aria-label="Intelligence terrain">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400">
          Intelligence terrain
        </p>
        <p className="mt-1 text-xs text-stone-500">Tendances secondaires — à consulter après traitement.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {insights.topSources.length > 0 ? (
          <article className="rounded-xl border border-stone-200 bg-white p-3 shadow-sm">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500">
              Sources actives
            </h3>
            <ul className="mt-2 space-y-1.5">
              {insights.topSources.slice(0, 3).map((item) => (
                <li key={item.source} className="flex items-center justify-between text-sm">
                  <span className="text-stone-700">{item.label}</span>
                  <span className="font-semibold tabular-nums text-stone-900">{item.count}</span>
                </li>
              ))}
            </ul>
          </article>
        ) : null}

        {insights.hotProspects.length > 0 ? (
          <article className="rounded-xl border border-stone-200 bg-white p-3 shadow-sm">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500">
              Prospects chauds
            </h3>
            <ul className="mt-2 space-y-1.5">
              {insights.hotProspects.slice(0, 3).map((lead) => (
                <li key={lead.id}>
                  <Link
                    href={`/partner-leads/${lead.id}`}
                    className="flex items-center justify-between gap-2 text-sm hover:underline"
                  >
                    <span className="truncate font-medium text-stone-800">{lead.name}</span>
                    <LeadStatusBadge status={lead.status} />
                  </Link>
                </li>
              ))}
            </ul>
          </article>
        ) : null}

        {insights.upcomingFollowups.length > 0 ? (
          <article className="rounded-xl border border-stone-200 bg-white p-3 shadow-sm">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500">
              Relances à venir
            </h3>
            <ul className="mt-2 space-y-1.5">
              {insights.upcomingFollowups.slice(0, 3).map((lead) => (
                <li key={lead.id}>
                  <Link href={`/partner-leads/${lead.id}`} className="block text-sm hover:underline">
                    <span className="font-medium text-stone-800">{lead.name}</span>
                    <span className="mt-0.5 block text-xs text-stone-500">
                      {formatDate(lead.next_followup_at!)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </article>
        ) : null}

        {insights.recentConversions.length > 0 ? (
          <article className="rounded-xl border border-stone-200 bg-white p-3 shadow-sm">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500">
              Conversions récentes
            </h3>
            <ul className="mt-2 space-y-1.5">
              {insights.recentConversions.slice(0, 3).map((lead) => (
                <li key={lead.id}>
                  <Link href={`/partner-leads/${lead.id}`} className="block text-sm hover:underline">
                    <span className="font-medium text-stone-800">{lead.name}</span>
                    <span className="mt-0.5 block text-xs text-stone-500">
                      {formatDate(lead.converted_at!)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </article>
        ) : null}

        {insights.byOrganizationType.length > 0 ? (
          <article className="rounded-xl border border-stone-200 bg-white p-3 shadow-sm">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500">
              Par type
            </h3>
            <ul className="mt-2 space-y-1.5">
              {insights.byOrganizationType.slice(0, 3).map((item) => (
                <li key={item.type} className="flex items-center justify-between text-sm">
                  <span className="text-stone-700">{organizationTypeLabel(item.type)}</span>
                  <span className="font-semibold tabular-nums text-stone-900">{item.count}</span>
                </li>
              ))}
            </ul>
          </article>
        ) : null}
      </div>
    </section>
  );
}
