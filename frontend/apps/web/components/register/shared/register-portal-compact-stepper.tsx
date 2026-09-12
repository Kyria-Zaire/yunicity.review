"use client";

import {
  REGISTER_DESKTOP_STEPS,
  registerCompactStepLabel,
} from "@/lib/auth/register-desktop-contract";
import type { RegisterStepId } from "@yunicity/utils";

type RegisterPortalCompactStepperProps = {
  activeStep: RegisterStepId;
};

export function RegisterPortalCompactStepper({ activeStep }: RegisterPortalCompactStepperProps) {
  const activeIndex = Math.max(
    0,
    REGISTER_DESKTOP_STEPS.findIndex((step) => step.id === activeStep),
  );
  const currentStep = REGISTER_DESKTOP_STEPS[activeIndex];
  const progress = ((activeIndex + 1) / REGISTER_DESKTOP_STEPS.length) * 100;

  return (
    <nav aria-label="Étapes d'inscription" className="mb-6">
      <p className="text-sm font-medium text-neutral-700">
        {registerCompactStepLabel(activeIndex + 1, REGISTER_DESKTOP_STEPS.length)}
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-200">
        <div
          className="h-full rounded-full bg-yunicity-primary transition-[width] duration-200"
          style={{ width: `${progress}%` }}
          aria-hidden
        />
      </div>
      {currentStep ? (
        <p className="mt-2 text-sm font-semibold text-yunicity-primary">{currentStep.label}</p>
      ) : null}
    </nav>
  );
}
