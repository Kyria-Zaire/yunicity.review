"use client";

import type { AdminPartnerCreateProfilePayload, PartnershipType } from "@yunicity/types";
import { PARTNERSHIP_TYPE_SELECT_OPTIONS } from "@yunicity/utils";
import { useEffect, useState } from "react";

type PartnerCreateProfileDialogProps = {
  organizationName: string;
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: (payload: AdminPartnerCreateProfilePayload) => void;
};

export function PartnerCreateProfileDialog({
  organizationName,
  isOpen,
  isSubmitting,
  onClose,
  onConfirm,
}: PartnerCreateProfileDialogProps) {
  const [partnershipType, setPartnershipType] = useState<PartnershipType>("local_business");
  const [publicLabel, setPublicLabel] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setPartnershipType("local_business");
      setPublicLabel("");
      setReason("");
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    onConfirm({
      partnership_type: partnershipType,
      public_partner_label: publicLabel.trim() || null,
      reason: reason.trim() || null,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-profile-title"
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-xl"
      >
        <h3 id="create-profile-title" className="text-lg font-semibold text-stone-900">
          Créer le profil partenaire
        </h3>
        <p className="mt-2 text-sm text-stone-600">
          Organisation : <strong>{organizationName}</strong>
        </p>
        <p className="mt-2 text-sm text-amber-900/90">
          L&apos;organisation doit être <strong>vérifiée</strong>. Le profil démarre en statut{" "}
          <strong>signé</strong> — l&apos;activation catalogue est une étape distincte.
        </p>
        <label className="mt-4 block text-sm">
          <span className="font-medium text-stone-800">Type de partenariat</span>
          <select
            value={partnershipType}
            onChange={(e) => setPartnershipType(e.target.value as PartnershipType)}
            disabled={isSubmitting}
            className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
          >
            {PARTNERSHIP_TYPE_SELECT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label className="mt-3 block text-sm">
          <span className="font-medium text-stone-800">Libellé catalogue (optionnel)</span>
          <input
            type="text"
            value={publicLabel}
            onChange={(e) => setPublicLabel(e.target.value)}
            maxLength={160}
            disabled={isSubmitting}
            className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
            placeholder="Ex. Cuisine asiatique"
          />
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
            className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-60"
          >
            {isSubmitting ? "Création…" : "Créer le profil"}
          </button>
        </div>
      </form>
    </div>
  );
}
