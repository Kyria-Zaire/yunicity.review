"use client";

import { PASSPORT_MOBILE_HOW_STEPS, PASSPORT_MOBILE_HOW_TITLE } from "@yunicity/utils";
import { ArrowRight, Gift, Percent, Smartphone, Star } from "lucide-react";
import type { ReactNode } from "react";

const STEP_ICONS: ReactNode[] = [
  <Smartphone key="scan" className="h-5 w-5" strokeWidth={1.75} aria-hidden />,
  <Percent key="enjoy" className="h-5 w-5" strokeWidth={1.75} aria-hidden />,
  <Star key="earn" className="h-5 w-5" strokeWidth={1.75} aria-hidden />,
  <Gift key="unlock" className="h-5 w-5" strokeWidth={1.75} aria-hidden />,
];

/** Étapes « Comment ça marche ? » — contenu statique produit (MOBILE-PASSPORT-01). */
export function PassportMobileHowItWorks() {
  return (
    <section className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
      <h2 className="text-base font-bold text-neutral-900">{PASSPORT_MOBILE_HOW_TITLE}</h2>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {PASSPORT_MOBILE_HOW_STEPS.map((step, index) => (
          <div key={step.title} className="flex shrink-0 items-center gap-2">
            <article className="flex w-[8.75rem] flex-col items-center text-center">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#EEF0FF] text-yunicity-primary">
                {STEP_ICONS[index]}
              </span>
              <p className="mt-2 text-[11px] font-bold text-yunicity-primary">
                {index + 1}. {step.title}
              </p>
              <p className="mt-1 text-[11px] leading-snug text-neutral-600">{step.body}</p>
            </article>
            {index < PASSPORT_MOBILE_HOW_STEPS.length - 1 ? (
              <ArrowRight className="h-4 w-4 shrink-0 text-neutral-300" aria-hidden />
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
