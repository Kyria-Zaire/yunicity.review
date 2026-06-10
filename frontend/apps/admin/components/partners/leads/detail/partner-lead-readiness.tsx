import type { PartnerLeadReadiness } from "@yunicity/utils";

export function PartnerLeadReadinessBar({ readiness }: { readiness: PartnerLeadReadiness }) {
  return (
    <section
      className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5"
      aria-labelledby="partner-lead-readiness-title"
    >
      <h2
        id="partner-lead-readiness-title"
        className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500"
      >
        Prêt pour le réseau
      </h2>
      <div className="mt-3">
        <div className="flex items-end justify-between gap-3">
          <p className="text-sm font-semibold text-stone-900">{readiness.label}</p>
          <p className="text-2xl font-bold tabular-nums text-stone-950">{readiness.percent}%</p>
        </div>
        <div
          className="mt-3 h-2.5 overflow-hidden rounded-full bg-stone-100"
          role="progressbar"
          aria-valuenow={readiness.percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progression réseau : ${readiness.percent} pourcent`}
        >
          <div
            className={`h-full rounded-full transition-all ${
              readiness.percent >= 75
                ? "bg-emerald-500"
                : readiness.percent >= 50
                  ? "bg-yunicity-primary"
                  : readiness.percent > 0
                    ? "bg-amber-400"
                    : "bg-stone-300"
            }`}
            style={{ width: `${readiness.percent}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-stone-500">{readiness.hint}</p>
        <p className="mt-1 text-[11px] text-stone-400">
          Indicateur UX — ne remplace pas la validation métier.
        </p>
      </div>
    </section>
  );
}
