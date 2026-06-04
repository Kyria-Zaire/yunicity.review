import type { AdminReportDetailResponse } from "@yunicity/types";
import { adminReportSafetyGuidance, reportReasonLabel } from "@yunicity/utils";

export function ModerationReportDetailRiskCard({
  report,
}: {
  report: AdminReportDetailResponse;
}) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
        Notes risque &amp; sécurité
      </h2>
      <p className="mt-3 text-sm text-stone-700">
        Motif signalé :{" "}
        <span className="font-medium text-stone-900">{reportReasonLabel(report.reason)}</span>
      </p>
      <p className="mt-3 rounded-lg border border-stone-100 bg-stone-50 px-4 py-3 text-sm leading-relaxed text-stone-800">
        {adminReportSafetyGuidance(report.reason)}
      </p>
      <p className="mt-3 text-xs text-stone-500">
        Aucun score automatique ni recommandation de sanction — décision humaine requise.
      </p>
    </section>
  );
}
