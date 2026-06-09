import type { PartnerLeadSignalResult, PartnerLeadSignalType } from "@yunicity/utils";
import { AlertTriangle, CheckCircle2, Radio, Sparkles } from "lucide-react";

const SIGNAL_STYLES: Record<
  PartnerLeadSignalType,
  { container: string; icon: string; dot: string }
> = {
  empty: {
    container: "border-stone-200 bg-stone-50/80 ring-1 ring-stone-100",
    icon: "bg-stone-100 text-stone-600",
    dot: "bg-stone-400",
  },
  active: {
    container: "border-emerald-200 bg-emerald-50/80 ring-1 ring-emerald-100",
    icon: "bg-emerald-100 text-emerald-700",
    dot: "bg-emerald-500",
  },
  followup: {
    container: "border-amber-200 bg-amber-50/80 ring-1 ring-amber-100",
    icon: "bg-amber-100 text-amber-800",
    dot: "bg-amber-500",
  },
  conversion: {
    container: "border-yunicity-primary/20 bg-yunicity-primary-soft/40 ring-1 ring-yunicity-primary/10",
    icon: "bg-yunicity-primary-soft text-yunicity-primary",
    dot: "bg-yunicity-primary",
  },
};

function SignalIcon({ type }: { type: PartnerLeadSignalType }) {
  const className = "h-6 w-6";
  switch (type) {
    case "empty":
      return <Sparkles className={className} aria-hidden />;
    case "active":
      return <CheckCircle2 className={className} aria-hidden />;
    case "followup":
      return <AlertTriangle className={className} aria-hidden />;
    case "conversion":
      return <Radio className={className} aria-hidden />;
  }
}

export function PartnerLeadsSignal({ signal }: { signal: PartnerLeadSignalResult }) {
  const styles = SIGNAL_STYLES[signal.type];

  return (
    <section
      className={`rounded-2xl border px-4 py-4 shadow-sm sm:px-5 sm:py-5 ${styles.container}`}
      aria-labelledby="partner-leads-signal-title"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">
        Pipeline terrain
      </p>
      <div className="mt-2 flex items-start gap-4">
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${styles.icon}`}
        >
          <SignalIcon type={signal.type} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${styles.dot}`} aria-hidden />
            <h2
              id="partner-leads-signal-title"
              className="text-base font-bold tracking-tight text-stone-950 sm:text-lg"
            >
              {signal.title}
            </h2>
          </div>
          <p className="mt-1.5 text-sm leading-snug text-stone-700">{signal.description}</p>
        </div>
      </div>
    </section>
  );
}
