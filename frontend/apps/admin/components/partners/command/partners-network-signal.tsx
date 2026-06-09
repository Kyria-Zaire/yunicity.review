import type { AdminPartnersWorkspaceSummary } from "@yunicity/types";
import { partnersNetworkSignal, type PartnersNetworkSignalType } from "@yunicity/utils";
import { AlertTriangle, CheckCircle2, Radio } from "lucide-react";

const SIGNAL_STYLES: Record<
  PartnersNetworkSignalType,
  { container: string; icon: string; dot: string }
> = {
  success: {
    container: "border-emerald-200 bg-emerald-50/80 ring-1 ring-emerald-100",
    icon: "bg-emerald-100 text-emerald-700",
    dot: "bg-emerald-500",
  },
  warning: {
    container: "border-amber-200 bg-amber-50/80 ring-1 ring-amber-100",
    icon: "bg-amber-100 text-amber-800",
    dot: "bg-amber-500",
  },
  critical: {
    container: "border-rose-200 bg-rose-50/80 ring-1 ring-rose-100",
    icon: "bg-rose-100 text-rose-800",
    dot: "bg-rose-500",
  },
};

function SignalIcon({ type }: { type: PartnersNetworkSignalType }) {
  const className = "h-6 w-6";
  switch (type) {
    case "success":
      return <CheckCircle2 className={className} aria-hidden />;
    case "warning":
      return <AlertTriangle className={className} aria-hidden />;
    case "critical":
      return <Radio className={className} aria-hidden />;
  }
}

function formatSignalUpdatedAt(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function PartnersNetworkSignal({
  summary,
}: {
  summary: AdminPartnersWorkspaceSummary;
}) {
  const signal = partnersNetworkSignal(summary);
  const styles = SIGNAL_STYLES[signal.type];

  return (
    <section
      className={`rounded-2xl border px-4 py-4 shadow-sm sm:px-5 sm:py-5 ${styles.container}`}
      aria-labelledby="partners-network-signal-title"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">
        Signal réseau
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
              id="partners-network-signal-title"
              className="text-base font-bold tracking-tight text-stone-950 sm:text-lg"
            >
              {signal.title}
            </h2>
          </div>
          <p className="mt-1.5 whitespace-pre-line text-sm leading-snug text-stone-700">
            {signal.description}
          </p>
          <p className="mt-3 text-xs text-stone-500">
            Dernière mise à jour : {formatSignalUpdatedAt(signal.updatedAt)}
          </p>
        </div>
      </div>
    </section>
  );
}
