"use client";

import type { ConvertLeadPayload, PartnerLead } from "@yunicity/types";
import { useState } from "react";

type ConvertMode = "create" | "link";

export function ConvertLeadModal({
  lead,
  defaultOwnerUserId,
  onClose,
  onSubmit,
}: {
  lead: PartnerLead;
  defaultOwnerUserId: string;
  onClose: () => void;
  onSubmit: (payload: ConvertLeadPayload) => Promise<void>;
}) {
  const [mode, setMode] = useState<ConvertMode>("create");
  const [ownerUserId, setOwnerUserId] = useState(defaultOwnerUserId);
  const [organizationId, setOrganizationId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const payload: ConvertLeadPayload = {
        owner_user_id: ownerUserId.trim(),
      };
      if (mode === "link") {
        payload.organization_id = organizationId.trim();
      }
      await onSubmit(payload);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Conversion impossible.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="convert-lead-title"
    >
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl">
        <h2 id="convert-lead-title" className="text-lg font-semibold">
          Convertir « {lead.name} »
        </h2>
        <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 ring-1 ring-amber-200">
          Les organizations converties restent <strong>pending</strong> et{" "}
          <strong>private</strong> jusqu&apos;à validation modération.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Mode de conversion</legend>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                name="mode"
                checked={mode === "create"}
                onChange={() => setMode("create")}
              />
              Créer une nouvelle organization
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                name="mode"
                checked={mode === "link"}
                onChange={() => setMode("link")}
              />
              Lier une organization existante
            </label>
          </fieldset>

          <label className="block text-sm">
            <span className="font-medium">ID propriétaire (UUID)</span>
            <input
              type="text"
              required
              value={ownerUserId}
              onChange={(e) => setOwnerUserId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              placeholder="UUID utilisateur propriétaire"
            />
          </label>

          {mode === "link" ? (
            <label className="block text-sm">
              <span className="font-medium">ID organization (UUID)</span>
              <input
                type="text"
                required
                value={organizationId}
                onChange={(e) => setOrganizationId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="UUID organization existante"
              />
            </label>
          ) : null}

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:bg-muted"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-yunicity-primary px-4 py-2 text-sm font-medium text-white hover:bg-yunicity-primary-hover disabled:opacity-50"
            >
              {isSubmitting ? "Conversion…" : "Convertir"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
