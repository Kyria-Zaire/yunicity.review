"use client";

import {
  ADMIN_PASSPORT_REASON_MAX_LENGTH,
  ADMIN_PASSPORT_REASON_MIN_LENGTH,
  isPassportReasonValid,
  passportStatusActionCopy,
  type PassportStatusActionKind,
} from "@yunicity/utils";
import { useEffect, useState } from "react";

interface PassportStatusActionDialogProps {
  kind: PassportStatusActionKind;
  isOpen: boolean;
  isSubmitting: boolean;
  apiError: string | null;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export function PassportStatusActionDialog({
  kind,
  isOpen,
  isSubmitting,
  apiError,
  onClose,
  onConfirm,
}: PassportStatusActionDialogProps) {
  const copy = passportStatusActionCopy(kind);
  const [reason, setReason] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setReason("");
      setValidationError(null);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const trimmed = reason.trim();
  const reasonValid = isPassportReasonValid(reason);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!trimmed) {
      setValidationError("Le motif est obligatoire.");
      return;
    }
    if (trimmed.length < ADMIN_PASSPORT_REASON_MIN_LENGTH) {
      setValidationError(`Le motif doit contenir au moins ${ADMIN_PASSPORT_REASON_MIN_LENGTH} caractères.`);
      return;
    }
    setValidationError(null);
    onConfirm(trimmed);
  }

  const confirmClass =
    copy.confirmTone === "danger"
      ? "rounded-lg bg-rose-700 px-4 py-2 text-sm font-medium text-white hover:bg-rose-800 disabled:opacity-60"
      : "rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-60";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="passport-status-action-dialog-title"
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-xl"
      >
        <h3 id="passport-status-action-dialog-title" className="text-lg font-semibold text-stone-900">
          {copy.title}
        </h3>
        <p className="mt-2 text-sm text-stone-600">{copy.description}</p>
        <p className="mt-3 text-xs text-stone-500">
          Chaque action est journalisée dans passport_admin_actions.
        </p>
        <label className="mt-4 block text-sm">
          <span className="font-medium text-stone-800">Motif (obligatoire)</span>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            maxLength={ADMIN_PASSPORT_REASON_MAX_LENGTH}
            className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
            placeholder="Contexte interne pour l'audit…"
            disabled={isSubmitting}
          />
        </label>
        {validationError ? (
          <p className="mt-2 text-sm text-rose-700">{validationError}</p>
        ) : null}
        {apiError ? (
          <p className="mt-2 text-sm text-rose-700" role="alert">
            {apiError}
          </p>
        ) : null}
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            Annuler
          </button>
          <button type="submit" disabled={isSubmitting || !reasonValid} className={confirmClass}>
            {isSubmitting ? "Envoi…" : copy.confirmLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
