"use client";

import type { PassportOfferCreateStepId } from "@yunicity/utils";
import {
  PASSPORT_OFFER_CREATE_MEDIUM_STEP_BENEFIT,
  PASSPORT_OFFER_CREATE_MEDIUM_STEP_ELIGIBILITY,
  PASSPORT_OFFER_CREATE_MEDIUM_STEP_GENERAL,
  PASSPORT_OFFER_CREATE_MEDIUM_STEP_REVIEW,
  PASSPORT_OFFER_CREATE_MEDIUM_STEP_VALIDITY,
  PASSPORT_OFFER_CREATE_STEPS,
  PASSPORT_OFFER_CREATE_STEP_PROGRESS,
} from "@yunicity/utils";
import { Check } from "lucide-react";

const MEDIUM_STEP_LABEL: Record<PassportOfferCreateStepId, string> = {
  general: PASSPORT_OFFER_CREATE_MEDIUM_STEP_GENERAL,
  benefit: PASSPORT_OFFER_CREATE_MEDIUM_STEP_BENEFIT,
  validity: PASSPORT_OFFER_CREATE_MEDIUM_STEP_VALIDITY,
  eligibility: PASSPORT_OFFER_CREATE_MEDIUM_STEP_ELIGIBILITY,
  review: PASSPORT_OFFER_CREATE_MEDIUM_STEP_REVIEW,
};

type PassportOfferCreateMediumStepperProps = {
  activeStep: PassportOfferCreateStepId;
  onStepClick: (step: PassportOfferCreateStepId) => void;
};

export function PassportOfferCreateMediumStepper({
  activeStep,
  onStepClick,
}: PassportOfferCreateMediumStepperProps) {
  const activeIndex = PASSPORT_OFFER_CREATE_STEPS.findIndex((step) => step.id === activeStep);

  return (
    <nav
      aria-label="Étapes de création d'offre"
      className="rounded-2xl border border-neutral-200/90 bg-white px-4 py-4 shadow-sm sm:px-5"
      data-passport-offer-create-medium-stepper=""
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
        {PASSPORT_OFFER_CREATE_STEP_PROGRESS(activeIndex + 1, PASSPORT_OFFER_CREATE_STEPS.length)}
      </p>

      <ol className="mt-4 flex items-start justify-between gap-1">
        {PASSPORT_OFFER_CREATE_STEPS.map((step, index) => {
          const done = index < activeIndex;
          const active = step.id === activeStep;
          const isLast = index === PASSPORT_OFFER_CREATE_STEPS.length - 1;

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
              <button
                type="button"
                onClick={() => onStepClick(step.id)}
                className="group flex flex-col items-center"
              >
                <span
                  className={`relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    active
                      ? "bg-yunicity-primary text-white"
                      : done
                        ? "bg-yunicity-primary-soft text-yunicity-primary"
                        : "border border-neutral-200 bg-white text-neutral-400"
                  }`}
                >
                  {done ? <Check className="h-4 w-4" aria-hidden /> : step.order}
                </span>
                <span
                  className={`mt-2 text-center text-[10px] font-semibold leading-tight sm:text-[11px] ${
                    active ? "text-neutral-900" : done ? "text-neutral-700" : "text-neutral-400"
                  }`}
                >
                  {MEDIUM_STEP_LABEL[step.id]}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
