"use client";

import { useEffect, useState } from "react";

interface ActivationWaveItemNotesProps {
  notes: string | null;
  disabled: boolean;
  onSave: (notes: string | null) => void;
}

export function ActivationWaveItemNotes({ notes, disabled, onSave }: ActivationWaveItemNotesProps) {
  const [draft, setDraft] = useState(notes ?? "");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setDraft(notes ?? "");
  }, [notes]);

  if (!isOpen) {
    return (
      <div className="space-y-1">
        <p className="line-clamp-2 text-xs text-stone-600">{notes?.trim() || "—"}</p>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(true)}
          className="text-xs font-medium text-stone-800 underline-offset-2 hover:underline disabled:opacity-50"
        >
          Modifier les notes
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <textarea
        value={draft}
        disabled={disabled}
        onChange={(event) => setDraft(event.target.value)}
        rows={3}
        maxLength={5000}
        placeholder="Notes terrain (staff)"
        className="w-full min-w-[12rem] rounded-lg border border-stone-200 px-2 py-1.5 text-xs text-stone-800 focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            onSave(draft.trim() || null);
            setIsOpen(false);
          }}
          className="rounded-lg bg-stone-900 px-2 py-1 text-xs font-medium text-white hover:bg-stone-800 disabled:opacity-50"
        >
          Enregistrer
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            setDraft(notes ?? "");
            setIsOpen(false);
          }}
          className="rounded-lg px-2 py-1 text-xs font-medium text-stone-600 hover:bg-stone-100 disabled:opacity-50"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}
