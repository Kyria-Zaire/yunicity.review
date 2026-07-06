"use client";

import type { RegisterStepId } from "@yunicity/utils";
import { REGISTER_STEPS } from "@yunicity/utils";
import { Check } from "lucide-react";

type RegisterMobileStepperProps = {
  activeStep: RegisterStepId;
};

const CIRCLE_SIZE_REM = 2; // h-8 w-8

/** Stepper compact inscription mobile — ligne continue (MOBILE-AUTH-01). */
export function RegisterMobileStepper({ activeStep }: RegisterMobileStepperProps) {
  const activeIndex = Math.max(
    0,
    REGISTER_STEPS.findIndex((step) => step.id === activeStep),
  );

  const stepCount = REGISTER_STEPS.length;
  const progressRatio = stepCount > 1 ? activeIndex / (stepCount - 1) : 0;

  return (
    <nav aria-label="Étapes d'inscription" className="px-1 py-2">
      <div className="relative">
        {/* Piste continue — une seule ligne, pas de segments cassés */}
        <div
          className="pointer-events-none absolute top-4 h-0.5 -translate-y-1/2 bg-neutral-200"
          style={{
            left: `${CIRCLE_SIZE_REM / 2}rem`,
            right: `${CIRCLE_SIZE_REM / 2}rem`,
          }}
          aria-hidden
        />
        {activeIndex > 0 ? (
          <div
            className="pointer-events-none absolute top-4 h-0.5 -translate-y-1/2 bg-yunicity-primary transition-[width] duration-200"
            style={{
              left: `${CIRCLE_SIZE_REM / 2}rem`,
              width:
                progressRatio >= 1
                  ? `calc(100% - ${CIRCLE_SIZE_REM}rem)`
                  : `calc((100% - ${CIRCLE_SIZE_REM}rem) * ${progressRatio})`,
            }}
            aria-hidden
          />
        ) : null}

        <ol className="relative flex justify-between">
          {REGISTER_STEPS.map((step, index) => {
            const done = index < activeIndex;
            const active = step.id === activeStep;

            return (
              <li key={step.id} className="flex w-[4.25rem] flex-col items-center">
                <span
                  className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    active || done
                      ? "bg-yunicity-primary text-white"
                      : "bg-neutral-200 text-neutral-500"
                  }`}
                >
                  {done && !active ? (
                    <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden />
                  ) : (
                    step.order
                  )}
                </span>
                <span
                  className={`mt-1.5 w-full text-center text-[10px] font-semibold leading-tight ${
                    active ? "text-yunicity-primary" : done ? "text-neutral-800" : "text-neutral-500"
                  }`}
                >
                  {step.label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
