"use client";

import { STAFF_REASON_MAX_LENGTH } from "@yunicity/utils";
import { useEffect, useState } from "react";

interface StaffDetailReasonDialogProps {
  title: string;
  description: string;
  confirmLabel: string;
  warning?: string;
  isOpen: boolean;
  isSubmitting: boolean;
  apiError: string | null;
  onClose: () => void;
  onConfirm: (reason: string | null) => void;
}

export function StaffDetailReasonDialog({
  title,
  description,
  confirmLabel,
  warning,
  isOpen,
  isSubmitting,
  apiError,
  onClose,
  onConfirm,
}: StaffDetailReasonDialogProps) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setReason("");
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    onConfirm(reason.trim() || null);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="staff-action-dialog-title"
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-xl"
      >
        <h3 id="staff-action-dialog-title" className="text-lg font-semibold text-stone-900">
          {title}
        </h3>
        <p className="mt-2 text-sm text-stone-600">{description}</p>
        {warning ? (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {warning}
          </p>
        ) : null}
        <label className="mt-4 block text-sm">
          <span className="font-medium text-stone-800">Motif (optionnel)</span>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            maxLength={STAFF_REASON_MAX_LENGTH}
            className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
            placeholder="Contexte interne pour l'audit…"
            disabled={isSubmitting}
          />
        </label>
        {apiError ? <p className="mt-2 text-sm text-rose-700">{apiError}</p> : null}
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
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-60"
          >
            {isSubmitting ? "Envoi…" : confirmLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
