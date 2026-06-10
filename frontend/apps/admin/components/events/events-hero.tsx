import Link from "next/link";
import { Users } from "lucide-react";

export function EventsHero() {
  return (
    <section className="space-y-3" aria-label="Agenda territorial">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-yunicity-primary">
        Agenda territorial
      </p>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-stone-950 sm:text-3xl">
            Événements
          </h1>
          <p className="text-sm leading-relaxed text-stone-600">
            Pilotez les sorties, rendez-vous et temps forts qui animent Reims sur Yunicity.
          </p>
          <p className="text-xs text-stone-500">
            La création partenaire reste disponible depuis le portail organisation.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
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
