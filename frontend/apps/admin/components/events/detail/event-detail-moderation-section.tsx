"use client";

import { EventCancelDialog } from "@/components/events/event-cancel-dialog";
import { EventRejectDialog } from "@/components/events/event-reject-dialog";
import type { AdminLocalEventDetail } from "@yunicity/types";
import {
  canAdminApproveEvent,
  canAdminRejectEvent,
  canCancelEvent,
  eventModerationBlockedWhenCancelledCopy,
} from "@yunicity/utils";
import { useState } from "react";

interface EventDetailModerationSectionProps {
  event: AdminLocalEventDetail;
  isSubmitting: boolean;
  actionError: string | null;
  onApprove: () => Promise<boolean>;
  onReject: (reason: string) => Promise<boolean>;
  onCancel: (reason: string) => Promise<boolean>;
  onClearActionError?: () => void;
}

export function EventDetailModerationSection({
  event,
  isSubmitting,
  actionError,
  onApprove,
  onReject,
  onCancel,
  onClearActionError,
}: EventDetailModerationSectionProps) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const isCancelled = event.is_cancelled;
  const showApprove = canAdminApproveEvent(event.moderation_status, isCancelled);
  const showReject = canAdminRejectEvent(event.moderation_status, isCancelled);
  const showCancel = canCancelEvent(event);
  const hasModerationAction = showApprove || showReject;

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Modération</h2>
      <p className="mt-2 text-xs text-stone-500">
        Actions staff — approbation, refus et annulation (événements approuvés).
      </p>

      {event.rejection_reason ? (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          Dernier refus : {event.rejection_reason}
        </p>
      ) : null}

      {isCancelled ? (
        <p className="mt-3 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700">
          {eventModerationBlockedWhenCancelledCopy}
        </p>
      ) : null}

      {actionError && !cancelOpen ? (
        <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {actionError}
        </p>
      ) : null}

      {hasModerationAction ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {showApprove ? (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => void onApprove()}
              className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
            >
              Approuver
            </button>
          ) : null}
          {showReject ? (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setRejectOpen(true)}
              className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-900 disabled:opacity-50"
            >
              Refuser
            </button>
          ) : null}
        </div>
      ) : !isCancelled ? (
        <p className="mt-4 text-sm text-stone-600">
          Aucune action de modération disponible pour le statut actuel.
        </p>
      ) : null}

      {showCancel ? (
        <div className="mt-4 border-t border-stone-100 pt-4">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => {
              onClearActionError?.();
              setCancelOpen(true);
            }}
            className="rounded-lg bg-rose-700 px-4 py-2 text-sm font-medium text-white hover:bg-rose-800 disabled:opacity-50"
          >
            Annuler l&apos;événement
          </button>
        </div>
      ) : null}

      <EventRejectDialog
        eventTitle={event.title}
        isOpen={rejectOpen}
        isSubmitting={isSubmitting}
        onClose={() => setRejectOpen(false)}
        onConfirm={(reason) => {
          void onReject(reason).then((ok) => {
            if (ok) {
              setRejectOpen(false);
            }
          });
        }}
      />

      <EventCancelDialog
        eventTitle={event.title}
        isOpen={cancelOpen}
        isSubmitting={isSubmitting}
        apiError={cancelOpen ? actionError : null}
        onClose={() => setCancelOpen(false)}
        onConfirm={(reason) => {
          void onCancel(reason).then((ok) => {
            if (ok) {
              setCancelOpen(false);
            }
          });
        }}
      />
    </section>
  );
}
