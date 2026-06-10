import type { PassportOpsRecommendedAction as PassportOpsRecommendedActionData } from "@yunicity/utils";
import { ArrowRight, Compass } from "lucide-react";
import Link from "next/link";

export function PassportOpsRecommendedAction({
  action,
}: {
  action: PassportOpsRecommendedActionData;
}) {
  return (
    <section className="rounded-2xl border border-yunicity-primary/15 bg-yunicity-primary-soft/30 p-4 shadow-sm sm:p-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-yunicity-primary">
        Prochaine action
      </p>
      <div className="mt-3 flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-yunicity-primary shadow-sm">
          <Compass className="h-6 w-6" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold tracking-tight text-stone-950">{action.title}</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-stone-700">{action.description}</p>
          <Link
            href={action.href}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-yunicity-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:opacity-95"
          >
            {action.ctaLabel}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
