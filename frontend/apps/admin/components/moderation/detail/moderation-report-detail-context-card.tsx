import type { AdminReportDetailResponse } from "@yunicity/types";
import { buildPublicPostUrl, shortReportId } from "@yunicity/utils";

function DisabledLink({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="rounded-lg border border-dashed border-stone-200 bg-stone-50 px-4 py-3 opacity-80">
      <p className="text-sm font-medium text-stone-600">{title}</p>
      <p className="mt-1 text-xs text-stone-500">{hint}</p>
    </div>
  );
}

export function ModerationReportDetailContextCard({
  report,
}: {
  report: AdminReportDetailResponse;
}) {
  const webBase = process.env.NEXT_PUBLIC_WEB_APP_URL;
  const publicPostUrl = buildPublicPostUrl(report.target_post.id, webBase);

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Contexte</h2>
      <dl className="mt-4 space-y-2 text-sm text-stone-700">
        <div>
          <dt className="text-xs font-medium text-stone-500">Source</dt>
          <dd className="mt-0.5">Publication (post)</dd>
        </div>
      </dl>
      <p className="mt-4 rounded-lg border border-amber-100 bg-amber-50/50 px-4 py-3 text-sm text-amber-950">
        Les actions de résolution seront disponibles en{" "}
        <span className="font-medium">ADMIN-07D</span>.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {publicPostUrl ? (
          <a
            href={publicPostUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm font-medium text-stone-800 shadow-sm hover:bg-stone-50"
          >
            Voir la publication (web)
          </a>
        ) : (
          <DisabledLink
            title="Publication publique (web)"
            hint="Pas de route dédiée post en V1 — consultez le feed citoyen ou la cible via les modules métier."
          />
        )}
        <DisabledLink
          title="Fiche auteur (admin)"
          hint={`Route staff utilisateur à venir — auteur ${shortReportId(report.target_post.author_id)}`}
        />
      </div>
    </section>
  );
}
