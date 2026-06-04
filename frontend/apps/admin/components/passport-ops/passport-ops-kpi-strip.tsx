import type { PassportOpsStatusFilter } from "@/lib/passport-ops-url";
import { adminPassportStatusLabel } from "@yunicity/utils";

interface PassportOpsKpiStripProps {
  total: number;
  city: string;
  statusFilter: PassportOpsStatusFilter;
  hasSearchQuery: boolean;
}

function statusFilterLabel(status: PassportOpsStatusFilter): string {
  if (!status) {
    return "Tous les statuts";
  }
  return adminPassportStatusLabel(status);
}

export function PassportOpsKpiStrip({
  total,
  city,
  statusFilter,
  hasSearchQuery,
}: PassportOpsKpiStripProps) {
  return (
    <dl className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm">
        <dt className="text-xs font-medium text-stone-500">
          {hasSearchQuery ? "Résultats trouvés" : "Passports (page courante)"}
        </dt>
        <dd className="mt-1 text-2xl font-semibold tabular-nums text-stone-900">{total}</dd>
      </div>
      <div className="rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm">
        <dt className="text-xs font-medium text-stone-500">Ville active</dt>
        <dd className="mt-1 text-lg font-semibold text-stone-900">{city}</dd>
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
