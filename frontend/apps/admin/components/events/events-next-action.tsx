import type { EventsAgendaNextAction } from "@yunicity/utils";
import { ArrowRight, Compass } from "lucide-react";
import Link from "next/link";

export function EventsNextAction({ action }: { action: EventsAgendaNextAction }) {
  return (
    <section
      className="flex flex-col gap-3 rounded-xl border border-yunicity-primary/15 bg-yunicity-primary-soft/25 px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between"
      aria-labelledby="events-next-action-title"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-yunicity-primary shadow-sm">
          <Compass className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-yunicity-primary">
            Prochaine action
          </p>
          <h2 id="events-next-action-title" className="text-sm font-semibold text-stone-950">
            {action.title}
          </h2>
          <p className="text-xs text-stone-600">{action.description}</p>
        </div>
      </div>
      <Link
        href={action.href}
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-yunicity-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-95"
      >
        {action.ctaLabel}
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </section>
  );
}
