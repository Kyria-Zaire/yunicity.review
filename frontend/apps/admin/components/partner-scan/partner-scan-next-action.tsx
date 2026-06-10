import type { PartnerScanNextAction as PartnerScanNextActionModel } from "@yunicity/utils";
import { ArrowRight, Compass } from "lucide-react";

interface PartnerScanNextActionProps {
  action: PartnerScanNextActionModel;
  disabled?: boolean;
  onAction: (action: PartnerScanNextActionModel["action"]) => void;
}

export function PartnerScanNextAction({
  action,
  disabled = false,
  onAction,
}: PartnerScanNextActionProps) {
  return (
    <section
      className="flex flex-col gap-3 rounded-xl border border-yunicity-primary/15 bg-yunicity-primary-soft/25 px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between"
      aria-labelledby="partner-scan-next-action-title"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-yunicity-primary shadow-sm">
          <Compass className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-yunicity-primary">
            Prochaine action
          </p>
          <h2 id="partner-scan-next-action-title" className="text-sm font-semibold text-stone-950">
            {action.title}
          </h2>
          <p className="text-sm text-stone-600">{action.description}</p>
        </div>
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onAction(action.action)}
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-yunicity-primary px-5 py-3 text-sm font-semibold text-white shadow-sm hover:opacity-95 disabled:opacity-60"
      >
        {action.ctaLabel}
        <ArrowRight className="h-4 w-4" aria-hidden />
      </button>
    </section>
  );
}
