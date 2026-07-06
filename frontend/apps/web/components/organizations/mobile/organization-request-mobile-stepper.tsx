"use client";

import type { OrganizationRequestStepId } from "@yunicity/utils";
import { ORGANIZATION_REQUEST_STEPS } from "@yunicity/utils";

type OrganizationRequestMobileStepperProps = {
  activeStep: OrganizationRequestStepId;
};

/** Stepper compact mobile (MOBILE-ORG-REQUEST-01). */
export function OrganizationRequestMobileStepper({
  activeStep,
}: OrganizationRequestMobileStepperProps) {
  const activeIndex = Math.max(
    0,
    ORGANIZATION_REQUEST_STEPS.findIndex((step) => step.id === activeStep),
  );
  const current = ORGANIZATION_REQUEST_STEPS[activeIndex]!;

  return (
    <nav aria-label="Étapes de proposition" className="space-y-2">
      <p className="text-xs font-medium text-neutral-500">
        Étape {activeIndex + 1} sur {ORGANIZATION_REQUEST_STEPS.length}
      </p>
      <p className="text-sm font-bold text-neutral-900">{current.label}</p>
      <ol className="flex gap-1" aria-hidden>
        {ORGANIZATION_REQUEST_STEPS.map((step, index) => {
          const done = index < activeIndex;
          const active = step.id === activeStep;
          return (
            <li
              key={step.id}
              className={`h-1 flex-1 rounded-full ${
                active || done ? "bg-yunicity-primary" : "bg-neutral-200"
              }`}
            />
          );
        })}
      </ol>
    </nav>
  );
}
