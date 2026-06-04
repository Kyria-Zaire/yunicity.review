"use client";

import {
  REPORT_RESOLUTION_NOTE_MAX_LENGTH,
  reportResolutionActionCopy,
  validateReportResolutionReason,
  type ReportResolutionActionKey,
} from "@yunicity/utils";
import { useEffect, useId, useState } from "react";

type ModerationReportResolutionDialogProps = {
  action: ReportResolutionActionKey;
  isOpen: boolean;
  isSubmitting: boolean;
  apiError: string | null;
  initialHidePost?: boolean;
  onClose: () => void;
  onConfirmDismiss: (reason: string | null) => void;
  onConfirmResolve: (payload: { reason: string | null; hide_post: boolean }) => void;
};

export function ModerationReportResolutionDialog({
  action,
  isOpen,
  isSubmitting,
  apiError,
  initialHidePost = false,
  onClose,
  onConfirmDismiss,
  onConfirmResolve,
}: ModerationReportResolutionDialogProps) {
  const titleId = useId();
  const [note, setNote] = useState("");
  const [hidePost, setHidePost] = useState(initialHidePost);
  const [validationError, setValidationError] = useState<string | null>(null);

  const isDismiss = action === "dismiss";
  const isResolve = action === "resolve" || action === "resolve_hide";
  const copy = reportResolutionActionCopy(action);

  useEffect(() => {
    if (!isOpen) {
      setNote("");
      setHidePost(initialHidePost);
      setValidationError(null);
    }
  }, [isOpen, initialHidePost]);

  useEffect(() => {
    if (isOpen && isResolve) {
      setHidePost(initialHidePost);
    }
  }, [isOpen, isResolve, initialHidePost]);

  if (!isOpen) {
    return null;
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (isDismiss) {
      const result = validateReportResolutionReason(note, false);
      if (!result.valid) {
        setValidationError(result.message);
        return;
      }
      setValidationError(null);
      onConfirmDismiss(result.normalized);
      return;
    }

    const result = validateReportResolutionReason(note, hidePost);
    if (!result.valid) {
      setValidationError(result.message);
      return;
    }
    setValidationError(null);
    onConfirmResolve({ reason: result.normalized, hide_post: hidePost });
  }

  const confirmClass =
    action === "resolve_hide"
      ? "rounded-lg bg-rose-700 px-4 py-2 text-sm font-medium text-white hover:bg-rose-800 disabled:opacity-60"
      : "rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-60";

  const noteLabel = hidePost && isResolve ? "Note staff (obligatoire)" : "Note staff (optionnelle)";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-xl"
      >
        <h3 id={titleId} className="text-lg font-semibold text-stone-900">
          {isResolve ? "Résoudre ce signalement" : copy.title}
        </h3>
        <p className="mt-2 text-sm text-stone-600">
          {isResolve
            ? "Choisissez si le contenu signalé doit rester visible dans le feed."
            : copy.description}
        </p>

        {isResolve ? (
          <fieldset className="mt-4 space-y-2">
            <legend className="sr-only">Mode de résolution</legend>
            <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-stone-200 px-3 py-2 text-sm has-[:checked]:border-stone-400 has-[:checked]:bg-stone-50">
              <input
                type="radio"
                name="resolve-mode"
                checked={!hidePost}
                onChange={() => setHidePost(false)}
                disabled={isSubmitting}
                className="mt-0.5"
              />
              <span>
                <span className="font-medium text-stone-900">Résoudre sans masquer le post</span>
                <span className="mt-0.5 block text-stone-600">
                  Le contenu reste actif dans le feed.
                </span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-stone-200 px-3 py-2 text-sm has-[:checked]:border-rose-300 has-[:checked]:bg-rose-50">
              <input
                type="radio"
                name="resolve-mode"
                checked={hidePost}
                onChange={() => setHidePost(true)}
                disabled={isSubmitting}
                className="mt-0.5"
              />
              <span>
                <span className="font-medium text-stone-900">Résoudre et masquer le post</span>
                <span className="mt-0.5 block text-rose-800">
                  Le post ne sera plus actif dans le feed.
                </span>
              </span>
            </label>
          </fieldset>
        ) : null}

        <label className="mt-4 block text-sm">
          <span className="font-medium text-stone-800">{noteLabel}</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            maxLength={REPORT_RESOLUTION_NOTE_MAX_LENGTH}
            className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
            placeholder="Contexte interne pour l'audit…"
            disabled={isSubmitting}
          />
        </label>

        {hidePost && isResolve ? (
          <p className="mt-2 text-xs font-medium text-rose-800">
            Le post ne sera plus actif dans le feed.
          </p>
        ) : null}

        {validationError ? (
          <p className="mt-2 text-sm text-rose-700">{validationError}</p>
        ) : null}
        {apiError ? <p className="mt-2 text-sm text-rose-700">{apiError}</p> : null}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            Annuler
          </button>
          <button type="submit" disabled={isSubmitting} className={confirmClass}>
            {isSubmitting ? "Envoi…" : copy.confirmLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
