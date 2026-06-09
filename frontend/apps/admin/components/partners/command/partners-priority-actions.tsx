import type { AdminPartnersWorkspaceSummary } from "@yunicity/types";
import { formatAdminMetric, partnerPriorityActions } from "@yunicity/utils";
import Link from "next/link";

export function PartnersPriorityActions({
  summary,
}: {
  summary: AdminPartnersWorkspaceSummary;
}) {
  const actions = partnerPriorityActions(summary);

  return (
    <section
      className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5"
      aria-labelledby="partners-priority-title"
    >
      <h2
        id="partners-priority-title"
        className="text-[10px] font-semibold uppercase tracking-widest text-stone-500"
      >
        Que devez-vous traiter ?
      </h2>

      {actions.length === 0 ? (
        <div className="mt-3 rounded-xl border border-stone-100 bg-stone-50/60 px-4 py-4">
          <p className="text-sm font-medium text-stone-800">
            Aucune action partenaire urgente pour {summary.city}.
          </p>
          <p className="mt-1 text-sm text-stone-600">
            Le réseau est prêt à accueillir ses premiers partenaires pilotes.
          </p>
        </div>
      ) : (
        <ul className="mt-3 space-y-2">
          {actions.map((action) => (
            <li key={action.id}>
              <Link
                href={action.href}
                className="flex items-center justify-between rounded-xl border border-stone-100 bg-stone-50/40 px-4 py-3 transition hover:border-yunicity-primary/30 hover:bg-yunicity-primary-soft/40"
              >
                <span className="text-sm font-medium text-stone-900">{action.label}</span>
                <span className="rounded-full bg-yunicity-primary px-2.5 py-0.5 text-xs font-semibold text-white tabular-nums">
                  {formatAdminMetric(action.count)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
