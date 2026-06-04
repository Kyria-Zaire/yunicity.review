"use client";

import { ModerationReportDetailContextCard } from "@/components/moderation/detail/moderation-report-detail-context-card";
import { ModerationReportDetailHeader } from "@/components/moderation/detail/moderation-report-detail-header";
import { ModerationReportDetailReporterCard } from "@/components/moderation/detail/moderation-report-detail-reporter-card";
import { ModerationReportDetailRiskCard } from "@/components/moderation/detail/moderation-report-detail-risk-card";
import { ModerationReportDetailStaffActions } from "@/components/moderation/detail/moderation-report-detail-staff-actions";
import { ModerationReportDetailSummaryCard } from "@/components/moderation/detail/moderation-report-detail-summary-card";
import { ModerationReportDetailTargetCard } from "@/components/moderation/detail/moderation-report-detail-target-card";
import { useAdminReportDetail } from "@/lib/hooks/use-admin-report-detail";
import { buildModerationListBackPath } from "@yunicity/utils";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

interface ModerationReportDetailViewProps {
  reportId: string;
}

export function ModerationReportDetailView({ reportId }: ModerationReportDetailViewProps) {
  const searchParams = useSearchParams();
  const backHref = buildModerationListBackPath(searchParams);
  const {
    report,
    isLoading,
    isRefreshing,
    error,
    isNotFound,
    isSubmitting,
    actionError,
    successMessage,
    reload,
    clearActionFeedback,
    clearActionError,
    dismissReport,
    resolveReport,
  } = useAdminReportDetail(reportId);

  useEffect(() => {
    if (!successMessage) {
      return;
    }
    const timer = window.setTimeout(() => {
      clearActionFeedback();
    }, 6000);
    return () => window.clearTimeout(timer);
  }, [successMessage, clearActionFeedback]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl py-8">
        <p className="text-sm text-stone-500">Chargement du signalement…</p>
      </div>
    );
  }

  if (isNotFound) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 py-8">
        <Link
          href={backHref}
          className="text-sm font-medium text-stone-600 underline-offset-2 hover:underline"
        >
          ← Retour aux signalements
        </Link>
        <div className="rounded-2xl border border-stone-200 bg-white px-6 py-12 text-center shadow-sm">
          <p className="text-lg font-medium text-stone-900">Signalement introuvable</p>
          <p className="mt-2 text-sm text-stone-500">
            Ce signalement n&apos;existe pas ou n&apos;est plus accessible.
          </p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 py-8">
        <Link
          href={backHref}
          className="text-sm font-medium text-stone-600 underline-offset-2 hover:underline"
        >
          ← Retour aux signalements
        </Link>
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error ?? "Erreur inconnue."}
          <button
            type="button"
            onClick={() => void reload()}
            className="ml-3 font-medium underline"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      <ModerationReportDetailHeader
        report={report}
        backHref={backHref}
        isRefreshing={isRefreshing}
        onRefresh={() => void reload()}
      />
      {successMessage ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {successMessage}
        </div>
      ) : null}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <ModerationReportDetailSummaryCard report={report} />
          <ModerationReportDetailReporterCard report={report} />
          <ModerationReportDetailRiskCard report={report} />
        </div>
        <div className="space-y-6">
          <ModerationReportDetailTargetCard report={report} />
          <ModerationReportDetailContextCard report={report} />
          <ModerationReportDetailStaffActions
            report={report}
            isSubmitting={isSubmitting}
            actionError={actionError}
            onDismiss={dismissReport}
            onResolve={resolveReport}
            onClearActionError={clearActionError}
          />
        </div>
      </div>
    </div>
  );
}
