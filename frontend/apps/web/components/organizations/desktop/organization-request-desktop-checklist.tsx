"use client";

import type { OrganizationRequestDraft } from "@yunicity/utils";
import {
  ORG_REQUEST_CHECKLIST_ADDRESS,
  ORG_REQUEST_CHECKLIST_IDENTITY,
  ORG_REQUEST_CHECKLIST_NO_ERRORS,
  ORG_REQUEST_CHECKLIST_PRACTICAL,
  ORG_REQUEST_CHECKLIST_REVIEW,
  ORG_REQUEST_CHECKLIST_TITLE,
  ORG_REQUEST_CHECKLIST_VISUAL,
  organizationRequestChecklistState,
} from "@yunicity/utils";
import { CheckCircle2, Circle } from "lucide-react";

type OrganizationRequestDesktopChecklistProps = {
  draft: OrganizationRequestDraft;
};

const ITEMS = [
  { key: "identity", label: ORG_REQUEST_CHECKLIST_IDENTITY },
  { key: "address", label: ORG_REQUEST_CHECKLIST_ADDRESS },
  { key: "practical", label: ORG_REQUEST_CHECKLIST_PRACTICAL },
  { key: "visual", label: ORG_REQUEST_CHECKLIST_VISUAL },
  { key: "review", label: ORG_REQUEST_CHECKLIST_REVIEW },
] as const;

export function OrganizationRequestDesktopChecklist({
  draft,
}: OrganizationRequestDesktopChecklistProps) {
  const state = organizationRequestChecklistState(draft);

  return (
    <section
      className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm"
      data-org-request-desktop-checklist=""
    >
      <h2 className="text-sm font-bold text-neutral-900">{ORG_REQUEST_CHECKLIST_TITLE}</h2>
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
        {ORG_REQUEST_CHECKLIST_NO_ERRORS}
      </p>
    </section>
  );
}
