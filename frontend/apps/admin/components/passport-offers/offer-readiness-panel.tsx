"use client";

import type { PartnerOfferReadinessFields } from "@yunicity/types";
import { Check, AlertTriangle, X } from "lucide-react";

function CheckIcon({ passed, severity }: { passed: boolean; severity: string }) {
  if (passed) {
    return <Check className="h-4 w-4 text-emerald-600" aria-hidden />;
  }
  if (severity === "warning") {
    return <AlertTriangle className="h-4 w-4 text-amber-600" aria-hidden />;
  }
  return <X className="h-4 w-4 text-rose-600" aria-hidden />;
}

export function OfferReadinessPanel({
  readiness,
}: {
  readiness: PartnerOfferReadinessFields;
}) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-stone-50 p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
        Préparation catalogue
      </h2>
      <ul className="mt-4 space-y-2">
        {readiness.checks.map((check) => (
          <li key={check.key} className="flex items-start gap-2 text-sm text-stone-800">
            <CheckIcon passed={check.passed} severity={check.severity} />
            <span>{check.label}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs leading-relaxed text-stone-600">{readiness.human_description}</p>
    </section>
  );
}
