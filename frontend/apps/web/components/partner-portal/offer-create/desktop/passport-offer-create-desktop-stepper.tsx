"use client";

import type { PassportOfferCreateStepId } from "@yunicity/utils";
import { PASSPORT_OFFER_CREATE_STEPS } from "@yunicity/utils";
import { Check } from "lucide-react";

type PassportOfferCreateDesktopStepperProps = {
  activeStep: PassportOfferCreateStepId;
  onStepClick: (step: PassportOfferCreateStepId) => void;
};

export function PassportOfferCreateDesktopStepper({
  activeStep,
  onStepClick,
}: PassportOfferCreateDesktopStepperProps) {
  const activeIndex = PASSPORT_OFFER_CREATE_STEPS.findIndex((step) => step.id === activeStep);

  return (
    <nav aria-label="Étapes de création d'offre" data-passport-offer-create-stepper="">
      <ol className="space-y-0">
        {PASSPORT_OFFER_CREATE_STEPS.map((step, index) => {
          const done = index < activeIndex;
          const active = step.id === activeStep;
          const isLast = index === PASSPORT_OFFER_CREATE_STEPS.length - 1;

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
              <button
                type="button"
                onClick={() => onStepClick(step.id)}
                className="group relative z-[1] flex w-full items-start gap-3 text-left"
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition ${
                    active
                      ? "bg-yunicity-primary text-white"
                      : done
                        ? "bg-yunicity-primary-soft text-yunicity-primary"
                        : "border border-neutral-200 bg-white text-neutral-400"
                  }`}
                >
                  {done ? <Check className="h-4 w-4" aria-hidden /> : step.order}
                </span>
                <span className="min-w-0 pt-0.5">
                  <span
                    className={`block text-sm font-semibold leading-snug ${
                      active ? "text-neutral-900" : done ? "text-neutral-700" : "text-neutral-400"
                    }`}
                  >
                    {step.label}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
