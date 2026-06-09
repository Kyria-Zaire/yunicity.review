import Link from "next/link";
import { Plus, Upload } from "lucide-react";

export function PartnersTerrainHeader({
  city,
  partnersTotal,
}: {
  city: string;
  partnersTotal: number;
}) {
  const exportDisabled = partnersTotal === 0;

  return (
    <header className="space-y-4 border-b border-stone-200 pb-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-yunicity-primary">
            Réseau Yunicity
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-stone-950 sm:text-3xl">
            Réseau partenaires
          </h1>
          <p className="mt-2 text-sm font-medium text-stone-800 sm:text-base">
            Développez le tissu local de {city}.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-stone-600">
            Commerces, associations, lieux et organisations : pilotez ici les acteurs qui font
            vivre le territoire.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 sm:shrink-0">
          {exportDisabled ? (
            <span
              title="Disponible dès qu'un partenaire est enregistré."
              className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm font-medium text-stone-400"
              aria-disabled="true"
            >
              <Upload className="h-4 w-4" aria-hidden />
              Exporter
            </span>
          ) : (
            <Link
              href="/partner-leads"
              className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-800 shadow-sm hover:bg-stone-50"
            >
              <Upload className="h-4 w-4" aria-hidden />
              Exporter
            </Link>
          )}
          <Link
            href="/partner-leads"
            className="inline-flex items-center gap-2 rounded-xl bg-yunicity-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:opacity-95"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Ajouter un partenaire
          </Link>
        </div>
      </div>
    </header>
  );
}
