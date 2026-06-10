import type { PassportOpsSignal as PassportOpsSignalData } from "@yunicity/utils";

const SIGNAL_DOT: Record<PassportOpsSignalData["type"], string> = {
  empty: "bg-stone-400",
  active: "bg-emerald-500",
  attention: "bg-amber-500",
};

const SIGNAL_CONTAINER: Record<PassportOpsSignalData["type"], string> = {
  empty: "border-stone-200 bg-stone-50/80",
  active: "border-emerald-200 bg-emerald-50/60",
  attention: "border-amber-200 bg-amber-50/60",
};

export function PassportOpsSignal({ signal }: { signal: PassportOpsSignalData }) {
  return (
    <section
      className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 shadow-sm ${SIGNAL_CONTAINER[signal.type]}`}
      aria-labelledby="passport-ops-signal-title"
    >
      <span
        className={`h-2.5 w-2.5 shrink-0 rounded-full ${SIGNAL_DOT[signal.type]}`}
        aria-hidden
      />
      <div className="min-w-0">
        <h2 id="passport-ops-signal-title" className="text-sm font-semibold text-stone-950">
          {signal.title}
        </h2>
        <p className="text-xs text-stone-600">{signal.description}</p>
      </div>
    </section>
  );
}
