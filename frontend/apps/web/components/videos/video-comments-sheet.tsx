"use client";

import { LOCAL_VIDEO_COMMENTS_EMPTY } from "@yunicity/utils";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

type VideoCommentsSheetProps = {
  open: boolean;
  onClose: () => void;
};

export function VideoCommentsSheet({ open, onClose }: VideoCommentsSheetProps) {
  const [keyboardExpanded, setKeyboardExpanded] = useState(false);

  useEffect(() => {
    if (!open) {
      setKeyboardExpanded(false);
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Fermer les commentaires"
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Commentaires"
        className={`relative z-10 flex flex-col rounded-t-3xl bg-white shadow-2xl transition-[height] duration-200 ${
          keyboardExpanded ? "h-[90dvh]" : "h-[60dvh]"
        }`}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
          <h2 className="text-base font-bold text-neutral-900">Commentaires</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-100"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <div className="flex flex-1 flex-col px-4 py-6">
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <p className="text-sm text-neutral-600">{LOCAL_VIDEO_COMMENTS_EMPTY}</p>
          </div>
          <textarea
            rows={1}
            readOnly
            placeholder="Écrire un commentaire…"
            onFocus={() => setKeyboardExpanded(true)}
            onBlur={() => setKeyboardExpanded(false)}
            className="w-full resize-none rounded-2xl border border-neutral-200 px-4 py-3 text-sm text-neutral-700"
            aria-label="Zone de commentaire (bientôt disponible)"
          />
        </div>
      </section>
    </div>
  );
}
