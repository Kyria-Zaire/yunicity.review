"use client";

import type { EventReadinessFields } from "@yunicity/types";
import { Check, AlertTriangle, X } from "lucide-react";

import { EventReadinessBadge } from "@/components/events/event-readiness-badge";

function CheckIcon({ passed, severity }: { passed: boolean; severity: string }) {
  if (passed) {
    return <Check className="h-4 w-4 text-emerald-600" aria-hidden />;
  }
  if (severity === "warning") {
    return <AlertTriangle className="h-4 w-4 text-amber-600" aria-hidden />;
  }
  return <X className="h-4 w-4 text-rose-600" aria-hidden />;
}

export function EventTerritoryContributionPanel({
  readiness,
}: {
  readiness: EventReadinessFields;
}) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-stone-50 p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
          Vitalité territoriale
        </h2>
        <EventReadinessBadge readiness={readiness.readiness} />
      </div>
      <p
        className={`mt-3 text-sm font-medium ${
          readiness.contributes_to_territory ? "text-emerald-900" : "text-amber-900"
        }`}
      >
        {readiness.territory_contribution_label}
      </p>
      <ul className="mt-4 space-y-2">
        {readiness.checks.map((check) => (
          <li key={check.key} className="flex items-start gap-2 text-sm text-stone-800">
            <CheckIcon passed={check.passed} severity={check.severity} />
            <span>{check.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
