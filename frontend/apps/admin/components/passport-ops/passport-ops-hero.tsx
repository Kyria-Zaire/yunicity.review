import Link from "next/link";
import { ScanLine, Users } from "lucide-react";

export function PassportOpsHero() {
  return (
    <header className="space-y-4">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-yunicity-primary">
          Programme Passport
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-stone-950 sm:text-3xl">
          Passport Command Center
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600">
          Animez le programme Passport Yunicity, accompagnez l&apos;engagement citoyen et détectez
          les prochaines opportunités terrain.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link
          href="/partner-scan"
          className="inline-flex items-center gap-2 rounded-xl bg-yunicity-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:opacity-95"
        >
          <ScanLine className="h-4 w-4" aria-hidden />
          Scanner un Passport
        </Link>
        <Link
          href="/partners"
          className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-800 shadow-sm hover:bg-stone-50"
        >
          <Users className="h-4 w-4" aria-hidden />
          Voir les partenaires
        </Link>
      </div>
    </header>
  );
}
