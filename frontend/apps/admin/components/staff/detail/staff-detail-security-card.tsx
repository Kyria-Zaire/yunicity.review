import type { AdminStaffDetailResponse } from "@yunicity/types";
import { staffStatusLabel } from "@yunicity/utils";

export function StaffDetailSecurityCard({ staff }: { staff: AdminStaffDetailResponse }) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Sécurité</h2>
      <dl className="mt-4 space-y-3 text-sm">
        <div>
          <dt className="text-xs font-medium text-stone-500">Statut du compte</dt>
          <dd className="mt-1 text-stone-900">{staffStatusLabel(staff.is_active)}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-stone-500">Email vérifié</dt>
          <dd className="mt-1 text-stone-900">{staff.is_verified ? "Oui" : "Non"}</dd>
        </div>
      </dl>
      <p className="mt-4 rounded-lg border border-dashed border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600">
        Les actions de gestion seront disponibles en ADMIN-08D.
      </p>
    </section>
  );
}
