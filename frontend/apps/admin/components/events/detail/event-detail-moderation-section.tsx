"use client";

import { EventCancelDialog } from "@/components/events/event-cancel-dialog";
import { EventDetailCard } from "@/components/events/detail/event-detail-card";
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
  const needsAttention = showApprove;

  return (
    <EventDetailCard
      title="Modération staff"
      subtitle="Approbation, refus et annulation — actions branchées sur l'API"
      className={needsAttention ? "border-amber-200 bg-amber-50/30" : undefined}
    >
      {event.rejection_reason ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          Dernier refus : {event.rejection_reason}
        </p>
      ) : null}

      {isCancelled ? (
        <p className="mt-3 rounded-lg border border-yunicity-border bg-yunicity-surface px-3 py-2 text-sm text-yunicity-ink-muted">
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
              onClick={() => {
                onClearActionError?.();
                void onApprove();
              }}
              className="rounded-lg bg-yunicity-primary px-4 py-2 text-sm font-medium text-white hover:bg-yunicity-primary-hover disabled:opacity-50"
            >
              Approuver et publier
            </button>
          ) : null}
          {showReject ? (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                onClearActionError?.();
                setRejectOpen(true);
              }}
              className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-900 hover:bg-rose-100 disabled:opacity-50"
            >
              Refuser
            </button>
          ) : null}
        </div>
      ) : !isCancelled ? (
        <p className="mt-2 text-sm text-yunicity-ink-muted">
          Aucune action de modération disponible pour le statut actuel.
        </p>
      ) : null}

      {showCancel ? (
        <div className="mt-4 border-t border-yunicity-border pt-4">
          <p className="text-xs text-yunicity-ink-muted">
            Annulation irréversible côté public (erreur 410, retrait feed et carte).
          </p>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => {
              onClearActionError?.();
              setCancelOpen(true);
            }}
            className="mt-3 rounded-lg bg-yunicity-danger px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
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
    </EventDetailCard>
  );
}
