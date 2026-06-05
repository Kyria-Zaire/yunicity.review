"use client";

import { StaffDetailRevokeRoleDialog } from "@/components/staff/detail/staff-detail-revoke-role-dialog";
import type { AdminStaffDetailResponse, AdminStaffPlatformRole } from "@yunicity/types";
import {
  STAFF_REASON_MAX_LENGTH,
  STAFF_SELF_MODIFY_COPY,
  availableStaffRolesForAssignment,
  canAssignStaffRole,
  canRevokeStaffRole,
  isStaffSelfTarget,
  staffRoleLabel,
} from "@yunicity/utils";
import { useEffect, useMemo, useState } from "react";

interface StaffDetailRbacSectionProps {
  staff: AdminStaffDetailResponse;
  currentUserId: string | null;
  isSubmitting: boolean;
  actionError: string | null;
  onAssignRole: (role: AdminStaffPlatformRole, reason?: string | null) => Promise<boolean>;
  onRevokeRole: (role: string) => Promise<boolean>;
  onClearActionError: () => void;
}

export function StaffDetailRbacSection({
  staff,
  currentUserId,
  isSubmitting,
  actionError,
  onAssignRole,
  onRevokeRole,
  onClearActionError,
}: StaffDetailRbacSectionProps) {
  const availableRoles = useMemo(
    () => availableStaffRolesForAssignment(staff.roles),
    [staff.roles],
  );
  const [selectedRole, setSelectedRole] = useState<AdminStaffPlatformRole | "">("");
  const [assignReason, setAssignReason] = useState("");
  const [assignError, setAssignError] = useState<string | null>(null);
  const [revokeRoleKey, setRevokeRoleKey] = useState<string | null>(null);

  const isSelf = isStaffSelfTarget(currentUserId, staff.id);

  useEffect(() => {
    if (selectedRole && !availableRoles.includes(selectedRole)) {
      setSelectedRole("");
    }
  }, [availableRoles, selectedRole]);

  useEffect(() => {
    if (!actionError) {
      return;
    }
    if (revokeRoleKey) {
      return;
    }
    setAssignError(actionError);
  }, [actionError, revokeRoleKey]);

  async function handleAssign(event: React.FormEvent) {
    event.preventDefault();
    onClearActionError();
    setAssignError(null);

    if (!selectedRole) {
      setAssignError("Sélectionnez un rôle à attribuer.");
      return;
    }
    if (!canAssignStaffRole(staff, currentUserId, selectedRole, staff.roles)) {
      setAssignError("Ce rôle ne peut pas être attribué.");
      return;
    }

    const ok = await onAssignRole(selectedRole, assignReason.trim() || null);
    if (ok) {
      setSelectedRole("");
      setAssignReason("");
      setAssignError(null);
    }
  }

  async function handleRevokeConfirm() {
    if (!revokeRoleKey) {
      return;
    }
    const ok = await onRevokeRole(revokeRoleKey);
    if (ok) {
      setRevokeRoleKey(null);
    }
  }

  const assignableRoles = staff.roles.filter((role) =>
    canRevokeStaffRole(staff, currentUserId, role, staff.roles),
  );

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
        Actions RBAC
      </h2>

      {isSelf ? (
        <p className="mt-3 text-sm text-stone-600">{STAFF_SELF_MODIFY_COPY}</p>
      ) : null}

      <form onSubmit={(event) => void handleAssign(event)} className="mt-4 space-y-3">
        <h3 className="text-xs font-medium text-stone-500">Attribuer un rôle</h3>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex-1 text-sm">
            <span className="font-medium text-stone-800">Rôle</span>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as AdminStaffPlatformRole | "")}
              disabled={isSubmitting || isSelf || availableRoles.length === 0}
              className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
            >
              <option value="">
                {availableRoles.length === 0 ? "Tous les rôles sont déjà attribués" : "Choisir…"}
              </option>
              {availableRoles.map((role) => (
                <option key={role} value={role}>
                  {staffRoleLabel(role)}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            disabled={
              isSubmitting ||
              isSelf ||
              !selectedRole ||
              !canAssignStaffRole(staff, currentUserId, selectedRole as AdminStaffPlatformRole, staff.roles)
            }
            className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-50"
          >
            {isSubmitting ? "Envoi…" : "Attribuer"}
          </button>
        </div>
        <label className="block text-sm">
          <span className="font-medium text-stone-800">Motif (optionnel)</span>
          <input
            type="text"
            value={assignReason}
            onChange={(e) => setAssignReason(e.target.value)}
            maxLength={STAFF_REASON_MAX_LENGTH}
            disabled={isSubmitting || isSelf}
            className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
            placeholder="Contexte interne pour l'audit…"
          />
        </label>
        {assignError ? <p className="text-sm text-rose-700">{assignError}</p> : null}
      </form>

      <div className="mt-6 border-t border-stone-100 pt-4">
        <h3 className="text-xs font-medium text-stone-500">Retirer un rôle</h3>
        {staff.roles.length === 0 ? (
          <p className="mt-2 text-sm text-stone-600">Aucun rôle à retirer.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {staff.roles.map((role) => {
              const canRevoke = canRevokeStaffRole(staff, currentUserId, role, staff.roles);
              return (
                <li
                  key={role}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-stone-100 bg-stone-50 px-3 py-2"
                >
                  <span className="text-sm font-medium text-stone-900">{staffRoleLabel(role)}</span>
                  <button
                    type="button"
                    disabled={isSubmitting || !canRevoke}
                    onClick={() => {
                      onClearActionError();
                      setAssignError(null);
                      setRevokeRoleKey(role);
                    }}
                    className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-medium text-rose-800 hover:bg-rose-50 disabled:opacity-50"
                  >
                    Retirer
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {isSelf && assignableRoles.length > 0 ? (
          <p className="mt-2 text-xs text-stone-500">{STAFF_SELF_MODIFY_COPY}</p>
        ) : null}
      </div>

      <StaffDetailRevokeRoleDialog
        role={revokeRoleKey ?? ""}
        isOpen={revokeRoleKey !== null}
        isSubmitting={isSubmitting}
        apiError={revokeRoleKey ? actionError : null}
        onClose={() => setRevokeRoleKey(null)}
        onConfirm={() => void handleRevokeConfirm()}
      />
    </section>
  );
}
