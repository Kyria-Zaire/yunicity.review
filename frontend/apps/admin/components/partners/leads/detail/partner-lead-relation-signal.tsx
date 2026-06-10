import type { PartnerLeadRelationSignal, PartnerLeadRelationSignalType } from "@yunicity/utils";
import { AlertTriangle, Archive, CheckCircle2, Info, Radio } from "lucide-react";

const SIGNAL_STYLES: Record<
  PartnerLeadRelationSignalType,
  { container: string; icon: string }
> = {
  info: {
    container: "border-sky-200 bg-sky-50/80 ring-1 ring-sky-100",
    icon: "bg-sky-100 text-sky-700",
  },
  active: {
    container: "border-emerald-200 bg-emerald-50/80 ring-1 ring-emerald-100",
    icon: "bg-emerald-100 text-emerald-700",
  },
  success: {
    container: "border-emerald-200 bg-emerald-50/80 ring-1 ring-emerald-100",
    icon: "bg-emerald-100 text-emerald-700",
  },
  warning: {
    container: "border-amber-200 bg-amber-50/80 ring-1 ring-amber-100",
    icon: "bg-amber-100 text-amber-800",
  },
  neutral: {
    container: "border-stone-200 bg-stone-50/80 ring-1 ring-stone-100",
    icon: "bg-stone-100 text-stone-600",
  },
  blocked: {
    container: "border-rose-200 bg-rose-50/80 ring-1 ring-rose-100",
    icon: "bg-rose-100 text-rose-800",
  },
};

function SignalIcon({ type }: { type: PartnerLeadRelationSignalType }) {
  const className = "h-5 w-5";
  switch (type) {
    case "info":
      return <Info className={className} aria-hidden />;
    case "active":
    case "success":
      return <CheckCircle2 className={className} aria-hidden />;
    case "warning":
      return <AlertTriangle className={className} aria-hidden />;
    case "neutral":
      return <Archive className={className} aria-hidden />;
    case "blocked":
      return <Radio className={className} aria-hidden />;
  }
}

export function PartnerLeadRelationSignal({ signal }: { signal: PartnerLeadRelationSignal }) {
  const styles = SIGNAL_STYLES[signal.type];

  return (
    <section
      className={`rounded-2xl border px-4 py-4 shadow-sm sm:px-5 ${styles.container}`}
      aria-labelledby="partner-lead-relation-signal-title"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">
        Signal relation
      </p>
      <div className="mt-2 flex items-start gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${styles.icon}`}
        >
          <SignalIcon type={signal.type} />
        </span>
        <div>
          <h2
            id="partner-lead-relation-signal-title"
            className="text-base font-bold text-stone-950"
          >
            {signal.title}
          </h2>
          <p className="mt-1 text-sm text-stone-700">{signal.description}</p>
        </div>
      </div>
    </section>
  );
}
