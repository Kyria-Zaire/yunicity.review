"use client";

import { StaffDetailReasonDialog } from "@/components/staff/detail/staff-detail-reason-dialog";
import type { AdminStaffDetailResponse } from "@yunicity/types";
import {
  STAFF_SELF_MODIFY_COPY,
  STAFF_SUSPEND_WARNING_COPY,
  canReactivateStaffUser,
  canSuspendStaffUser,
  isStaffSelfTarget,
  staffStatusLabel,
} from "@yunicity/utils";
import { useState } from "react";

interface StaffDetailAccountAccessSectionProps {
  staff: AdminStaffDetailResponse;
  currentUserId: string | null;
  isSubmitting: boolean;
  actionError: string | null;
  onSuspend: (reason?: string | null) => Promise<boolean>;
  onReactivate: (reason?: string | null) => Promise<boolean>;
  onClearActionError: () => void;
}

export function StaffDetailAccountAccessSection({
  staff,
  currentUserId,
  isSubmitting,
  actionError,
  onSuspend,
  onReactivate,
  onClearActionError,
}: StaffDetailAccountAccessSectionProps) {
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [reactivateOpen, setReactivateOpen] = useState(false);
  const isSelf = isStaffSelfTarget(currentUserId, staff.id);
  const canSuspend = canSuspendStaffUser(staff, currentUserId);
  const canReactivate = canReactivateStaffUser(staff, currentUserId);

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
        Accès compte
      </h2>
      <p className="mt-2 text-sm text-stone-700">
        Statut actuel : <span className="font-medium">{staffStatusLabel(staff.is_active)}</span>
      </p>

      {isSelf ? (
        <p className="mt-3 text-sm text-stone-600">{STAFF_SELF_MODIFY_COPY}</p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {staff.is_active ? (
          <button
            type="button"
            disabled={isSubmitting || !canSuspend}
            onClick={() => {
              onClearActionError();
              setSuspendOpen(true);
            }}
            className="rounded-lg bg-rose-700 px-4 py-2 text-sm font-medium text-white hover:bg-rose-800 disabled:opacity-50"
          >
            Suspendre
          </button>
        ) : (
          <button
            type="button"
            disabled={isSubmitting || !canReactivate}
            onClick={() => {
              onClearActionError();
              setReactivateOpen(true);
            }}
            className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
          >
            Réactiver
          </button>
        )}
      </div>

      <StaffDetailReasonDialog
        title="Suspendre ce compte staff"
        description={`Confirmez la suspension de ${staff.full_name}.`}
        confirmLabel="Suspendre le compte"
        warning={STAFF_SUSPEND_WARNING_COPY}
        isOpen={suspendOpen}
        isSubmitting={isSubmitting}
        apiError={suspendOpen ? actionError : null}
        onClose={() => setSuspendOpen(false)}
        onConfirm={(reason) => {
          void onSuspend(reason).then((ok) => {
            if (ok) {
              setSuspendOpen(false);
            }
          });
        }}
      />

      <StaffDetailReasonDialog
        title="Réactiver ce compte staff"
        description={`Confirmez la réactivation de ${staff.full_name}.`}
        confirmLabel="Réactiver le compte"
        isOpen={reactivateOpen}
        isSubmitting={isSubmitting}
        apiError={reactivateOpen ? actionError : null}
        onClose={() => setReactivateOpen(false)}
        onConfirm={(reason) => {
          void onReactivate(reason).then((ok) => {
            if (ok) {
              setReactivateOpen(false);
            }
          });
        }}
      />
    </section>
  );
}
