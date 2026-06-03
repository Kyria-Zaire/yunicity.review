"use client";

import { ORGANIZATION_REVIEW_ACTION_LABELS } from "@yunicity/utils";
import { useEffect, useState } from "react";

type OrganizationReviewRejectDialogProps = {
  organizationName: string;
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
};

export function OrganizationReviewRejectDialog({
  organizationName,
  isOpen,
  isSubmitting,
  onClose,
  onConfirm,
}: OrganizationReviewRejectDialogProps) {
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

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = reason.trim();
    if (!trimmed) {
      setValidationError("Le motif de refus est obligatoire.");
      return;
    }
    setValidationError(null);
    onConfirm(trimmed);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reject-org-title"
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-xl"
      >
        <h3 id="reject-org-title" className="text-lg font-semibold text-stone-900">
          {ORGANIZATION_REVIEW_ACTION_LABELS.rejected}
        </h3>
        <p className="mt-2 text-sm text-stone-600">
          Organisation : <strong>{organizationName}</strong>
        </p>
        <label className="mt-4 block text-sm">
          <span className="font-medium text-stone-800">Motif (obligatoire)</span>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            maxLength={1000}
            className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
            placeholder="Ex. documents incomplets, doublon, hors territoire…"
            disabled={isSubmitting}
          />
        </label>
        {validationError ? (
          <p className="mt-2 text-sm text-rose-700">{validationError}</p>
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
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-rose-700 px-4 py-2 text-sm font-medium text-white hover:bg-rose-800 disabled:opacity-60"
          >
            {isSubmitting ? "Envoi…" : "Confirmer le refus"}
          </button>
        </div>
      </form>
    </div>
  );
}
