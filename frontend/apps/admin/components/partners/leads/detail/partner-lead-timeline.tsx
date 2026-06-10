import { formatDateTime } from "@/lib/format";
import type { PartnerLeadTimelineEvent } from "@yunicity/utils";
import { partnerLeadTimelineEmptyCopy } from "@yunicity/utils";

type PartnerLeadTimelineProps = {
  events: PartnerLeadTimelineEvent[];
  isMinimal: boolean;
};

export function PartnerLeadTimeline({ events, isMinimal }: PartnerLeadTimelineProps) {
  const empty = partnerLeadTimelineEmptyCopy();

  return (
    <section
      className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5"
      aria-labelledby="partner-lead-timeline-title"
    >
      <h2
        id="partner-lead-timeline-title"
        className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500"
      >
        Timeline relation
      </h2>

      {isMinimal ? (
        <div className="mt-4 rounded-xl border border-dashed border-stone-200 bg-stone-50/50 px-4 py-8 text-center">
          <p className="text-sm font-medium text-stone-800">{empty.title}</p>
          <p className="mt-1 text-sm text-stone-500">{empty.message}</p>
        </div>
      ) : (
        <ol className="relative mt-5 space-y-0 border-l border-stone-200 pl-4">
          {events.map((event, index) => (
            <li key={event.id} className={`relative pb-6 ${index === 0 ? "" : ""}`}>
              <span
                className="absolute -left-[1.35rem] top-1.5 h-2.5 w-2.5 rounded-full bg-yunicity-primary ring-4 ring-white"
                aria-hidden
              />
              <p className="text-sm font-semibold text-stone-900">{event.label}</p>
              {event.at ? (
                <p className="mt-0.5 text-xs text-stone-500">{formatDateTime(event.at)}</p>
              ) : null}
              <p
                className={`mt-1 text-sm leading-relaxed ${
                  event.kind === "notes" ? "whitespace-pre-wrap text-stone-700" : "text-stone-600"
                }`}
              >
                {event.detail}
              </p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
