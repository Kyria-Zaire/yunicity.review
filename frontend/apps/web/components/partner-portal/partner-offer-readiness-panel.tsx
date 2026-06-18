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

export function PartnerOfferReadinessPanel({
  readiness,
  title = "État de préparation",
}: {
  readiness: PartnerOfferReadinessFields;
  title?: string;
}) {
  return (
    <section className="rounded-2xl border border-neutral-200/90 bg-neutral-50/80 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-neutral-900">{title}</h3>
        <span className="text-xs font-medium text-neutral-600">
          {readiness.value_category_label}
          {readiness.is_passport_eligible ? " · Éligible Passport" : ""}
        </span>
      </div>
      <ul className="space-y-2">
        {readiness.checks.map((check) => (
          <li key={check.key} className="flex items-start gap-2 text-sm text-neutral-800">
            <CheckIcon passed={check.passed} severity={check.severity} />
            <span className={check.passed ? "" : "font-medium"}>{check.label}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs leading-relaxed text-neutral-600">{readiness.human_description}</p>
    </section>
  );
}
