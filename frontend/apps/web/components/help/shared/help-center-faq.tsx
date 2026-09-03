"use client";

import type { HelpCenterFaqItem } from "@/lib/help/help-center-contract";
import { HELP_CENTER_COPY } from "@/lib/help/help-center-contract";
import { ChevronDown } from "lucide-react";

type HelpCenterFaqProps = {
  items: HelpCenterFaqItem[];
  openId: string | null;
  onToggle: (id: string) => void;
  titleId?: string;
  className?: string;
};

export function HelpCenterFaq({
  items,
  openId,
  onToggle,
  titleId = "help-center-faq-title",
  className = "mt-8 sm:mt-10",
}: HelpCenterFaqProps) {
  return (
    <section aria-labelledby={titleId} className={className}>
      <h2 id={titleId} className="text-lg font-bold text-neutral-950 sm:text-xl">
        {HELP_CENTER_COPY.faqTitle}
      </h2>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-neutral-500">Aucune question ne correspond à votre recherche.</p>
      ) : (
        <ul className="mt-4 divide-y divide-neutral-200/90 overflow-hidden rounded-2xl border border-neutral-200/90 bg-white">
          {items.map((item) => {
            const open = openId === item.id;
            return (
              <li key={item.id} id={`faq-${item.id}`} className="scroll-mt-28">
                <button
                  type="button"
                  onClick={() => onToggle(item.id)}
                  aria-expanded={open}
                  data-help-center-control={`faq-${item.id}`}
                  className="flex min-h-11 w-full items-center justify-between gap-4 px-4 py-4 text-left transition hover:bg-neutral-50 sm:px-5"
                >
                  <span className="text-sm font-semibold text-neutral-900">{item.question}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-neutral-400 transition ${open ? "rotate-180" : ""}`}
                    aria-hidden
                  />
                </button>
                {open ? (
                  <div className="border-t border-neutral-100 px-4 pb-4 pt-1 sm:px-5">
                    <p className="text-sm leading-relaxed text-neutral-600">{item.answer}</p>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
