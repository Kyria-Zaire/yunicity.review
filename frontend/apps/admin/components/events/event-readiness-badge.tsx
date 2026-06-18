"use client";

import type { EventReadinessLevel } from "@yunicity/types";
import { eventReadinessLabel } from "@yunicity/utils";

const STYLES: Record<EventReadinessLevel, string> = {
  ready: "bg-emerald-50 text-emerald-800 border-emerald-200",
  partial: "bg-amber-50 text-amber-900 border-amber-200",
  not_ready: "bg-rose-50 text-rose-800 border-rose-200",
};

export function EventReadinessBadge({
  readiness,
  className = "",
}: {
  readiness: EventReadinessLevel;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STYLES[readiness]} ${className}`}
    >
      {eventReadinessLabel(readiness)}
    </span>
  );
}
