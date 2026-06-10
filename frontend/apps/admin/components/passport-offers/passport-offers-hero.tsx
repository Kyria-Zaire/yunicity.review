import Link from "next/link";
import { Plus, Users } from "lucide-react";

export function PassportOffersHero() {
  return (
    <section className="space-y-3" aria-label="Catalogue Passport">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-yunicity-primary">
        Catalogue Passport
      </p>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-stone-950 sm:text-3xl">
            Offres Passport
          </h1>
          <p className="text-sm leading-relaxed text-stone-600">
            Pilotez les avantages proposés par les partenaires Yunicity à Reims.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/passport-offers/new"
            className="inline-flex items-center gap-2 rounded-xl bg-yunicity-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:opacity-95"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Créer une offre
          </Link>
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
