"use client";

import {
  EVENT_DETAIL_MOBILE_PARTICIPANTS_TITLE,
  EVENT_DETAIL_MOBILE_PARTICIPANTS_VIEW_ALL,
  formatEventMobileParticipantsLine,
} from "@yunicity/utils";
import { Plus } from "lucide-react";

type EventMobileDetailParticipantsProps = {
  interestCount: number;
};

/** Section participants intéressés mobile (MOBILE-SORTIR-02). */
export function EventMobileDetailParticipants({ interestCount }: EventMobileDetailParticipantsProps) {
  const line = formatEventMobileParticipantsLine(interestCount);
  const overflowCount = Math.max(interestCount - 5, 0);
  const visibleSlots = Math.min(interestCount, 5);

  return (
    <section className="space-y-3 px-4" aria-label={EVENT_DETAIL_MOBILE_PARTICIPANTS_TITLE}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-neutral-900">{EVENT_DETAIL_MOBILE_PARTICIPANTS_TITLE}</h2>
        <button
          type="button"
          disabled
          title="Liste complète — bientôt disponible"
          className="text-sm font-semibold text-yunicity-primary opacity-60"
        >
          {EVENT_DETAIL_MOBILE_PARTICIPANTS_VIEW_ALL}
        </button>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center">
          {visibleSlots > 0
            ? Array.from({ length: visibleSlots }, (_, index) => (
                <span
                  key={index}
                  className="relative -ml-2 first:ml-0 inline-flex h-10 w-10 rounded-full border-2 border-white bg-gradient-to-br from-violet-200 to-violet-500"
                >
                  <span className="absolute -bottom-0.5 -right-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full border border-white bg-white text-yunicity-primary">
                    <Plus className="h-2.5 w-2.5" strokeWidth={3} aria-hidden />
                  </span>
                </span>
              ))
            : null}
          {overflowCount > 0 ? (
            <span className="-ml-2 inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-neutral-100 text-xs font-bold text-neutral-600">
              +{overflowCount}
            </span>
          ) : null}
        </div>
        <p className="text-sm font-medium text-neutral-700">{line}</p>
      </div>
    </section>
  );
}
