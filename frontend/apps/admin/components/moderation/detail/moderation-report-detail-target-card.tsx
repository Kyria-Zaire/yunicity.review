import { ModerationReportDetailField } from "@/components/moderation/detail/moderation-report-detail-field";
import type { AdminReportDetailResponse } from "@yunicity/types";
import {
  adminReportAuthorLabel,
  formatReportDate,
  isAdminReportTargetUnavailable,
  targetTypeLabel,
} from "@yunicity/utils";

export function ModerationReportDetailTargetCard({
  report,
}: {
  report: AdminReportDetailResponse;
}) {
  const post = report.target_post;
  const isUnavailable = isAdminReportTargetUnavailable(post);

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
        Contenu signalé
      </h2>
      {isUnavailable ? (
        <div className="mt-4 rounded-xl border border-dashed border-amber-200 bg-amber-50/60 px-4 py-6 text-center">
          <p className="text-sm font-medium text-amber-950">Contenu indisponible</p>
          <p className="mt-1 text-xs text-amber-900/80">
            La publication a peut-être été supprimée ou désactivée. Les métadonnées du signalement
            restent consultables ci-dessous.
          </p>
        </div>
      ) : null}
      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        <ModerationReportDetailField
          label="Type de cible"
          value={targetTypeLabel(report.target_type)}
        />
        <ModerationReportDetailField label="ID cible" value={report.target_id} mono />
        <ModerationReportDetailField
          label="Titre"
          value={post.title?.trim() || "—"}
        />
        <ModerationReportDetailField
          label="Publication active"
          value={post.is_active ? "Oui" : "Non"}
        />
        <ModerationReportDetailField
          label="Auteur"
          value={adminReportAuthorLabel(post.author_type, post.author_id)}
        />
        <ModerationReportDetailField label="Ville" value={post.city?.trim() || "—"} />
        <ModerationReportDetailField
          label="Créé le (publication)"
          value="—"
        />
      </dl>
      <div className="mt-4">
        <p className="text-xs font-medium text-stone-500">Extrait du contenu</p>
        <p className="mt-2 whitespace-pre-wrap rounded-lg border border-stone-100 bg-stone-50 px-4 py-3 text-sm text-stone-800">
          {post.body_excerpt?.trim() || "—"}
        </p>
      </div>
      <p className="mt-3 text-[10px] text-stone-400">
        Signalement enregistré {formatReportDate(report.created_at)}
      </p>
    </section>
  );
}
