import type { ModerationTrustSafetyMomentum } from "@yunicity/utils";
import { formatAdminMetric } from "@yunicity/utils";

export function ModerationMomentum({ momentum }: { momentum: ModerationTrustSafetyMomentum }) {
  return (
    <section
      className="rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm"
      aria-labelledby="moderation-momentum-title"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0 shrink-0 sm:w-56">
          <h2
            id="moderation-momentum-title"
            className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500"
          >
            Momentum modération
          </h2>
          <p className="mt-0.5 text-sm font-medium text-stone-800">
            {formatAdminMetric(momentum.pendingCount)} / {momentum.threshold} seuil d&apos;attention
          </p>
        </div>

        <div className="min-w-0 flex-1">
          <div
            className="h-2 overflow-hidden rounded-full bg-stone-100"
            role="progressbar"
            aria-valuenow={momentum.progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`File en attente : ${momentum.progressPercent} pourcent du seuil`}
          >
            <div
              className={`h-full rounded-full transition-all ${
                momentum.pendingCount >= momentum.threshold
                  ? "bg-rose-500"
                  : momentum.pendingCount >= 3
                    ? "bg-amber-500"
                    : "bg-yunicity-primary"
              }`}
              style={{ width: `${momentum.progressRatio * 100}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-stone-600">{momentum.microcopy}</p>
        </div>

        <p className="shrink-0 text-xl font-bold tabular-nums text-stone-950 sm:w-14 sm:text-right">
          {momentum.progressPercent}%
        </p>
      </div>

      <p className="mt-2 text-[11px] text-stone-400">
        Indicateur Trust &amp; Safety — UX uniquement.
      </p>
    </section>
  );
}
