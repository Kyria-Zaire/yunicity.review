import type { PassportOpsSignal as PassportOpsSignalData } from "@yunicity/utils";
import { AlertTriangle, CheckCircle2, Sparkles } from "lucide-react";

const SIGNAL_STYLES = {
  empty: {
    container: "border-stone-200 bg-stone-50/80 ring-1 ring-stone-100",
    icon: "bg-stone-100 text-stone-600",
  },
  active: {
    container: "border-emerald-200 bg-emerald-50/80 ring-1 ring-emerald-100",
    icon: "bg-emerald-100 text-emerald-700",
  },
  attention: {
    container: "border-amber-200 bg-amber-50/80 ring-1 ring-amber-100",
    icon: "bg-amber-100 text-amber-800",
  },
} as const;

function SignalIcon({ type }: { type: PassportOpsSignalData["type"] }) {
  const className = "h-5 w-5";
  switch (type) {
    case "empty":
      return <Sparkles className={className} aria-hidden />;
    case "active":
      return <CheckCircle2 className={className} aria-hidden />;
    case "attention":
      return <AlertTriangle className={className} aria-hidden />;
  }
}

export function PassportOpsSignal({ signal }: { signal: PassportOpsSignalData }) {
  const styles = SIGNAL_STYLES[signal.type];

  return (
    <section
      className={`rounded-2xl border px-4 py-4 shadow-sm sm:px-5 ${styles.container}`}
      aria-labelledby="passport-ops-signal-title"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">
        Signal programme
      </p>
      <div className="mt-2 flex items-start gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${styles.icon}`}
        >
          <SignalIcon type={signal.type} />
        </span>
        <div>
          <h2 id="passport-ops-signal-title" className="text-base font-bold text-stone-950">
            {signal.title}
          </h2>
          <p className="mt-1 text-sm text-stone-700">{signal.description}</p>
        </div>
      </div>
    </section>
  );
}
