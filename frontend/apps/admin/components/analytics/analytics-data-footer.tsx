import { BarChart3, ExternalLink } from "lucide-react";

export function AnalyticsDataFooter() {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-violet-100 bg-violet-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white">
          <BarChart3 className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-violet-900">À propos des données</h2>
          <p className="mt-1 max-w-2xl text-sm text-violet-800/90">
            Les données sont calculées à partir des agrégats Yunicity disponibles. Aucun indicateur
            fictif n&apos;est affiché.
          </p>
        </div>
      </div>
      <button
        type="button"
        disabled
        title="Guide Analytics non publié"
        className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-violet-200 bg-white px-3 py-2 text-sm font-medium text-violet-700 opacity-60"
      >
        Voir le guide Analytics
        <ExternalLink className="h-4 w-4" aria-hidden />
      </button>
    </section>
  );
}
