"use client";

import {
  POST_NEW_DISCARD_CANCEL,
  POST_NEW_DISCARD_CONFIRM,
  POST_NEW_DISCARD_HINT,
  POST_NEW_DISCARD_TITLE,
  POST_NEW_LEAVE_NO_CANCEL_CANCEL,
  POST_NEW_LEAVE_NO_CANCEL_CONFIRM,
  POST_NEW_LEAVE_NO_CANCEL_DRAFT_LOST,
  POST_NEW_LEAVE_NO_CANCEL_HINT,
  POST_NEW_LEAVE_NO_CANCEL_TITLE,
} from "@yunicity/utils";
import { useEffect, useRef } from "react";

import type { NewPostLeaveVariant } from "@/hooks/use-new-post-leave";

const TEXTES = {
  draft: {
    title: POST_NEW_DISCARD_TITLE,
    hints: [POST_NEW_DISCARD_HINT],
    confirm: POST_NEW_DISCARD_CONFIRM,
    cancel: POST_NEW_DISCARD_CANCEL,
  },
  uncertain: {
    title: POST_NEW_LEAVE_NO_CANCEL_TITLE,
    hints: [POST_NEW_LEAVE_NO_CANCEL_HINT, POST_NEW_LEAVE_NO_CANCEL_DRAFT_LOST],
    confirm: POST_NEW_LEAVE_NO_CANCEL_CONFIRM,
    cancel: POST_NEW_LEAVE_NO_CANCEL_CANCEL,
  },
} as const;

/**
 * Confirmation de sortie — action **destructive**, donc confirmée.
 *
 * Le focus part sur l'action NON destructive (rester) : au clavier, une
 * validation réflexe ne doit pas détruire le texte en cours. Échap équivaut à
 * rester.
 */
export function NewPostDiscardDialog({
  open,
  variant,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  variant: NewPostLeaveVariant;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const annulerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    annulerRef.current?.focus();
    function surTouche(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", surTouche);
    return () => document.removeEventListener("keydown", surTouche);
  }, [open, onCancel]);

  if (!open) return null;
  const textes = TEXTES[variant];

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-neutral-900/40 px-6">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="new-post-discard-title"
        aria-describedby="new-post-discard-hint"
        className="w-full max-w-sm rounded-2xl bg-white p-5"
      >
        <h2 id="new-post-discard-title" className="text-base font-bold text-neutral-900">
          {textes.title}
        </h2>
        <div id="new-post-discard-hint" className="mt-2 space-y-1">
          {textes.hints.map((hint) => (
            <p key={hint} className="text-sm leading-5 text-neutral-600">
              {hint}
            </p>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <button
            ref={annulerRef}
            type="button"
            onClick={onCancel}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-yunicity-primary px-4 text-sm font-semibold text-white transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yunicity-primary"
          >
            {textes.cancel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 text-sm font-semibold text-red-600 transition hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yunicity-primary"
          >
            {textes.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}
