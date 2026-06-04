import type { AdminReportStatusSummary } from "@yunicity/types";

interface ModerationKpiStripProps {
  summary: AdminReportStatusSummary;
  filteredTotal: number;
}

export function ModerationKpiStrip({ summary, filteredTotal }: ModerationKpiStripProps) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm">
        <dt className="text-xs font-medium text-stone-500">Total (base)</dt>
        <dd className="mt-1 text-2xl font-semibold tabular-nums text-stone-900">{summary.total}</dd>
        <dd className="mt-0.5 text-[10px] text-stone-400">Tous statuts confondus</dd>
      </div>
      <div className="rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3 shadow-sm">
        <dt className="text-xs font-medium text-amber-900">En attente</dt>
        <dd className="mt-1 text-2xl font-semibold tabular-nums text-amber-950">
          {summary.pending}
        </dd>
      </div>
      <div className="rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm">
        <dt className="text-xs font-medium text-stone-500">Traités</dt>
        <dd className="mt-1 text-2xl font-semibold tabular-nums text-emerald-900">
          {summary.resolved}
        </dd>
        <dd className="mt-0.5 text-[10px] text-stone-400">Examinés + action prise</dd>
      </div>
      <div className="rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm">
        <dt className="text-xs font-medium text-stone-500">Classés sans suite</dt>
        <dd className="mt-1 text-2xl font-semibold tabular-nums text-stone-700">
          {summary.dismissed}
        </dd>
        <dd className="mt-0.5 text-[10px] text-stone-400">
          {filteredTotal} résultat{filteredTotal > 1 ? "s" : ""} filtré{filteredTotal > 1 ? "s" : ""}
        </dd>
      </div>
    </dl>
  );
}
