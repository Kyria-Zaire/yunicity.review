"use client";

import {
  ORGANIZATION_REQUEST_CATEGORY_OPTIONS,
  ORG_REQUEST_SIDEBAR_EXAMPLES,
  ORG_REQUEST_SIDEBAR_RULES,
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
  ChevronDown,
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
import { useState, type ReactNode } from "react";

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

function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="rounded-xl border border-neutral-200/90 bg-white">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
      >
        <span className="text-sm font-bold text-neutral-900">{title}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-neutral-500 transition ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {open ? <div className="border-t border-neutral-100 px-4 pb-4 pt-1">{children}</div> : null}
    </section>
  );
}

/** Panneau contexte mobile (sidebar desktop) — MOBILE-ORG-REQUEST-01. */
export function OrganizationRequestMobileContextPanel() {
  return (
    <div className="space-y-3">
      <CollapsibleSection title={ORG_REQUEST_SIDEBAR_WHY} defaultOpen>
        <ul className="mt-2 space-y-3">
          {WHY_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.text} className="flex items-start gap-3">
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EEF0FF] text-yunicity-primary">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="text-sm leading-relaxed text-neutral-700">{item.text}</span>
              </li>
            );
          })}
        </ul>
      </CollapsibleSection>

      <CollapsibleSection title={ORG_REQUEST_SIDEBAR_EXAMPLES}>
        <ul className="mt-2 space-y-2">
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
      </CollapsibleSection>

      <CollapsibleSection title={ORG_REQUEST_SIDEBAR_RULES}>
        <ul className="mt-2 space-y-2">
          {RULES.map((rule) => (
            <li key={rule} className="flex items-start gap-2.5 text-sm text-neutral-700">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
              {rule}
            </li>
          ))}
        </ul>
      </CollapsibleSection>
    </div>
  );
}
