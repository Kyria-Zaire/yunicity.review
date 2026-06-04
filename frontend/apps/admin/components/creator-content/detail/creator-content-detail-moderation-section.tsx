"use client";

import type { PartnerCreatorContentAdmin } from "@yunicity/types";
import {
  canApproveCreatorContent,
  canArchiveCreatorContent,
  canRejectCreatorContent,
} from "@yunicity/utils";
import { useState } from "react";

interface CreatorContentDetailModerationSectionProps {
  content: PartnerCreatorContentAdmin;
  isSubmitting: boolean;
  actionError: string | null;
  onApprove: () => Promise<boolean>;
  onReject: (reason: string) => Promise<boolean>;
  onArchive: () => Promise<boolean>;
  onClearActionError?: () => void;
}

export function CreatorContentDetailModerationSection({
  content,
  isSubmitting,
  actionError,
  onApprove,
  onReject,
  onArchive,
  onClearActionError,
}: CreatorContentDetailModerationSectionProps) {
  const [rejectPanelOpen, setRejectPanelOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const showApprove = canApproveCreatorContent(content.status);
  const showRejectAction = canRejectCreatorContent(content.status);
  const showArchive = canArchiveCreatorContent(content.status);
  const hasAnyAction = showApprove || showRejectAction || showArchive;

  async function handleRejectConfirm() {
    const ok = await onReject(rejectReason.trim());
    if (ok) {
      setRejectPanelOpen(false);
      setRejectReason("");
    }
  }

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Modération</h2>
      <p className="mt-2 text-xs text-stone-500">
        Actions staff existantes — aucune mutation métier nouvelle.
      </p>

      {content.rejection_reason ? (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          Dernier refus : {content.rejection_reason}
        </p>
      ) : null}

      {actionError && !rejectPanelOpen ? (
        <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {actionError}
        </p>
      ) : null}

      {hasAnyAction ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {showApprove ? (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                onClearActionError?.();
                void onApprove();
              }}
              className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
            >
              Approuver
            </button>
          ) : null}
          {showRejectAction ? (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                onClearActionError?.();
                setRejectPanelOpen((open) => !open);
              }}
              className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-900"
            >
              Rejeter
            </button>
          ) : null}
          {showArchive ? (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                onClearActionError?.();
                void onArchive();
              }}
              className="rounded-lg border border-stone-300 bg-stone-100 px-4 py-2 text-sm font-medium text-stone-800 hover:bg-stone-200 disabled:opacity-50"
            >
              Archiver
            </button>
          ) : null}
        </div>
      ) : (
        <p className="mt-4 text-sm text-stone-500">
          Aucune action de modération disponible pour ce statut.
        </p>
      )}

      {rejectPanelOpen ? (
        <div className="mt-4 space-y-2">
          <textarea
            value={rejectReason}
            onChange={(event) => setRejectReason(event.target.value)}
            placeholder="Motif du refus (obligatoire, visible partenaire)…"
            rows={3}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
          {actionError ? (
            <p className="text-sm text-rose-800">{actionError}</p>
          ) : null}
          <button
            type="button"
            disabled={isSubmitting || !rejectReason.trim()}
            onClick={() => void handleRejectConfirm()}
            className="rounded-lg bg-rose-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Confirmer le refus
          </button>
        </div>
      ) : null}
    </section>
  );
}
