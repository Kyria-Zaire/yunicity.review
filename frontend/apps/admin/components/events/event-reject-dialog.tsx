"use client";

import { useEffect, useState } from "react";

interface EventRejectDialogProps {
  eventTitle: string;
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export function EventRejectDialog({
  eventTitle,
  isOpen,
  isSubmitting,
  onClose,
  onConfirm,
}: EventRejectDialogProps) {
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
    if (trimmed.length < 3) {
      setValidationError("Le motif doit contenir au moins 3 caractères.");
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
      aria-labelledby="reject-event-title"
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-xl"
      >
        <h3 id="reject-event-title" className="text-lg font-semibold text-stone-900">
          Refuser l&apos;événement
        </h3>
        <p className="mt-2 text-sm text-stone-600">
          <span className="font-medium text-stone-800">{eventTitle}</span> — le partenaire pourra
          corriger et resoumettre.
        </p>
        <label className="mt-4 block space-y-1">
          <span className="text-xs font-medium uppercase tracking-wide text-stone-500">
            Motif de refus
          </span>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900"
            placeholder="Expliquez brièvement la raison du refus…"
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
            className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50 disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-rose-700 px-4 py-2 text-sm font-medium text-white hover:bg-rose-800 disabled:opacity-50"
          >
            {isSubmitting ? "Envoi…" : "Confirmer le refus"}
          </button>
        </div>
      </form>
    </div>
  );
}
