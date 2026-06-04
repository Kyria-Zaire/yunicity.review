"use client";

import type { AdminOfferStatus } from "@yunicity/types";
import {
  canApproveOffer,
  canArchiveOffer,
  canRejectOffer,
} from "@yunicity/utils";
import { useState } from "react";

interface OfferDetailModerationSectionProps {
  status: AdminOfferStatus;
  rejectionReason: string | null;
  isSubmitting: boolean;
  actionError: string | null;
  onApprove: () => Promise<boolean>;
  onReject: (reason: string) => Promise<boolean>;
  onArchive: () => Promise<boolean>;
}

export function OfferDetailModerationSection({
  status,
  rejectionReason,
  isSubmitting,
  actionError,
  onApprove,
  onReject,
  onArchive,
}: OfferDetailModerationSectionProps) {
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const hasAnyAction =
    canApproveOffer(status) || canRejectOffer(status) || canArchiveOffer(status);

  async function handleRejectConfirm() {
    const ok = await onReject(rejectReason);
    if (ok) {
      setShowReject(false);
      setRejectReason("");
    }
  }

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
        Cycle de vie / Modération
      </h2>
      <p className="mt-2 text-xs text-stone-500">
        Actions staff existantes — transitions alignées sur le workflow backend.
      </p>

      {rejectionReason ? (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          Dernier refus : {rejectionReason}
        </p>
      ) : null}

      {actionError ? (
        <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {actionError}
        </p>
      ) : null}

      {!hasAnyAction ? (
        <p className="mt-4 text-sm text-stone-600">
          Aucune action de modération disponible pour le statut actuel.
        </p>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          {canApproveOffer(status) ? (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => void onApprove()}
              className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
            >
              Approuver (publier)
            </button>
          ) : null}
          {canRejectOffer(status) ? (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setShowReject((value) => !value)}
              className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-900 disabled:opacity-50"
            >
              Refuser
            </button>
          ) : null}
          {canArchiveOffer(status) ? (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => void onArchive()}
              className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50 disabled:opacity-50"
            >
              Archiver
            </button>
          ) : null}
        </div>
      )}

      {showReject && canRejectOffer(status) ? (
        <div className="mt-4 space-y-2">
          <textarea
            value={rejectReason}
            onChange={(event) => setRejectReason(event.target.value)}
            placeholder="Motif du refus (visible partenaire)…"
            rows={3}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
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
