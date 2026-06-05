"use client";

import { STAFF_REVOKE_SECURITY_COPY, staffRoleLabel } from "@yunicity/utils";

interface StaffDetailRevokeRoleDialogProps {
  role: string;
  isOpen: boolean;
  isSubmitting: boolean;
  apiError: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

export function StaffDetailRevokeRoleDialog({
  role,
  isOpen,
  isSubmitting,
  apiError,
  onClose,
  onConfirm,
}: StaffDetailRevokeRoleDialogProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="staff-revoke-dialog-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-xl">
        <h3 id="staff-revoke-dialog-title" className="text-lg font-semibold text-stone-900">
          Retirer ce rôle ?
        </h3>
        <p className="mt-2 text-sm text-stone-600">
          Confirmez le retrait du rôle{" "}
          <span className="font-medium text-stone-900">{staffRoleLabel(role)}</span>.
        </p>
        <p className="mt-3 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-600">
          {STAFF_REVOKE_SECURITY_COPY}
        </p>
        {apiError ? <p className="mt-3 text-sm text-rose-700">{apiError}</p> : null}
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-60"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="rounded-lg bg-rose-700 px-4 py-2 text-sm font-medium text-white hover:bg-rose-800 disabled:opacity-60"
          >
            {isSubmitting ? "Envoi…" : "Retirer le rôle"}
          </button>
        </div>
      </div>
    </div>
  );
}
