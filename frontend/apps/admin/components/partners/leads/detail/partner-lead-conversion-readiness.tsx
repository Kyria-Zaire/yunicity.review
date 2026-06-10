import type { PartnerLeadConversionReadiness } from "@yunicity/utils";
import { Check, Circle } from "lucide-react";

type PartnerLeadConversionReadinessPanelProps = {
  readiness: PartnerLeadConversionReadiness;
};

export function PartnerLeadConversionReadinessPanel({
  readiness,
}: PartnerLeadConversionReadinessPanelProps) {
  return (
    <section
      className="rounded-2xl border border-yunicity-primary/20 bg-gradient-to-br from-yunicity-primary-soft/40 to-white p-4 shadow-sm sm:p-5"
      aria-labelledby="partner-lead-conversion-readiness-title"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-yunicity-primary">
        Intégration réseau
      </p>
      <h2
        id="partner-lead-conversion-readiness-title"
        className="mt-2 text-xl font-bold tracking-tight text-stone-950"
      >
        {readiness.title}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-stone-700">{readiness.microcopy}</p>

      {readiness.showChecklist ? (
        <ul className="mt-4 space-y-2.5" aria-label="Étapes d'intégration">
          {readiness.steps.map((step) => (
            <li key={step.id} className="flex items-center gap-3 text-sm">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                  step.reached
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-stone-100 text-stone-400"
                }`}
                aria-hidden
              >
                {step.reached ? (
                  <Check className="h-4 w-4" strokeWidth={2.5} />
                ) : (
                  <Circle className="h-3.5 w-3.5" />
                )}
              </span>
              <span
                className={step.reached ? "font-medium text-stone-900" : "text-stone-500"}
              >
                {step.label}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {readiness.footer ? (
        <p className="mt-4 text-sm font-medium text-emerald-800">{readiness.footer}</p>
      ) : null}
    </section>
  );
}
