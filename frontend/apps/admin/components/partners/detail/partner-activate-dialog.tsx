"use client";

import type { AdminPartnerActivatePayload } from "@yunicity/types";
import { useEffect, useState } from "react";

type PartnerActivateDialogProps = {
  organizationName: string;
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: (payload: AdminPartnerActivatePayload) => void;
};

export function PartnerActivateDialog({
  organizationName,
  isOpen,
  isSubmitting,
  onClose,
  onConfirm,
}: PartnerActivateDialogProps) {
  const [setPublicVisibility, setSetPublicVisibility] = useState(false);
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setSetPublicVisibility(false);
      setReason("");
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    onConfirm({
      visibility: setPublicVisibility ? "public" : null,
      reason: reason.trim() || null,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="activate-partner-title"
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-xl"
      >
        <h3 id="activate-partner-title" className="text-lg font-semibold text-stone-900">
          Activer le partenaire
        </h3>
        <p className="mt-2 text-sm text-stone-600">
          Organisation : <strong>{organizationName}</strong>
        </p>
        <p className="mt-2 text-sm text-stone-600">
          Passe le statut partenaire à <strong>actif</strong> et l&apos;expose au catalogue public
          (offres, événements, QR). Une organisation <strong>vérifiée</strong> n&apos;est pas
          automatiquement visible : l&apos;activation catalogue est volontaire.
        </p>
        <label className="mt-4 flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={setPublicVisibility}
            onChange={(e) => setSetPublicVisibility(e.target.checked)}
            disabled={isSubmitting}
            className="mt-0.5"
          />
          <span>
            Passer aussi la visibilité organisation à <strong>publique</strong> (recommandé pour
            l&apos;exposition /places)
          </span>
        </label>
        <label className="mt-3 block text-sm">
          <span className="font-medium text-stone-800">Motif (optionnel)</span>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            maxLength={1000}
            disabled={isSubmitting}
            className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
          />
        </label>
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
            className="rounded-lg bg-emerald-800 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-900 disabled:opacity-60"
          >
            {isSubmitting ? "Activation…" : "Activer"}
          </button>
        </div>
      </form>
    </div>
  );
}
