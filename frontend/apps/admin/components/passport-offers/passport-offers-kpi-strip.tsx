import type { AdminOfferStatusFilter } from "@/lib/passport-offers-url";
import { offerStatusLabel } from "@yunicity/utils";

interface PassportOffersKpiStripProps {
  total: number;
  activeCity: string;
  statusFilter: AdminOfferStatusFilter;
}

function statusFilterLabel(status: AdminOfferStatusFilter): string {
  if (!status) {
    return "Tous les statuts";
  }
  return offerStatusLabel(status);
}

export function PassportOffersKpiStrip({
  total,
  activeCity,
  statusFilter,
}: PassportOffersKpiStripProps) {
  return (
    <dl className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm">
        <dt className="text-xs font-medium text-stone-500">Total résultats</dt>
        <dd className="mt-1 text-2xl font-semibold tabular-nums text-stone-900">{total}</dd>
      </div>
      <div className="rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm">
        <dt className="text-xs font-medium text-stone-500">Ville active</dt>
        <dd className="mt-1 text-lg font-semibold text-stone-900">{activeCity}</dd>
      </div>
      <div className="rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm">
        <dt className="text-xs font-medium text-stone-500">Filtre statut</dt>
        <dd className="mt-1 text-lg font-semibold text-stone-900">
          {statusFilterLabel(statusFilter)}
        </dd>
      </div>
    </dl>
  );
}
