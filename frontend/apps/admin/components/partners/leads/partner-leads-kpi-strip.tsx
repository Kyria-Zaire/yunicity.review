import type { PartnerLeadKpiCard } from "@yunicity/utils";
import { Clock3, Flame, UserCheck, Users } from "lucide-react";

const TONE_STYLES = {
  primary: { icon: "bg-yunicity-primary-soft text-yunicity-primary" },
  success: { icon: "bg-emerald-50 text-emerald-700" },
  warning: { icon: "bg-amber-50 text-amber-700" },
  info: { icon: "bg-sky-50 text-sky-700" },
  neutral: { icon: "bg-stone-100 text-stone-600" },
} as const;

function KpiIcon({ id }: { id: string }) {
  const className = "h-4 w-4";
  switch (id) {
    case "total":
      return <Users className={className} aria-hidden />;
    case "followup":
      return <Clock3 className={className} aria-hidden />;
    case "hot":
      return <Flame className={className} aria-hidden />;
    case "converted":
      return <UserCheck className={className} aria-hidden />;
    default:
      return <Users className={className} aria-hidden />;
  }
}

export function PartnerLeadsKpiStrip({ cards }: { cards: PartnerLeadKpiCard[] }) {
  return (
    <section
      className="grid grid-cols-2 gap-2 lg:grid-cols-4"
      aria-label="Indicateurs focus pipeline"
    >
      {cards.map((card) => {
        const styles = TONE_STYLES[card.tone];
        return (
          <article
            key={card.id}
            className="rounded-xl border border-stone-200/80 bg-white px-3 py-2.5 shadow-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-stone-500">{card.label}</p>
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${styles.icon}`}
              >
                <KpiIcon id={card.id} />
              </span>
            </div>
            <p className="mt-1 text-xl font-bold tracking-tight text-stone-950 tabular-nums">
              {card.value}
            </p>
            <p className="text-[11px] text-stone-500">{card.hint}</p>
          </article>
        );
      })}
    </section>
  );
}
