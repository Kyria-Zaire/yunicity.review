import type { StaffSignal } from "@yunicity/utils";

export function StaffSignalBanner({ signal }: { signal: StaffSignal }) {
  return (
    <section
      className="flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-50/80 px-4 py-2.5 shadow-sm"
      aria-labelledby="staff-signal-title"
    >
      <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-yunicity-primary" aria-hidden />
      <div className="min-w-0">
        <h2 id="staff-signal-title" className="text-sm font-semibold text-stone-950">
          {signal.title}
        </h2>
        <p className="text-xs text-stone-600">{signal.description}</p>
      </div>
    </section>
  );
}
