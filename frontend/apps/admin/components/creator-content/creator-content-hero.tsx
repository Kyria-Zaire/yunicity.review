import Link from "next/link";
import { RefreshCw, Users } from "lucide-react";

interface CreatorContentHeroProps {
  isLoading: boolean;
  onRefresh: () => void;
}

export function CreatorContentHero({ isLoading, onRefresh }: CreatorContentHeroProps) {
  return (
    <section className="space-y-3" aria-label="Centre éditorial territorial">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-yunicity-primary">
        Visibilité locale
      </p>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-stone-950 sm:text-3xl">
            Contenus créateurs
          </h1>
          <p className="text-sm leading-relaxed text-stone-600">
            Pilotez les articles, récits et contenus proposés par les partenaires pour faire vivre
            Reims sur Yunicity.
          </p>
          <p className="text-xs text-stone-500">
            La création reste disponible depuis le portail organisation partenaire.
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
            href="/partners"
            className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-800 shadow-sm hover:bg-stone-50"
          >
            <Users className="h-4 w-4" aria-hidden />
            Voir les partenaires
          </Link>
        </div>
      </div>
    </section>
  );
}
