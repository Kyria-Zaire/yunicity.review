"use client";

import type { OrganizationRequestStepId } from "@yunicity/utils";
import {
  ORGANIZATION_REQUEST_STEPS,
  ORG_REQUEST_MOBILE_PROGRESS_PERCENT,
  ORG_REQUEST_MOBILE_STEP_ADDRESS,
  ORG_REQUEST_MOBILE_STEP_IDENTITY,
  ORG_REQUEST_MOBILE_STEP_PRACTICAL,
  ORG_REQUEST_MOBILE_STEP_VERIFICATION,
  ORG_REQUEST_MOBILE_STEP_VISUALS,
  ORG_REQUEST_STEP_PROGRESS,
  organizationRequestStepProgressPercent,
} from "@yunicity/utils";

const COMPACT_LABEL: Record<OrganizationRequestStepId, string> = {
  identity: ORG_REQUEST_MOBILE_STEP_IDENTITY,
  address: ORG_REQUEST_MOBILE_STEP_ADDRESS,
  practical: ORG_REQUEST_MOBILE_STEP_PRACTICAL,
  visuals: ORG_REQUEST_MOBILE_STEP_VISUALS,
  verification: ORG_REQUEST_MOBILE_STEP_VERIFICATION,
};

type OrganizationRequestMobileStepperProps = {
  activeStep: OrganizationRequestStepId;
};

/** Stepper mobile — % + pastilles (MOBILE-ORG-REQUEST-01). */
export function OrganizationRequestMobileStepper({
  activeStep,
}: OrganizationRequestMobileStepperProps) {
  const activeIndex = ORGANIZATION_REQUEST_STEPS.findIndex((step) => step.id === activeStep);
  const current = ORGANIZATION_REQUEST_STEPS[activeIndex] ?? ORGANIZATION_REQUEST_STEPS[0]!;
  const percent = organizationRequestStepProgressPercent(activeStep);

  return (
    <nav aria-label="Étapes de proposition" className="space-y-4" data-org-request-mobile-stepper="">
      <p className="text-xs font-semibold text-yunicity-primary">
        {ORG_REQUEST_STEP_PROGRESS(activeIndex + 1, ORGANIZATION_REQUEST_STEPS.length)}
      </p>
      <h2 className="text-xl font-bold tracking-tight text-neutral-900">{current.label}</h2>

      <div className="flex items-center gap-3">
        <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-neutral-200">
          <div
            className="h-full rounded-full bg-yunicity-primary transition-[width]"
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="shrink-0 text-xs font-semibold tabular-nums text-neutral-500">
          {ORG_REQUEST_MOBILE_PROGRESS_PERCENT(percent)}
        </span>
      </div>

      <ol className="flex items-start justify-between gap-1">
        {ORGANIZATION_REQUEST_STEPS.map((step, index) => {
          const done = index < activeIndex;
          const active = step.id === activeStep;
          const isLast = index === ORGANIZATION_REQUEST_STEPS.length - 1;

          return (
            <li key={step.id} className="relative flex min-w-0 flex-1 flex-col items-center">
              {!isLast ? (
                <span
                  className={`absolute left-[calc(50%+0.875rem)] top-3.5 h-px w-[calc(100%-1.75rem)] ${
                    done ? "bg-yunicity-primary/40" : "bg-neutral-200"
                  }`}
                  aria-hidden
                />
              ) : null}
              <span
                className={`relative z-[1] flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  active
                    ? "bg-yunicity-primary text-white"
                    : done
                      ? "bg-yunicity-primary-soft text-yunicity-primary"
                      : "border border-neutral-200 bg-white text-neutral-400"
                }`}
              >
                {step.order}
              </span>
              <span
                className={`mt-1.5 text-center text-[10px] font-semibold leading-tight ${
                  active ? "text-yunicity-primary" : done ? "text-neutral-700" : "text-neutral-400"
                }`}
              >
                {COMPACT_LABEL[step.id]}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
