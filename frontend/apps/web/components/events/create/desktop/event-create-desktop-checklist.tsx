"use client";

import type { EventCreateDraft } from "@yunicity/utils";
import {
  EVENT_CREATE_CHECKLIST_ESSENTIALS,
  EVENT_CREATE_CHECKLIST_NO_ERRORS,
  EVENT_CREATE_CHECKLIST_PRACTICAL,
  EVENT_CREATE_CHECKLIST_SCHEDULE,
  EVENT_CREATE_CHECKLIST_TITLE,
  EVENT_CREATE_CHECKLIST_VISUAL,
  eventCreateChecklistState,
} from "@yunicity/utils";
import { CheckCircle2, Circle } from "lucide-react";

type EventCreateDesktopChecklistProps = {
  draft: EventCreateDraft;
};

const ITEMS = [
  { key: "essentials", label: EVENT_CREATE_CHECKLIST_ESSENTIALS },
  { key: "schedule", label: EVENT_CREATE_CHECKLIST_SCHEDULE },
  { key: "visual", label: EVENT_CREATE_CHECKLIST_VISUAL },
  { key: "practical", label: EVENT_CREATE_CHECKLIST_PRACTICAL },
] as const;

export function EventCreateDesktopChecklist({ draft }: EventCreateDesktopChecklistProps) {
  const state = eventCreateChecklistState(draft);

  return (
    <section
      className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm"
      data-event-create-checklist=""
    >
      <h2 className="text-sm font-bold text-neutral-900">{EVENT_CREATE_CHECKLIST_TITLE}</h2>
      <ul className="mt-3 space-y-2.5">
        {ITEMS.map((item) => {
          const done = state[item.key];
          return (
            <li key={item.key} className="flex items-start gap-2 text-sm">
              {done ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden />
              ) : (
                <Circle className="mt-0.5 h-4 w-4 shrink-0 text-neutral-300" aria-hidden />
              )}
              <span className={done ? "font-medium text-neutral-800" : "text-neutral-500"}>
                {item.label}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
        {EVENT_CREATE_CHECKLIST_NO_ERRORS}
      </p>
    </section>
  );
}
