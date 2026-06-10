"use client";

import type {
  PartnerLead,
  PartnerLeadStatus,
  PartnerLeadUpdatePayload,
} from "@yunicity/types";
import {
  PARTNER_LEAD_STATUS_LABELS,
  partnerLeadIsConverted,
} from "@yunicity/utils";
import {
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
} from "@/lib/format";
import { X } from "lucide-react";
import { useEffect, useId, useState } from "react";

const STATUS_OPTIONS = Object.entries(PARTNER_LEAD_STATUS_LABELS) as [
  PartnerLeadStatus,
  string,
][];

type PartnerLead360EditModalProps = {
  lead: PartnerLead;
  open: boolean;
  onClose: () => void;
  onSave: (payload: PartnerLeadUpdatePayload) => Promise<void>;
  isSaving: boolean;
  saveError: string | null;
};

export function PartnerLead360EditModal({
  lead,
  open,
  onClose,
  onSave,
  isSaving,
  saveError,
}: PartnerLead360EditModalProps) {
  const errorId = useId();
  const converted = partnerLeadIsConverted(lead);

  const [status, setStatus] = useState<PartnerLeadStatus>(lead.status);
  const [notes, setNotes] = useState(lead.notes ?? "");
  const [tagsInput, setTagsInput] = useState(lead.tags.join(", "));
  const [nextFollowup, setNextFollowup] = useState(toDatetimeLocalValue(lead.next_followup_at));

  useEffect(() => {
    if (!open) {
      return;
    }
    setStatus(lead.status);
    setNotes(lead.notes ?? "");
    setTagsInput(lead.tags.join(", "));
    setNextFollowup(toDatetimeLocalValue(lead.next_followup_at));
  }, [open, lead]);

  useEffect(() => {
    if (!open) {
      return;
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    await onSave({
      status,
      notes: notes.trim() || null,
      tags,
      next_followup_at: fromDatetimeLocalValue(nextFollowup),
    });
  }

  const fieldClass =
    "mt-1.5 w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm focus:border-yunicity-primary focus:outline-none focus:ring-2 focus:ring-yunicity-primary/20";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-stone-950/50 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-prospect-title"
    >
      <div className="flex max-h-[92vh] w-full flex-col rounded-t-2xl border border-stone-200 bg-white shadow-xl sm:max-w-lg sm:rounded-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-stone-100 px-4 py-4 sm:px-5">
          <div>
            <h2 id="edit-prospect-title" className="text-lg font-bold text-stone-950">
              Modifier le prospect
            </h2>
            <p className="mt-0.5 text-sm text-stone-500">{lead.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-stone-500 hover:bg-stone-100"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <form onSubmit={(e) => void handleSubmit(e)} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
            <label className="block text-sm">
              <span className="font-medium text-stone-800">Statut</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PartnerLeadStatus)}
                disabled={converted}
                className={`${fieldClass} disabled:opacity-50`}
              >
                {STATUS_OPTIONS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="font-medium text-stone-800">Notes</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className={`${fieldClass} resize-none`}
                placeholder="Compte-rendu terrain, prochaine action…"
              />
            </label>

            <label className="block text-sm">
              <span className="font-medium text-stone-800">Tags</span>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className={fieldClass}
                placeholder="restaurant, centre-ville"
              />
              <span className="mt-1 block text-xs text-stone-500">Séparez les tags par des virgules.</span>
            </label>

            <label className="block text-sm">
              <span className="font-medium text-stone-800">Prochaine relance</span>
              <input
                type="datetime-local"
                value={nextFollowup}
                onChange={(e) => setNextFollowup(e.target.value)}
                className={fieldClass}
              />
            </label>

            {saveError ? (
              <p id={errorId} role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                {saveError}
              </p>
            ) : null}
          </div>

          <div className="shrink-0 border-t border-stone-100 px-4 py-3 sm:px-5">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full rounded-xl bg-yunicity-primary px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {isSaving ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
