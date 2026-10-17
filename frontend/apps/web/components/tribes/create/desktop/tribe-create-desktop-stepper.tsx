"use client";

import type { TribeCreateStepId } from "@yunicity/utils";
import {
  TRIBE_CREATE_DESKTOP_STEPS,
  tribeCreateDesktopStepProgress,
  type TribeCreateDesktopStep,
} from "@yunicity/utils";

type TribeCreateDesktopStepperProps = {
  activeStep: TribeCreateStepId;
};

export function TribeCreateDesktopStepper({ activeStep }: TribeCreateDesktopStepperProps) {
  const activeIndex = TRIBE_CREATE_DESKTOP_STEPS.findIndex((step) => step.id === activeStep);

  return (
    <nav aria-label="Étapes de création" data-tribe-create-stepper="">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
        {tribeCreateDesktopStepProgress(activeIndex + 1, TRIBE_CREATE_DESKTOP_STEPS.length)}
      </p>
      <ol className="mt-4 space-y-0">
        {TRIBE_CREATE_DESKTOP_STEPS.map((step: TribeCreateDesktopStep, index: number) => {
          const done = index < activeIndex;
          const active = step.id === activeStep;
          const isLast = index === TRIBE_CREATE_DESKTOP_STEPS.length - 1;

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
                    active ? "text-neutral-900" : done ? "text-neutral-700" : "text-neutral-400"
                  }`}
                >
                  {step.label}
                </p>
                {active ? (
                  <p className="mt-0.5 text-xs text-neutral-500">{step.hint}</p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
