import { RefreshCw } from "lucide-react";

interface StaffHeroProps {
  isLoading: boolean;
  onRefresh: () => void;
}

export function StaffHero({ isLoading, onRefresh }: StaffHeroProps) {
  return (
    <section className="space-y-3" aria-label="Centre staff et accès plateforme">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-yunicity-primary">
        Accès plateforme
      </p>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-stone-950 sm:text-3xl">
            Staff
          </h1>
          <p className="text-sm leading-relaxed text-stone-600">
            Pilotez les accès opérationnels, les rôles RBAC et la sécurité de l&apos;équipe
            Yunicity.
          </p>
          <p className="text-xs text-stone-500">
            Les actions sensibles se réalisent depuis la fiche de chaque membre.
          </p>
        </div>
        <button
          type="button"
          disabled={isLoading}
          onClick={() => void onRefresh()}
          className="inline-flex items-center gap-2 rounded-xl bg-yunicity-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:opacity-95 disabled:opacity-60"
        >
          <RefreshCw className="h-4 w-4" aria-hidden />
          {isLoading ? "Actualisation…" : "Actualiser"}
        </button>
      </div>
    </section>
  );
}
