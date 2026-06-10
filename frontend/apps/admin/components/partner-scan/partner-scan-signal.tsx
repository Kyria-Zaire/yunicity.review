import type { PartnerScanSignal as PartnerScanSignalModel } from "@yunicity/utils";

const SIGNAL_DOT: Record<PartnerScanSignalModel["phase"], string> = {
  idle: "bg-emerald-500",
  resolving: "bg-amber-500",
  resolved: "bg-sky-500",
  redeemed: "bg-emerald-500",
  error: "bg-rose-500",
};

const SIGNAL_CONTAINER: Record<PartnerScanSignalModel["phase"], string> = {
  idle: "border-emerald-200 bg-emerald-50/60",
  resolving: "border-amber-200 bg-amber-50/60",
  resolved: "border-sky-200 bg-sky-50/60",
  redeemed: "border-emerald-200 bg-emerald-50/60",
  error: "border-rose-200 bg-rose-50/60",
};

export function PartnerScanSignal({ signal }: { signal: PartnerScanSignalModel }) {
  return (
    <section
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 shadow-sm ${SIGNAL_CONTAINER[signal.phase]}`}
      aria-live="polite"
      aria-labelledby="partner-scan-signal-title"
    >
      <span
        className={`h-3 w-3 shrink-0 rounded-full ${SIGNAL_DOT[signal.phase]}`}
        aria-hidden
      />
      <div className="min-w-0">
        <h2 id="partner-scan-signal-title" className="text-sm font-semibold text-stone-950">
          {signal.title}
        </h2>
        <p className="text-sm text-stone-600">{signal.description}</p>
      </div>
    </section>
  );
}
