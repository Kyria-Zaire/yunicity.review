import type { PassportOpsMomentum as PassportOpsMomentumData } from "@yunicity/utils";
import { formatAdminMetric } from "@yunicity/utils";
import { TrendingUp } from "lucide-react";

export function PassportOpsMomentum({ momentum }: { momentum: PassportOpsMomentumData }) {
  return (
    <section
      className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5"
      aria-labelledby="passport-ops-momentum-title"
    >
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-yunicity-primary-soft text-yunicity-primary">
          <TrendingUp className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">
            Momentum Passport
          </p>
          <h2
            id="passport-ops-momentum-title"
            className="mt-1 text-base font-bold tracking-tight text-stone-950 sm:text-lg"
          >
            Objectif pilote {momentum.city}
          </h2>
          <p className="mt-1 text-sm text-stone-600">
            {formatAdminMetric(momentum.activeCount)} / {momentum.goal} Passport actifs
          </p>

          <div className="mt-4 flex items-end justify-between gap-2">
            <p className="text-sm text-stone-700">{momentum.microcopy}</p>
            <p className="text-2xl font-bold tabular-nums text-stone-950">
              {momentum.progressPercent}%
            </p>
          </div>

          <div
            className="mt-3 h-2.5 overflow-hidden rounded-full bg-stone-100"
            role="progressbar"
            aria-valuenow={momentum.progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Progression Passport : ${momentum.progressPercent} pourcent`}
          >
            <div
              className="h-full rounded-full bg-yunicity-primary transition-all"
              style={{ width: `${momentum.progressRatio * 100}%` }}
            />
          </div>

          <p className="mt-2 text-[11px] text-stone-400">Indicateur pilote Reims — UX uniquement.</p>
        </div>
      </div>
    </section>
  );
}
