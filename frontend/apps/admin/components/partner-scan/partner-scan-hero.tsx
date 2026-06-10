import Link from "next/link";
import { IdCard, Store } from "lucide-react";

export function PartnerScanHero() {
  return (
    <section className="space-y-3" aria-label="Poste terrain Passport">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-yunicity-primary">
        Terrain Passport
      </p>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-stone-950 sm:text-3xl">
            Scanner Passport
          </h1>
          <p className="text-sm leading-relaxed text-stone-600">
            Validez une interaction Passport en boutique, événement ou point partenaire.
          </p>
          <p className="text-xs text-stone-500">
            Le scan vérifie le Passport avant d&apos;enregistrer le tampon ou l&apos;avantage.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/passport-ops"
            className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-800 shadow-sm hover:bg-stone-50"
          >
            <IdCard className="h-4 w-4" aria-hidden />
            Voir Passport Ops
          </Link>
          <Link
            href="/partners"
            className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-800 shadow-sm hover:bg-stone-50"
          >
            <Store className="h-4 w-4" aria-hidden />
            Voir les partenaires
          </Link>
        </div>
      </div>
    </section>
  );
}
