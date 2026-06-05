import type { AdminStaffDetailResponse } from "@yunicity/types";
import { formatStaffDate, staffStatusLabel } from "@yunicity/utils";

export function StaffDetailIdentityCard({ staff }: { staff: AdminStaffDetailResponse }) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Identité</h2>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium text-stone-500">Identifiant</dt>
          <dd className="mt-0.5 break-all font-mono text-xs text-stone-900">{staff.id}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-stone-500">Email</dt>
          <dd className="mt-0.5 text-sm text-stone-900">{staff.email}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-stone-500">Compte actif</dt>
          <dd className="mt-0.5 text-sm text-stone-900">{staffStatusLabel(staff.is_active)}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-stone-500">Ville</dt>
          <dd className="mt-0.5 text-sm text-stone-900">{staff.city ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-stone-500">Créé le</dt>
          <dd className="mt-0.5 text-sm text-stone-900">{formatStaffDate(staff.created_at)}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-stone-500">Mis à jour</dt>
          <dd className="mt-0.5 text-sm text-stone-900">{formatStaffDate(staff.updated_at)}</dd>
        </div>
      </dl>
    </section>
  );
}
