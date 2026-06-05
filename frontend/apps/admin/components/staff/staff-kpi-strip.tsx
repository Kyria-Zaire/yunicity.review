import type { AdminStaffKpiSummary } from "@/lib/hooks/use-admin-staff-list";

interface StaffKpiStripProps {
  kpis: AdminStaffKpiSummary;
  filteredTotal: number;
  isLoading: boolean;
}

export function StaffKpiStrip({ kpis, filteredTotal, isLoading }: StaffKpiStripProps) {
  const display = (value: number) => (isLoading ? "…" : value);

  return (
    <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm">
        <dt className="text-xs font-medium text-stone-500">Total staff</dt>
        <dd className="mt-1 text-2xl font-semibold tabular-nums text-stone-900">
          {display(kpis.total)}
        </dd>
        <dd className="mt-0.5 text-[10px] text-stone-400">
          {filteredTotal} résultat{filteredTotal > 1 ? "s" : ""} filtré{filteredTotal > 1 ? "s" : ""}
        </dd>
      </div>
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 shadow-sm">
        <dt className="text-xs font-medium text-emerald-900">Actifs</dt>
        <dd className="mt-1 text-2xl font-semibold tabular-nums text-emerald-950">
          {display(kpis.active)}
        </dd>
      </div>
      <div className="rounded-xl border border-rose-200 bg-rose-50/60 px-4 py-3 shadow-sm">
        <dt className="text-xs font-medium text-rose-900">Suspendus</dt>
        <dd className="mt-1 text-2xl font-semibold tabular-nums text-rose-950">
          {display(kpis.suspended)}
        </dd>
      </div>
      <div className="rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm">
        <dt className="text-xs font-medium text-stone-500">Super admins</dt>
        <dd className="mt-1 text-2xl font-semibold tabular-nums text-stone-900">
          {display(kpis.superAdmins)}
        </dd>
      </div>
    </dl>
  );
}
