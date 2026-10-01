"use client";

import type { PassportOfferCreateStepId } from "@yunicity/utils";
import {
  PASSPORT_OFFER_CREATE_MEDIUM_STEP_BENEFIT,
  PASSPORT_OFFER_CREATE_MEDIUM_STEP_ELIGIBILITY,
  PASSPORT_OFFER_CREATE_MEDIUM_STEP_GENERAL,
  PASSPORT_OFFER_CREATE_MEDIUM_STEP_VALIDITY,
  PASSPORT_OFFER_CREATE_MOBILE_STEP_REVIEW,
  PASSPORT_OFFER_CREATE_STEPS,
  PASSPORT_OFFER_CREATE_STEP_PROGRESS,
} from "@yunicity/utils";

const PILL_LABEL: Record<PassportOfferCreateStepId, string> = {
  general: PASSPORT_OFFER_CREATE_MEDIUM_STEP_GENERAL,
  benefit: PASSPORT_OFFER_CREATE_MEDIUM_STEP_BENEFIT,
  validity: PASSPORT_OFFER_CREATE_MEDIUM_STEP_VALIDITY,
  eligibility: PASSPORT_OFFER_CREATE_MEDIUM_STEP_ELIGIBILITY,
  review: PASSPORT_OFFER_CREATE_MOBILE_STEP_REVIEW,
};

type PassportOfferCreateMobileStepperProps = {
  activeStep: PassportOfferCreateStepId;
  onStepClick: (step: PassportOfferCreateStepId) => void;
};

export function PassportOfferCreateMobileStepper({
  activeStep,
  onStepClick,
}: PassportOfferCreateMobileStepperProps) {
  const activeIndex = PASSPORT_OFFER_CREATE_STEPS.findIndex((step) => step.id === activeStep);

  return (
    <nav aria-label="Étapes de création d'offre" className="space-y-3" data-passport-offer-create-mobile-stepper="">
      <p className="text-xs font-semibold text-yunicity-primary">
        {PASSPORT_OFFER_CREATE_STEP_PROGRESS(activeIndex + 1, PASSPORT_OFFER_CREATE_STEPS.length)}
      </p>

      <div className="flex gap-1">
        {PASSPORT_OFFER_CREATE_STEPS.map((step, index) => {
          const filled = index <= activeIndex;
          return (
            <span
              key={step.id}
              className={`h-1.5 min-w-0 flex-1 rounded-full ${filled ? "bg-yunicity-primary" : "bg-neutral-200"}`}
              aria-hidden
            />
          );
        })}
      </div>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {PASSPORT_OFFER_CREATE_STEPS.map((step) => {
          const active = step.id === activeStep;
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onStepClick(step.id)}
              className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold transition ${
                active
                  ? "bg-yunicity-primary text-white"
                  : "border border-neutral-200 bg-white text-neutral-600"
              }`}
            >
              {PILL_LABEL[step.id]}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
