"use client";

import type { EventCreateStepId } from "@yunicity/utils";
import {
  EVENT_CREATE_MEDIUM_STEP_ESSENTIALS,
  EVENT_CREATE_MEDIUM_STEP_PRACTICAL,
  EVENT_CREATE_MEDIUM_STEP_REVIEW,
  EVENT_CREATE_MEDIUM_STEP_SCHEDULE,
  EVENT_CREATE_MEDIUM_STEP_VISUALS,
  EVENT_CREATE_MOBILE_PROGRESS_PERCENT,
  EVENT_CREATE_STEPS,
  EVENT_CREATE_STEP_PROGRESS,
  eventCreateStepProgressPercent,
} from "@yunicity/utils";

const COMPACT_LABEL: Record<EventCreateStepId, string> = {
  essentials: EVENT_CREATE_MEDIUM_STEP_ESSENTIALS,
  schedule: EVENT_CREATE_MEDIUM_STEP_SCHEDULE,
  visuals: EVENT_CREATE_MEDIUM_STEP_VISUALS,
  practical: EVENT_CREATE_MEDIUM_STEP_PRACTICAL,
  review: EVENT_CREATE_MEDIUM_STEP_REVIEW,
};

type EventCreateMobileStepperProps = {
  activeStep: EventCreateStepId;
};

export function EventCreateMobileStepper({ activeStep }: EventCreateMobileStepperProps) {
  const activeIndex = EVENT_CREATE_STEPS.findIndex((step) => step.id === activeStep);
  const current = EVENT_CREATE_STEPS[activeIndex] ?? EVENT_CREATE_STEPS[0]!;
  const percent = eventCreateStepProgressPercent(activeStep);

  return (
    <nav aria-label="Étapes de création" className="space-y-4" data-event-create-mobile-stepper="">
      <p className="text-xs font-semibold text-yunicity-primary">
        {EVENT_CREATE_STEP_PROGRESS(activeIndex + 1, EVENT_CREATE_STEPS.length)}
      </p>
      <h2 className="text-xl font-bold tracking-tight text-neutral-900">{current.label}</h2>

      <div className="flex items-center gap-3">
        <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-neutral-200">
          <div
            className="h-full rounded-full bg-yunicity-primary transition-[width]"
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="shrink-0 text-xs font-semibold tabular-nums text-neutral-500">
          {EVENT_CREATE_MOBILE_PROGRESS_PERCENT(percent)}
        </span>
      </div>

      <ol className="flex items-start justify-between gap-1">
        {EVENT_CREATE_STEPS.map((step, index) => {
          const done = index < activeIndex;
          const active = step.id === activeStep;
          const isLast = index === EVENT_CREATE_STEPS.length - 1;

          return (
            <li key={step.id} className="relative flex min-w-0 flex-1 flex-col items-center">
              {!isLast ? (
                <span
                  className={`absolute left-[calc(50%+0.875rem)] top-3.5 h-px w-[calc(100%-1.75rem)] ${
                    done ? "bg-yunicity-primary/40" : "bg-neutral-200"
                  }`}
                  aria-hidden
                />
              ) : null}
              <span
                className={`relative z-[1] flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
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
                className={`mt-1.5 text-center text-[10px] font-semibold leading-tight ${
                  active ? "text-yunicity-primary" : done ? "text-neutral-700" : "text-neutral-400"
                }`}
              >
                {COMPACT_LABEL[step.id]}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
