"use client";

import type { TribeCreateDraft } from "@yunicity/utils";
import {
  TRIBE_CREATE_DESKTOP_CHECKLIST_ACCESS,
  TRIBE_CREATE_DESKTOP_CHECKLIST_CHARTER,
  TRIBE_CREATE_DESKTOP_CHECKLIST_IDENTITY,
  TRIBE_CREATE_DESKTOP_CHECKLIST_NO_ERRORS,
  TRIBE_CREATE_DESKTOP_CHECKLIST_TITLE,
  TRIBE_CREATE_DESKTOP_CHECKLIST_VISUALS,
  tribeCreateBlockingErrorCount,
  tribeCreateChecklistState,
} from "@yunicity/utils";
import { CheckCircle2, Circle } from "lucide-react";

type TribeCreateDesktopChecklistProps = {
  draft: TribeCreateDraft;
};

const ITEMS = [
  { key: "identity", label: TRIBE_CREATE_DESKTOP_CHECKLIST_IDENTITY },
  { key: "access", label: TRIBE_CREATE_DESKTOP_CHECKLIST_ACCESS },
  { key: "charter", label: TRIBE_CREATE_DESKTOP_CHECKLIST_CHARTER },
  { key: "visuals", label: TRIBE_CREATE_DESKTOP_CHECKLIST_VISUALS },
] as const;

export function TribeCreateDesktopChecklist({ draft }: TribeCreateDesktopChecklistProps) {
  const state = tribeCreateChecklistState(draft);
  const blockingErrors = tribeCreateBlockingErrorCount(draft);

  return (
    <section
      className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm"
      data-tribe-create-checklist=""
    >
      <h2 className="text-sm font-bold text-neutral-900">{TRIBE_CREATE_DESKTOP_CHECKLIST_TITLE}</h2>
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
        {blockingErrors === 0
          ? TRIBE_CREATE_DESKTOP_CHECKLIST_NO_ERRORS
          : `${blockingErrors} erreur${blockingErrors > 1 ? "s" : ""} bloquante${blockingErrors > 1 ? "s" : ""}`}
      </p>
    </section>
  );
}
