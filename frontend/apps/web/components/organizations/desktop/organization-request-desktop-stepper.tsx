"use client";

import type { OrganizationRequestStepId } from "@yunicity/utils";
import { ORGANIZATION_REQUEST_STEPS, ORG_REQUEST_STEP_PROGRESS } from "@yunicity/utils";

type OrganizationRequestDesktopStepperProps = {
  activeStep: OrganizationRequestStepId;
};

export function OrganizationRequestDesktopStepper({
  activeStep,
}: OrganizationRequestDesktopStepperProps) {
  const activeIndex = ORGANIZATION_REQUEST_STEPS.findIndex((step) => step.id === activeStep);

  return (
    <nav aria-label="Étapes de proposition" data-org-request-desktop-stepper="">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
        {ORG_REQUEST_STEP_PROGRESS(activeIndex + 1, ORGANIZATION_REQUEST_STEPS.length)}
      </p>
      <ol className="mt-4 space-y-0">
        {ORGANIZATION_REQUEST_STEPS.map((step, index) => {
          const done = index < activeIndex;
          const active = step.id === activeStep;
          const isLast = index === ORGANIZATION_REQUEST_STEPS.length - 1;

          return (
            <li key={step.id} className="relative flex gap-3 pb-5 last:pb-0">
              {!isLast ? (
                <span
                  className={`absolute left-4 top-8 h-[calc(100%-1rem)] w-px ${
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
                      : "bg-neutral-100 text-neutral-400"
                }`}
              >
                {step.order}
              </span>
              <div className="min-w-0 pt-0.5">
                <p
                  className={`text-sm font-semibold leading-snug ${
                    active ? "text-yunicity-primary" : done ? "text-neutral-700" : "text-neutral-400"
                  }`}
                >
                  {step.label}
                </p>
                <p
                  className={`mt-0.5 text-xs leading-snug ${
                    active ? "text-neutral-500" : "text-neutral-400"
                  }`}
                >
                  {step.hint}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
