import { ModerationReportDetailField } from "@/components/moderation/detail/moderation-report-detail-field";
import {
  ModerationReportReasonBadge,
  ModerationReportStatusBadge,
} from "@/components/moderation/detail/moderation-report-badges";
import type { AdminReportDetailResponse } from "@yunicity/types";
import {
  adminReportReporterLabel,
  formatReportDate,
  reportReasonLabel,
  reportStatusLabel,
} from "@yunicity/utils";

export function ModerationReportDetailSummaryCard({
  report,
}: {
  report: AdminReportDetailResponse;
}) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
        Synthèse du signalement
      </h2>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        <ModerationReportDetailField label="Identifiant" value={report.id} mono />
        <div>
          <dt className="text-xs font-medium text-stone-500">Motif</dt>
          <dd className="mt-1">
            <ModerationReportReasonBadge reason={report.reason} />
            <span className="sr-only">{reportReasonLabel(report.reason)}</span>
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-stone-500">Statut</dt>
          <dd className="mt-1">
            <ModerationReportStatusBadge status={report.status} />
            <span className="sr-only">{reportStatusLabel(report.status)}</span>
          </dd>
        </div>
        <ModerationReportDetailField
          label="Signalé le"
          value={formatReportDate(report.created_at)}
        />
        <ModerationReportDetailField
          label="Résolu le"
          value={formatReportDate(report.resolved_at)}
        />
        {report.resolver ? (
          <ModerationReportDetailField
            label="Traité par"
            value={
              report.resolver.display_name?.trim() || report.resolver.email
            }
          />
        ) : null}
        {report.resolution_note?.trim() ? (
          <ModerationReportDetailField
            label="Note de résolution"
            value={report.resolution_note.trim()}
          />
        ) : null}
        <ModerationReportDetailField
          label="Mis à jour"
          value="—"
        />
        <ModerationReportDetailField
          label="Signaleur (aperçu)"
          value={adminReportReporterLabel(report.reporter)}
        />
      </dl>
    </section>
  );
}
