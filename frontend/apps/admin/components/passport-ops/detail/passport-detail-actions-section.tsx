"use client";

import { PassportStatusActionDialog } from "@/components/passport-ops/detail/passport-status-action-dialog";
import type { AdminPassportStatus } from "@yunicity/types";
import {
  canModifyPassportStatus,
  canReactivatePassport,
  canSuspendPassport,
  type PassportStatusActionKind,
} from "@yunicity/utils";
import { useState } from "react";

interface PassportDetailActionsSectionProps {
  status: AdminPassportStatus;
  isSubmitting: boolean;
  actionError: string | null;
  onClearActionError: () => void;
  onSuspend: (reason: string) => Promise<boolean>;
  onReactivate: (reason: string) => Promise<boolean>;
}

export function PassportDetailActionsSection({
  status,
  isSubmitting,
  actionError,
  onClearActionError,
  onSuspend,
  onReactivate,
}: PassportDetailActionsSectionProps) {
  const [openDialog, setOpenDialog] = useState<PassportStatusActionKind | null>(null);

  function openActionDialog(kind: PassportStatusActionKind) {
    onClearActionError();
    setOpenDialog(kind);
  }

  if (!canModifyPassportStatus(status)) {
    return (
      <section className="rounded-2xl border border-stone-200 bg-stone-50/80 px-4 py-3 text-sm text-stone-600">
        Statut non modifiable en V1.
      </section>
    );
  }

  async function handleConfirm(reason: string) {
    if (!openDialog) {
      return;
    }
    const ok =
      openDialog === "suspend" ? await onSuspend(reason) : await onReactivate(reason);
    if (ok) {
      setOpenDialog(null);
    }
  }

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
        Actions staff
      </h2>
      <p className="mt-2 text-xs text-stone-500">
        Chaque action est journalisée dans passport_admin_actions.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {canSuspendPassport(status) ? (
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => openActionDialog("suspend")}
            className="rounded-lg bg-rose-700 px-4 py-2 text-sm font-medium text-white hover:bg-rose-800 disabled:opacity-60"
          >
            Suspendre le Passport
          </button>
        ) : null}
        {canReactivatePassport(status) ? (
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => openActionDialog("reactivate")}
            className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-60"
          >
            Réactiver le Passport
          </button>
        ) : null}
      </div>

      {openDialog ? (
        <PassportStatusActionDialog
          kind={openDialog}
          isOpen
          isSubmitting={isSubmitting}
          apiError={actionError}
          onClose={() => setOpenDialog(null)}
          onConfirm={(reason) => void handleConfirm(reason)}
        />
      ) : null}
    </section>
  );
}
