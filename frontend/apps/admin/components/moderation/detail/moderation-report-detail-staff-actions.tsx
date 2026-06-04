"use client";

import { ModerationReportResolutionDialog } from "@/components/moderation/detail/moderation-report-resolution-dialog";
import { ModerationReportDetailField } from "@/components/moderation/detail/moderation-report-detail-field";
import {
  ModerationReportStatusBadge,
} from "@/components/moderation/detail/moderation-report-badges";
import type {
  AdminReportDetailResponse,
  AdminReportDismissPayload,
  AdminReportResolvePayload,
} from "@yunicity/types";
import {
  canDismissReport,
  canResolveReport,
  formatReportDate,
  reportResolutionStatusLabel,
  reportStatusLabel,
  type ReportResolutionActionKey,
} from "@yunicity/utils";
import { useCallback, useState } from "react";

type ModerationReportDetailStaffActionsProps = {
  report: AdminReportDetailResponse;
  isSubmitting: boolean;
  actionError: string | null;
  onDismiss: (payload: AdminReportDismissPayload) => Promise<boolean>;
  onResolve: (payload: AdminReportResolvePayload) => Promise<boolean>;
  onClearActionError: () => void;
};

export function ModerationReportDetailStaffActions({
  report,
  isSubmitting,
  actionError,
  onDismiss,
  onResolve,
  onClearActionError,
}: ModerationReportDetailStaffActionsProps) {
  const [openAction, setOpenAction] = useState<ReportResolutionActionKey | null>(null);

  const closeModal = useCallback(() => {
    if (isSubmitting) {
      return;
    }
    setOpenAction(null);
    onClearActionError();
  }, [isSubmitting, onClearActionError]);

  const handleDismissConfirm = useCallback(
    async (reason: string | null) => {
      const ok = await onDismiss(reason ? { reason } : {});
      if (ok) {
        setOpenAction(null);
      }
    },
    [onDismiss],
  );

  const handleResolveConfirm = useCallback(
    async (payload: { reason: string | null; hide_post: boolean }) => {
      const ok = await onResolve({
        hide_post: payload.hide_post,
        ...(payload.reason ? { reason: payload.reason } : {}),
      });
      if (ok) {
        setOpenAction(null);
      }
    },
    [onResolve],
  );

  const showActions = canDismissReport(report.status) && canResolveReport(report.status);
  const resolverLabel =
    report.resolver?.display_name?.trim() || report.resolver?.email || "—";

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
        Actions staff
      </h2>

      {showActions ? (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-stone-600">
            Clôturez ce signalement en attente. Les actions sont irréversibles sur cette fiche.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={() => {
                onClearActionError();
                setOpenAction("dismiss");
              }}
              disabled={isSubmitting}
              className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50 disabled:opacity-60"
            >
              Classer sans suite
            </button>
            <button
              type="button"
              onClick={() => {
                onClearActionError();
                setOpenAction("resolve");
              }}
              disabled={isSubmitting}
              className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-60"
            >
              Résoudre
            </button>
            <button
              type="button"
              onClick={() => {
                onClearActionError();
                setOpenAction("resolve_hide");
              }}
              disabled={isSubmitting}
              className="rounded-lg bg-rose-700 px-4 py-2 text-sm font-medium text-white hover:bg-rose-800 disabled:opacity-60"
            >
              Résoudre + masquer le post
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <p className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700">
            Ce signalement est déjà clôturé.
          </p>
          <dl className="grid gap-3 text-sm">
            <div>
              <dt className="text-xs font-medium text-stone-500">Statut final</dt>
              <dd className="mt-1">
                <ModerationReportStatusBadge status={report.status} />
                <span className="sr-only">{reportResolutionStatusLabel(report.status)}</span>
                <span className="ml-2 text-stone-600">{reportStatusLabel(report.status)}</span>
              </dd>
            </div>
            <ModerationReportDetailField
              label="Clôturé le"
              value={formatReportDate(report.resolved_at)}
            />
            <ModerationReportDetailField label="Traité par" value={resolverLabel} />
            <ModerationReportDetailField
              label="Note de résolution"
              value={report.resolution_note?.trim() || "—"}
            />
          </dl>
        </div>
      )}

      {openAction ? (
        <ModerationReportResolutionDialog
          action={openAction}
          isOpen
          isSubmitting={isSubmitting}
          apiError={actionError}
          initialHidePost={openAction === "resolve_hide"}
          onClose={closeModal}
          onConfirmDismiss={handleDismissConfirm}
          onConfirmResolve={handleResolveConfirm}
        />
      ) : null}
    </section>
  );
}
