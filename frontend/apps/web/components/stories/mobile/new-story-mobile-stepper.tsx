"use client";

import type { StoryMobileStepId } from "@yunicity/utils";
import { STORIES_MOBILE_STEPS } from "@yunicity/utils";
import { Check } from "lucide-react";

type NewStoryMobileStepperProps = {
  activeStep: StoryMobileStepId;
};

/** Stepper 3 étapes — Contenu · Détails · Partager (MOBILE-NEW-STORY-01). */
export function NewStoryMobileStepper({ activeStep }: NewStoryMobileStepperProps) {
  const activeIndex = Math.max(
    0,
    STORIES_MOBILE_STEPS.findIndex((step) => step.id === activeStep),
  );

  return (
    <nav aria-label="Étapes de publication" className="px-1">
      <ol className="flex items-center justify-between">
        {STORIES_MOBILE_STEPS.map((step, index) => {
          const done = index < activeIndex;
          const active = step.id === activeStep;
          const stepNumber = index + 1;

          return (
            <li key={step.id} className="flex flex-1 flex-col items-center">
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
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    active
                      ? "bg-yunicity-primary text-white"
                      : done
                        ? "bg-yunicity-primary text-white"
                        : "bg-neutral-200 text-neutral-500"
                  }`}
                >
                  {done && !active ? (
                    <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden />
                  ) : (
                    stepNumber
                  )}
                </span>
                {index < STORIES_MOBILE_STEPS.length - 1 ? (
                  <span
                    className={`h-0.5 flex-1 ${done ? "bg-yunicity-primary" : "bg-neutral-200"}`}
                    aria-hidden
                  />
                ) : (
                  <span className="flex-1" aria-hidden />
                )}
              </div>
              <span
                className={`mt-1.5 text-[11px] font-semibold ${
                  active ? "text-yunicity-primary" : "text-neutral-500"
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
