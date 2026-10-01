"use client";

import type { OrganizationMeItem } from "@yunicity/types";
import type { EventCreateDraft } from "@yunicity/utils";
import {
  EVENT_CREATE_CHECKLIST_NO_ERRORS,
  EVENT_CREATE_MOBILE_CHECKLIST_PROGRESS,
  EVENT_CREATE_PREVIEW_AUTO,
  EVENT_CREATE_PREVIEW_DATE_TBD,
  EVENT_CREATE_PREVIEW_PLACE_TBD,
  EVENT_CREATE_PREVIEW_TITLE,
  EVENT_CREATE_PREVIEW_VISUAL_PLACEHOLDER,
  eventCreateChecklistProgress,
  resolveEventCreateCategory,
} from "@yunicity/utils";
import {
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ImageIcon,
  Info,
  MapPin,
} from "lucide-react";
import { useState } from "react";

const BADGE_CLASS = {
  culture: "bg-violet-100 text-violet-700",
  music: "bg-pink-100 text-pink-700",
  food: "bg-orange-100 text-orange-700",
  local: "bg-emerald-100 text-emerald-700",
  default: "bg-neutral-100 text-neutral-600",
} as const;

function ChecklistProgressRing({ completed, total }: { completed: number; total: number }) {
  const ratio = total > 0 ? completed / total : 0;
  const degrees = Math.round(ratio * 360);

  return (
    <span
      className="relative inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
      style={{
        background: `conic-gradient(var(--yunicity-primary, #4f46e5) ${degrees}deg, #e5e7eb ${degrees}deg)`,
      }}
      aria-hidden
    >
      <span className="absolute inset-[3px] rounded-full bg-white" />
    </span>
  );
}

type EventCreateMobilePreviewProps = {
  draft: EventCreateDraft;
  organization: OrganizationMeItem | null;
};

export function EventCreateMobilePreview({ draft, organization }: EventCreateMobilePreviewProps) {
  const [expanded, setExpanded] = useState(true);
  const category = resolveEventCreateCategory(draft.categoryId);
  const title = draft.title.trim() || "Titre de l'événement";
  const description =
    draft.description.trim() || "Votre description apparaîtra ici dans les cartes de découverte.";
  const badgeLabel = category?.badgeLabel ?? "SORTIE";
  const badgeTone = category?.badgeTone ?? "default";
  const { completed, total } = eventCreateChecklistProgress(draft);

  return (
    <section
      className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm"
      data-event-create-mobile-preview=""
    >
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
        aria-expanded={expanded}
      >
        <span className="inline-flex items-center gap-1.5 text-sm font-bold text-neutral-900">
          {EVENT_CREATE_PREVIEW_TITLE}
          <Info className="h-3.5 w-3.5 text-neutral-400" aria-hidden />
        </span>
        {expanded ? (
          <ChevronUp className="h-5 w-5 text-neutral-400" aria-hidden />
        ) : (
          <ChevronDown className="h-5 w-5 text-neutral-400" aria-hidden />
        )}
      </button>

      {expanded ? (
        <div className="border-t border-neutral-100 px-4 pb-4 pt-3">
          <div className="overflow-hidden rounded-xl border border-neutral-200/90 bg-white">
            <div className="flex min-h-[7.5rem] items-center justify-center bg-[#EEF0FF]">
              {draft.coverImageUrl.trim() ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={draft.coverImageUrl.trim()} alt="" className="h-32 w-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2 px-4 py-6 text-center text-neutral-500">
                  <ImageIcon className="h-8 w-8 text-neutral-400" aria-hidden />
                  <p className="text-xs font-medium">{EVENT_CREATE_PREVIEW_VISUAL_PLACEHOLDER}</p>
                </div>
              )}
            </div>
            <div className="space-y-2 p-4">
              <span
                className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${BADGE_CLASS[badgeTone]}`}
              >
                {badgeLabel}
              </span>
              <h3 className="text-base font-bold leading-snug text-neutral-900">{title}</h3>
              <p className="text-sm leading-relaxed text-neutral-600">{description}</p>
              <div className="space-y-1.5 pt-1 text-sm text-neutral-600">
                <p className="inline-flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
                  {draft.startsAt.trim()
                    ? draft.startsAt.replace("T", " · ")
                    : EVENT_CREATE_PREVIEW_DATE_TBD}
                </p>
                <p className="inline-flex items-center gap-2">
                  <MapPin className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
                  {draft.locationName.trim() || EVENT_CREATE_PREVIEW_PLACE_TBD}
                </p>
              </div>
              {organization ? (
                <div className="flex items-center gap-2 border-t border-neutral-100 pt-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-yunicity-primary/10 text-[10px] font-bold text-yunicity-primary">
                    {organization.name.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="inline-flex min-w-0 items-center gap-1 text-sm font-semibold text-neutral-800">
                    <span className="truncate">{organization.name}</span>
                    {organization.verification_status === "verified" ? (
                      <BadgeCheck
                        className="h-4 w-4 shrink-0 text-yunicity-primary"
                        aria-label="Organisation vérifiée"
                      />
                    ) : null}
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-neutral-500">
            <Info className="h-3.5 w-3.5" aria-hidden />
            {EVENT_CREATE_PREVIEW_AUTO}
          </p>

          <div className="mt-4 flex items-center justify-between gap-3 border-t border-neutral-100 pt-3">
            <p className="inline-flex items-center gap-2 text-xs font-medium text-neutral-700">
              <ChecklistProgressRing completed={completed} total={total} />
              {EVENT_CREATE_MOBILE_CHECKLIST_PROGRESS(completed, total)}
            </p>
            <p className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
              <CheckCircle2 className="h-4 w-4" aria-hidden />
              {EVENT_CREATE_CHECKLIST_NO_ERRORS}
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
