"use client";

import { REGISTER_DESKTOP_STEPS } from "@/lib/auth/register-desktop-contract";
import type { RegisterStepId } from "@yunicity/utils";

type RegisterDesktopStepperProps = {
  activeStep: RegisterStepId;
};

export function RegisterDesktopStepper({ activeStep }: RegisterDesktopStepperProps) {
  const activeIndex = REGISTER_DESKTOP_STEPS.findIndex((step) => step.id === activeStep);

  return (
    <nav aria-label="Étapes d'inscription" className="mb-8">
      <ol className="flex items-start justify-center gap-2 xl:gap-3">
        {REGISTER_DESKTOP_STEPS.map((step, index) => {
          const done = index < activeIndex;
          const active = step.id === activeStep;
          return (
            <li key={step.id} className="flex min-w-0 flex-1 flex-col items-center">
              <div className="flex w-full items-center">
                {index > 0 ? (
                  <span
                    className={`h-0.5 flex-1 ${done || active ? "bg-yunicity-primary" : "bg-neutral-200"}`}
                    aria-hidden
                  />
                ) : (
                  <span className="flex-1" aria-hidden />
                )}
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    active
                      ? "bg-yunicity-primary text-white"
                      : done
                        ? "bg-yunicity-primary-soft text-yunicity-primary"
                        : "bg-neutral-100 text-neutral-500"
                  }`}
                >
                  {step.order}
                </span>
                {index < REGISTER_DESKTOP_STEPS.length - 1 ? (
                  <span
                    className={`h-0.5 flex-1 ${index < activeIndex ? "bg-yunicity-primary" : "bg-neutral-200"}`}
                    aria-hidden
                  />
                ) : (
                  <span className="flex-1" aria-hidden />
                )}
              </div>
              <span
                className={`mt-2 text-center text-[11px] font-semibold leading-tight xl:text-xs ${
                  active ? "text-yunicity-primary" : done ? "text-neutral-800" : "text-neutral-500"
                }`}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
