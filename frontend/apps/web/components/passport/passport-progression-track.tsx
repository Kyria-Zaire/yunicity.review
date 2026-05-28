"use client";

import type { PassportProgressionStep } from "@yunicity/utils";
import { PASSPORT_PROGRESSION_TITLE } from "@yunicity/utils";
import { Check, Lock, Sparkles } from "lucide-react";

type PassportProgressionTrackProps = {
  steps: PassportProgressionStep[];
};

export function PassportProgressionTrack({ steps }: PassportProgressionTrackProps) {
  return (
    <section id="passport-progression" className="scroll-mt-6">
      <h2 className="text-xl font-bold text-neutral-900">{PASSPORT_PROGRESSION_TITLE}</h2>
      <div className="-mx-1 mt-4 overflow-x-auto px-1 pb-2">
        <ol className="flex min-w-max gap-3 sm:gap-4">
          {steps.map((step) => (
            <li
              key={step.level.id}
              className={`w-44 shrink-0 rounded-2xl border p-4 sm:w-48 ${
                step.state === "active"
                  ? "border-yunicity-primary bg-[#EEF0FF] shadow-sm"
                  : step.state === "unlocked"
                    ? "border-emerald-200 bg-emerald-50/50"
                    : "border-neutral-200/90 bg-white opacity-90"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${
                    step.state === "active"
                      ? "bg-yunicity-primary text-white"
                      : step.state === "unlocked"
                        ? "bg-emerald-600 text-white"
                        : "bg-neutral-100 text-neutral-400"
                  }`}
                >
                  {step.state === "locked" ? (
                    <Lock className="h-4 w-4" aria-hidden />
                  ) : step.state === "unlocked" ? (
                    <Check className="h-4 w-4" aria-hidden />
                  ) : (
                    <Sparkles className="h-4 w-4" aria-hidden />
                  )}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                  {step.pointsLabel}
                </span>
              </div>
              <p className="mt-3 text-sm font-bold text-neutral-900">{step.level.label}</p>
              <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-neutral-600">
                {step.level.description}
              </p>
              <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                {step.state === "active"
                  ? "Niveau actuel"
                  : step.state === "unlocked"
                    ? "Débloqué"
                    : "À venir"}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
