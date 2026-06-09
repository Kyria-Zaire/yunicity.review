import type { AdminCockpitAttention } from "@yunicity/types";
import {
  buildCockpitYunicitySignal,
  formatCockpitLastCheckTime,
  type CockpitYunicitySignalLevel,
} from "@yunicity/utils";
import { AlertOctagon, AlertTriangle, ShieldCheck } from "lucide-react";

const SIGNAL_STYLES: Record<
  CockpitYunicitySignalLevel,
  { container: string; icon: string; dot: string }
> = {
  serene: {
    container: "border-emerald-300/70 bg-emerald-50/90 ring-1 ring-emerald-200/50",
    icon: "bg-emerald-100 text-emerald-700",
    dot: "bg-emerald-500",
  },
  vigilance: {
    container: "border-amber-300/70 bg-amber-50/90 ring-1 ring-amber-200/50",
    icon: "bg-amber-100 text-amber-800",
    dot: "bg-amber-500",
  },
  intervention: {
    container: "border-rose-300/70 bg-rose-50/90 ring-1 ring-rose-200/50",
    icon: "bg-rose-100 text-rose-700",
    dot: "bg-rose-600",
  },
};

function SignalIcon({ level }: { level: CockpitYunicitySignalLevel }) {
  const className = "h-7 w-7";
  switch (level) {
    case "serene":
      return <ShieldCheck className={className} aria-hidden />;
    case "vigilance":
      return <AlertTriangle className={className} aria-hidden />;
    case "intervention":
      return <AlertOctagon className={className} aria-hidden />;
  }
}

interface CockpitYunicitySignalProps {
  city: string;
  attention: AdminCockpitAttention;
  usersActive: number;
  lastCheckedAt?: string;
}

export function CockpitYunicitySignal({
  city,
  attention,
  usersActive,
  lastCheckedAt,
}: CockpitYunicitySignalProps) {
  const signal = buildCockpitYunicitySignal({ city, attention, usersActive });
  const styles = SIGNAL_STYLES[signal.level];

  return (
    <section
      className={`rounded-2xl border px-4 py-4 shadow-md transition-shadow duration-200 hover:shadow-lg sm:px-5 sm:py-5 ${styles.container}`}
      aria-labelledby="cockpit-signal-title"
      aria-live="polite"
    >
      <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-500">
        Signal Yunicity
      </p>
      <div className="mt-2 flex items-start gap-4">
        <span
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl shadow-sm ${styles.icon}`}
        >
          <SignalIcon level={signal.level} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${styles.dot}`} aria-hidden />
            <h2 id="cockpit-signal-title" className="text-lg font-bold tracking-tight text-stone-950 sm:text-xl">
              {signal.title}
            </h2>
          </div>
          <p className="mt-1.5 text-sm font-medium leading-snug text-stone-900 sm:text-base">
            {signal.headline}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-stone-700">{signal.secondaryLine}</p>
          {lastCheckedAt ? (
            <p className="mt-2 text-xs text-stone-500">
              Dernière vérification : {formatCockpitLastCheckTime(lastCheckedAt)}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
