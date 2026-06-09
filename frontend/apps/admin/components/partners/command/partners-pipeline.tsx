import type { AdminPartnersWorkspaceSummary } from "@yunicity/types";
import { formatAdminMetric, partnerPipelineSteps } from "@yunicity/utils";
import { ArrowRight } from "lucide-react";

export function PartnersPipeline({
  summary,
}: {
  summary: AdminPartnersWorkspaceSummary;
}) {
  const steps = partnerPipelineSteps(summary);

  return (
    <section
      className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5"
      aria-labelledby="partners-pipeline-title"
    >
      <h2
        id="partners-pipeline-title"
        className="text-[10px] font-semibold uppercase tracking-widest text-stone-500"
      >
        Pipeline territorial
      </h2>
      <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-stretch">
        {steps.map((step, index) => (
          <div key={step.id} className="flex min-w-0 flex-1 items-stretch gap-3">
            <div className="flex min-w-0 flex-1 flex-col rounded-xl border border-stone-100 bg-stone-50/60 px-4 py-3">
              <p className="text-xs font-medium text-stone-500">{step.label}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-stone-900">
                {step.count === null ? "—" : formatAdminMetric(step.count)}
              </p>
              {step.unavailable ? (
                <p className="mt-1 text-xs text-stone-400">non exposé</p>
              ) : step.hint ? (
                <p className="mt-1 text-xs text-stone-500">{step.hint}</p>
              ) : null}
            </div>
            {index < steps.length - 1 ? (
              <ArrowRight
                className="hidden h-5 w-5 shrink-0 self-center text-stone-300 lg:block"
                aria-hidden
              />
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
