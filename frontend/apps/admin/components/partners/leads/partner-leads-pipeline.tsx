import type { PartnerLeadPipelineResult } from "@yunicity/utils";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

export function PartnerLeadsPipeline({ pipeline }: { pipeline: PartnerLeadPipelineResult }) {
  return (
    <section
      className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6"
      aria-label="Pipeline visuel prospects"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">
            Funnel terrain
          </p>
          <h2 className="mt-1 text-lg font-bold tracking-tight text-stone-950 sm:text-xl">
            Du premier contact à l&apos;intégration réseau
          </h2>
        </div>
        <p className="text-sm font-medium text-stone-600">
          {pipeline.total} prospect{pipeline.total > 1 ? "s" : ""} au total
        </p>
      </div>

      <div className="mt-6 overflow-x-auto pb-2">
        <div className="flex min-w-[960px] gap-3">
          {pipeline.columns.map((column, index) => (
            <div key={column.status} className="flex min-w-[148px] flex-1 items-stretch gap-2">
              <article className="flex min-h-[220px] min-w-0 flex-1 flex-col rounded-2xl border border-stone-200 bg-stone-50/60 p-4">
                <div className="space-y-1">
                  <p className="text-sm font-bold leading-tight text-stone-900">
                    {column.shortLabel}
                  </p>
                  <p className="text-[11px] leading-snug text-stone-500">{column.hint}</p>
                </div>
                <p className="mt-4 text-3xl font-bold tabular-nums tracking-tight text-stone-950">
                  {column.count}
                </p>
                <ul className="mt-4 flex-1 space-y-2">
                  {column.preview.length > 0 ? (
                    column.preview.map((lead) => (
                      <li key={lead.id}>
                        <Link
                          href={`/partner-leads/${lead.id}`}
                          className="block text-sm font-medium leading-snug text-stone-800 hover:text-yunicity-primary hover:underline"
                        >
                          {lead.name}
                        </Link>
                      </li>
                    ))
                  ) : (
                    <li className="text-sm leading-snug text-stone-500">{column.emptyNarrative}</li>
                  )}
                </ul>
                <Link
                  href={column.filterHref}
                  className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-yunicity-primary"
                >
                  Voir la liste
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </Link>
              </article>
              {index < pipeline.columns.length - 1 ? (
                <span
                  className="hidden shrink-0 self-center px-0.5 text-lg text-stone-300 lg:inline"
                  aria-hidden
                >
                  →
                </span>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
