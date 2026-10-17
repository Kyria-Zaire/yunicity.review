"use client";

import type { EventCreateStepId } from "@yunicity/utils";
import {
  EVENT_CREATE_MEDIUM_STEP_ESSENTIALS,
  EVENT_CREATE_MEDIUM_STEP_PRACTICAL,
  EVENT_CREATE_MEDIUM_STEP_REVIEW,
  EVENT_CREATE_MEDIUM_STEP_SCHEDULE,
  EVENT_CREATE_MEDIUM_STEP_VISUALS,
  EVENT_CREATE_STEPS,
  EVENT_CREATE_STEP_PROGRESS,
} from "@yunicity/utils";

const MEDIUM_STEP_LABEL: Record<EventCreateStepId, string> = {
  essentials: EVENT_CREATE_MEDIUM_STEP_ESSENTIALS,
  schedule: EVENT_CREATE_MEDIUM_STEP_SCHEDULE,
  visuals: EVENT_CREATE_MEDIUM_STEP_VISUALS,
  practical: EVENT_CREATE_MEDIUM_STEP_PRACTICAL,
  review: EVENT_CREATE_MEDIUM_STEP_REVIEW,
};

type EventCreateMediumStepperProps = {
  activeStep: EventCreateStepId;
};

export function EventCreateMediumStepper({ activeStep }: EventCreateMediumStepperProps) {
  const activeIndex = EVENT_CREATE_STEPS.findIndex((step) => step.id === activeStep);

  return (
    <nav
      aria-label="Étapes de création"
      className="rounded-2xl border border-neutral-200/90 bg-white px-4 py-4 shadow-sm sm:px-5"
      data-event-create-medium-stepper=""
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
        {EVENT_CREATE_STEP_PROGRESS(activeIndex + 1, EVENT_CREATE_STEPS.length)}
      </p>

      <ol className="mt-4 flex items-start justify-between gap-1">
        {EVENT_CREATE_STEPS.map((step, index) => {
          const done = index < activeIndex;
          const active = step.id === activeStep;
          const isLast = index === EVENT_CREATE_STEPS.length - 1;

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
              <span
                className={`relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  active
                    ? "bg-yunicity-primary text-white"
                    : done
                      ? "bg-yunicity-primary-soft text-yunicity-primary"
                      : "border border-neutral-200 bg-white text-neutral-400"
                }`}
              >
                {step.order}
              </span>
              <span
                className={`mt-2 text-center text-[11px] font-semibold leading-tight sm:text-xs ${
                  active ? "text-neutral-900" : done ? "text-neutral-700" : "text-neutral-400"
                }`}
              >
                {MEDIUM_STEP_LABEL[step.id]}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
