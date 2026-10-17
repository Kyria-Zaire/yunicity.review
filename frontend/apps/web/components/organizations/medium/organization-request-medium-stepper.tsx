"use client";

import type { OrganizationRequestStepId } from "@yunicity/utils";
import {
  ORGANIZATION_REQUEST_STEPS,
  ORG_REQUEST_MEDIUM_STEP_ADDRESS,
  ORG_REQUEST_MEDIUM_STEP_IDENTITY,
  ORG_REQUEST_MEDIUM_STEP_PRACTICAL,
  ORG_REQUEST_MEDIUM_STEP_VERIFICATION,
  ORG_REQUEST_MEDIUM_STEP_VISUALS,
  ORG_REQUEST_STEP_PROGRESS,
} from "@yunicity/utils";

const MEDIUM_STEP_LABEL: Record<OrganizationRequestStepId, string> = {
  identity: ORG_REQUEST_MEDIUM_STEP_IDENTITY,
  address: ORG_REQUEST_MEDIUM_STEP_ADDRESS,
  practical: ORG_REQUEST_MEDIUM_STEP_PRACTICAL,
  visuals: ORG_REQUEST_MEDIUM_STEP_VISUALS,
  verification: ORG_REQUEST_MEDIUM_STEP_VERIFICATION,
};

type OrganizationRequestMediumStepperProps = {
  activeStep: OrganizationRequestStepId;
};

export function OrganizationRequestMediumStepper({
  activeStep,
}: OrganizationRequestMediumStepperProps) {
  const activeIndex = ORGANIZATION_REQUEST_STEPS.findIndex((step) => step.id === activeStep);

  return (
    <nav
      aria-label="Étapes de proposition"
      className="rounded-2xl border border-neutral-200/90 bg-white px-4 py-4 shadow-sm sm:px-5"
      data-org-request-medium-stepper=""
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
        {ORG_REQUEST_STEP_PROGRESS(activeIndex + 1, ORGANIZATION_REQUEST_STEPS.length)}
      </p>

      <ol className="mt-4 flex items-start justify-between gap-1">
        {ORGANIZATION_REQUEST_STEPS.map((step, index) => {
          const done = index < activeIndex;
          const active = step.id === activeStep;
          const isLast = index === ORGANIZATION_REQUEST_STEPS.length - 1;

          return (
            <li key={step.id} className="relative flex min-w-0 flex-1 flex-col items-center">
              {!isLast ? (
                <span
                  className={`absolute left-[calc(50%+1rem)] top-4 h-px w-[calc(100%-2rem)] ${
                    done ? "bg-yunicity-primary/40" : "bg-neutral-200"
                  }`}
                  aria-hidden
                />
              ) : null}
              <span
                className={`relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
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
                className={`mt-2 text-center text-[11px] font-semibold leading-tight sm:text-xs ${
                  active ? "text-yunicity-primary" : done ? "text-neutral-700" : "text-neutral-400"
                }`}
              >
                {MEDIUM_STEP_LABEL[step.id]}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
