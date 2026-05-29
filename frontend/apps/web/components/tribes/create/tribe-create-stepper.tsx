"use client";

import type { TribeCreateStepId } from "@yunicity/utils";
import { TRIBE_CREATE_STEPS } from "@yunicity/utils";

type TribeCreateStepperProps = {
  activeStep: TribeCreateStepId;
};

export function TribeCreateStepper({ activeStep }: TribeCreateStepperProps) {
  const activeIndex = TRIBE_CREATE_STEPS.findIndex((step) => step.id === activeStep);

  return (
    <nav aria-label="Étapes de création" className="mb-8 overflow-x-auto">
      <ol className="flex min-w-max items-center gap-2 sm:gap-4">
        {TRIBE_CREATE_STEPS.map((step, index) => {
          const done = index < activeIndex;
          const active = step.id === activeStep;
          return (
            <li key={step.id} className="flex items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                    active
                      ? "bg-yunicity-primary text-white"
                      : done
                        ? "bg-yunicity-primary-soft text-yunicity-primary"
                        : "bg-neutral-100 text-neutral-500"
                  }`}
                >
                  {step.order}
                </span>
                <span
                  className={`whitespace-nowrap text-sm font-medium ${
                    active ? "text-yunicity-primary" : done ? "text-neutral-800" : "text-neutral-500"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index < TRIBE_CREATE_STEPS.length - 1 ? (
                <span className="hidden h-px w-6 bg-neutral-200 sm:block" aria-hidden />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
