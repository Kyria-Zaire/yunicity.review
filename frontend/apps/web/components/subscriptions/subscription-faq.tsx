"use client";

import { SUBSCRIPTION_FAQ_ITEMS, SUBSCRIPTION_FAQ_TITLE } from "@yunicity/utils";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

export function SubscriptionFaq() {
  const [openId, setOpenId] = useState<string | null>(SUBSCRIPTION_FAQ_ITEMS[0]?.id ?? null);

  return (
    <section className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-bold text-neutral-900">{SUBSCRIPTION_FAQ_TITLE}</h2>
      <ul className="mt-4 divide-y divide-neutral-100">
        {SUBSCRIPTION_FAQ_ITEMS.map((item) => {
          const open = openId === item.id;
          return (
            <li key={item.id}>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 py-4 text-left"
                aria-expanded={open}
                onClick={() => setOpenId(open ? null : item.id)}
              >
                <span className="text-sm font-semibold text-neutral-900">{item.question}</span>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-neutral-400 transition ${open ? "rotate-180" : ""}`}
                  aria-hidden
                />
              </button>
              {open ? (
                <p className="pb-4 text-sm leading-relaxed text-neutral-600">{item.answer}</p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
