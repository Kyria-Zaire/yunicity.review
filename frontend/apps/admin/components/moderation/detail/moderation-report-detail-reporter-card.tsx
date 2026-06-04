import { ModerationReportDetailField } from "@/components/moderation/detail/moderation-report-detail-field";
import type { AdminReportDetailResponse } from "@yunicity/types";
import { shortReportId } from "@yunicity/utils";

export function ModerationReportDetailReporterCard({
  report,
}: {
  report: AdminReportDetailResponse;
}) {
  const { reporter } = report;

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
        Signaleur
      </h2>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        <ModerationReportDetailField label="ID utilisateur" value={reporter.id} mono />
        <ModerationReportDetailField
          label="Nom affiché"
          value={reporter.display_name?.trim() || "—"}
        />
        <ModerationReportDetailField label="E-mail" value={reporter.email} />
        <ModerationReportDetailField label="Ville" value="—" />
      </dl>
      <div className="mt-4 rounded-lg border border-dashed border-stone-200 bg-stone-50 px-4 py-3">
        <p className="text-sm font-medium text-stone-700">Fiche utilisateur staff</p>
        <p className="mt-1 text-xs text-stone-500">
          Route admin utilisateur non disponible — réf. {shortReportId(reporter.id)}
        </p>
      </div>
    </section>
  );
}
