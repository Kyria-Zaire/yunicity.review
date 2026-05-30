"use client";

import type { RegisterStepId } from "@yunicity/utils";
import { REGISTER_STEPS } from "@yunicity/utils";

type RegisterStepperProps = {
  activeStep: RegisterStepId;
};

export function RegisterStepper({ activeStep }: RegisterStepperProps) {
  const activeIndex = REGISTER_STEPS.findIndex((step) => step.id === activeStep);

  return (
    <nav aria-label="Étapes d'inscription" className="mb-8 overflow-x-auto">
      <ol className="flex min-w-max items-center gap-2 sm:gap-4">
        {REGISTER_STEPS.map((step, index) => {
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
              {index < REGISTER_STEPS.length - 1 ? (
                <span
                  className="hidden h-px w-8 border-t border-dashed border-neutral-300 sm:block"
                  aria-hidden
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
