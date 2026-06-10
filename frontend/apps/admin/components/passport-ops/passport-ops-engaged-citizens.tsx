import type { PassportOpsEngagedCitizen } from "@yunicity/utils";
import Link from "next/link";

export function PassportOpsEngagedCitizens({ citizens }: { citizens: PassportOpsEngagedCitizen[] }) {
  return (
    <section
      className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5"
      aria-labelledby="passport-ops-engaged-title"
    >
      <h2
        id="passport-ops-engaged-title"
        className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500"
      >
        Citoyens engagés
      </h2>
      <p className="mt-1 text-xs text-stone-500">Top 5 de la page courante.</p>

      {citizens.length === 0 ? (
        <p className="mt-4 text-sm text-stone-600">Aucun citoyen engagé pour le moment.</p>
      ) : (
        <ul className="mt-4 divide-y divide-stone-100">
          {citizens.map((citizen) => (
            <li key={citizen.id} className="flex items-center justify-between gap-3 py-3 first:pt-0">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-stone-900">{citizen.name}</p>
                <p className="text-xs text-stone-500">{citizen.tierLabel}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3 text-xs tabular-nums text-stone-600">
                <span>{citizen.stampsCount} tampons</span>
                <span>{citizen.redemptionsCount} réd.</span>
                <Link
                  href={citizen.detailHref}
                  className="rounded-lg border border-stone-200 px-2.5 py-1 font-medium text-stone-800 hover:bg-stone-50"
                >
                  Ouvrir
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
