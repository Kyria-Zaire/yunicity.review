import Link from "next/link";
import { FileText, RefreshCw } from "lucide-react";

interface ModerationHeroProps {
  isLoading: boolean;
  onRefresh: () => void;
}

export function ModerationHero({ isLoading, onRefresh }: ModerationHeroProps) {
  return (
    <section className="space-y-3" aria-label="Centre confiance et sécurité">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-yunicity-primary">
        Confiance &amp; sécurité
      </p>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-stone-950 sm:text-3xl">
            Modération
          </h1>
          <p className="text-sm leading-relaxed text-stone-600">
            Surveillez les signalements citoyens et protégez la qualité des échanges sur Yunicity.
          </p>
          <p className="text-xs text-stone-500">
            Les décisions (classer, résoudre) se prennent depuis la fiche de chaque signalement.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => void onRefresh()}
            className="inline-flex items-center gap-2 rounded-xl bg-yunicity-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:opacity-95 disabled:opacity-60"
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
            {isLoading ? "Actualisation…" : "Actualiser"}
          </button>
          <Link
            href="/creator-content"
            className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-800 shadow-sm hover:bg-stone-50"
          >
            <FileText className="h-4 w-4" aria-hidden />
            Voir les contenus créateurs
          </Link>
        </div>
      </div>
    </section>
  );
}
