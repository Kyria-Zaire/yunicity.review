import type { PartnerCreatorContentAdmin } from "@yunicity/types";
import { countCreatorContentKpis } from "@yunicity/utils";

interface CreatorContentKpiStripProps {
  apiTotal: number;
  items: PartnerCreatorContentAdmin[];
  usesClientOrganizationFilter: boolean;
}

export function CreatorContentKpiStrip({
  apiTotal,
  items,
  usesClientOrganizationFilter,
}: CreatorContentKpiStripProps) {
  const counts = countCreatorContentKpis(items);
  const breakdownNote =
    usesClientOrganizationFilter || items.length < apiTotal
      ? "Répartition sur les résultats affichés"
      : "Répartition sur la page courante";

  return (
    <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm">
        <dt className="text-xs font-medium text-stone-500">Total résultats</dt>
        <dd className="mt-1 text-2xl font-semibold tabular-nums text-stone-900">{apiTotal}</dd>
      </div>
      <div className="rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm">
        <dt className="text-xs font-medium text-stone-500">En attente</dt>
        <dd className="mt-1 text-2xl font-semibold tabular-nums text-amber-900">
          {counts.pendingReview}
        </dd>
        <dd className="mt-0.5 text-[10px] text-stone-400">{breakdownNote}</dd>
      </div>
      <div className="rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm">
        <dt className="text-xs font-medium text-stone-500">Approuvés</dt>
        <dd className="mt-1 text-2xl font-semibold tabular-nums text-emerald-900">
          {counts.approved}
        </dd>
        <dd className="mt-0.5 text-[10px] text-stone-400">{breakdownNote}</dd>
      </div>
      <div className="rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm">
        <dt className="text-xs font-medium text-stone-500">Refusés</dt>
        <dd className="mt-1 text-2xl font-semibold tabular-nums text-rose-900">
          {counts.rejected}
        </dd>
        <dd className="mt-0.5 text-[10px] text-stone-400">{breakdownNote}</dd>
      </div>
    </dl>
  );
}
