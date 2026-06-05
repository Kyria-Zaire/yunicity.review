import type { AdminStaffDetailResponse } from "@yunicity/types";
import { formatStaffRolesList, staffRoleLabel } from "@yunicity/utils";

export function StaffDetailRolesCard({ staff }: { staff: AdminStaffDetailResponse }) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
        Rôles et permissions
      </h2>
      <div className="mt-4 space-y-4">
        <div>
          <h3 className="text-xs font-medium text-stone-500">Rôles assignés</h3>
          {staff.roles.length > 0 ? (
            <ul className="mt-2 flex flex-wrap gap-2">
              {staff.roles.map((role) => (
                <li
                  key={role}
                  className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-medium text-stone-800"
                >
                  {staffRoleLabel(role)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-stone-600">Aucun rôle staff.</p>
          )}
        </div>
        <div>
          <h3 className="text-xs font-medium text-stone-500">Permissions effectives</h3>
          {staff.permissions.length > 0 ? (
            <ul className="mt-2 grid gap-1 text-sm text-stone-700 sm:grid-cols-2">
              {staff.permissions.map((permission) => (
                <li key={permission} className="font-mono text-xs">
                  {permission}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-stone-600">Aucune permission.</p>
          )}
          <p className="mt-2 text-xs text-stone-500">
            Résumé rôles : {formatStaffRolesList(staff.roles)}
          </p>
        </div>
      </div>
    </section>
  );
}
