"use client";

import {
  ORGANIZATION_REQUEST_CATEGORY_OPTIONS,
  ORG_REQUEST_SIDEBAR_EXAMPLES,
  ORG_REQUEST_SIDEBAR_RULES,
  ORG_REQUEST_SIDEBAR_RULES_LINK,
  ORG_REQUEST_SIDEBAR_RULE_1,
  ORG_REQUEST_SIDEBAR_RULE_2,
  ORG_REQUEST_SIDEBAR_RULE_3,
  ORG_REQUEST_SIDEBAR_RULE_4,
  ORG_REQUEST_SIDEBAR_WHY,
  ORG_REQUEST_SIDEBAR_WHY_1,
  ORG_REQUEST_SIDEBAR_WHY_2,
  ORG_REQUEST_SIDEBAR_WHY_3,
} from "@yunicity/utils";
import {
  Building2,
  Check,
  MapPin,
  Mountain,
  Puzzle,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  UtensilsCrossed,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const WHY_ITEMS = [
  { icon: Sparkles, text: ORG_REQUEST_SIDEBAR_WHY_1 },
  { icon: MapPin, text: ORG_REQUEST_SIDEBAR_WHY_2 },
  { icon: ShieldCheck, text: ORG_REQUEST_SIDEBAR_WHY_3 },
];

const EXAMPLE_ICONS: Record<string, LucideIcon> = {
  cafe_restaurant: UtensilsCrossed,
  commerce: ShoppingBag,
  cultural: Building2,
  leisure: Puzzle,
  services: Wrench,
  nature: Mountain,
};

const RULES = [
  ORG_REQUEST_SIDEBAR_RULE_1,
  ORG_REQUEST_SIDEBAR_RULE_2,
  ORG_REQUEST_SIDEBAR_RULE_3,
  ORG_REQUEST_SIDEBAR_RULE_4,
];

export function OrganizationRequestSidebar() {
  return (
    <aside className="hidden w-72 shrink-0 xl:block">
      <div className="sticky top-24 space-y-6">
        <section className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm">
          <h2 className="text-base font-bold text-neutral-900">{ORG_REQUEST_SIDEBAR_WHY}</h2>
          <ul className="mt-4 space-y-3">
            {WHY_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.text} className="flex items-start gap-3">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EEF0FF] text-yunicity-primary">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="text-sm leading-relaxed text-neutral-700">{item.text}</span>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm">
          <h2 className="text-base font-bold text-neutral-900">{ORG_REQUEST_SIDEBAR_EXAMPLES}</h2>
          <ul className="mt-4 space-y-2.5">
            {ORGANIZATION_REQUEST_CATEGORY_OPTIONS.map((option) => {
              const Icon = EXAMPLE_ICONS[option.id] ?? Store;
              return (
                <li key={option.id} className="flex items-center gap-2.5 text-sm text-neutral-700">
                  <Icon className="h-4 w-4 shrink-0 text-yunicity-primary" aria-hidden />
                  {option.label}
                </li>
              );
            })}
          </ul>
        </section>

        <section
          id="org-request-rules"
          className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm"
        >
          <h2 className="text-base font-bold text-neutral-900">{ORG_REQUEST_SIDEBAR_RULES}</h2>
          <ul className="mt-4 space-y-2.5">
            {RULES.map((rule) => (
              <li key={rule} className="flex items-start gap-2.5 text-sm text-neutral-700">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                {rule}
              </li>
            ))}
          </ul>
          <a
            href="#org-request-rules"
            className="mt-4 inline-flex text-sm font-semibold text-yunicity-primary hover:underline"
          >
            {ORG_REQUEST_SIDEBAR_RULES_LINK} →
          </a>
        </section>
      </div>
    </aside>
  );
}
