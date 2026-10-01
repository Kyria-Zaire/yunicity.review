"use client";

import type { OrganizationMeItem } from "@yunicity/types";
import type { EventCreateDraft } from "@yunicity/utils";
import { EventCreateDesktopChecklist } from "@/components/events/create/desktop/event-create-desktop-checklist";
import {
  EVENT_CREATE_PREVIEW_AUTO,
  EVENT_CREATE_PREVIEW_CTA,
  EVENT_CREATE_PREVIEW_DATE_TBD,
  EVENT_CREATE_PREVIEW_MODE_CARD,
  EVENT_CREATE_PREVIEW_MODE_DETAIL,
  EVENT_CREATE_PREVIEW_PLACE_TBD,
  EVENT_CREATE_PREVIEW_TITLE,
  EVENT_CREATE_PREVIEW_VISUAL_PLACEHOLDER,
  resolveEventCreateCategory,
} from "@yunicity/utils";
import { BadgeCheck, CalendarDays, ImageIcon, Info, MapPin } from "lucide-react";
import { useState } from "react";

const BADGE_CLASS = {
  culture: "bg-violet-100 text-violet-700",
  music: "bg-pink-100 text-pink-700",
  food: "bg-orange-100 text-orange-700",
  local: "bg-emerald-100 text-emerald-700",
  default: "bg-neutral-100 text-neutral-600",
} as const;

type EventCreateMediumBottomRailProps = {
  draft: EventCreateDraft;
  organization: OrganizationMeItem | null;
};

export function EventCreateMediumBottomRail({ draft, organization }: EventCreateMediumBottomRailProps) {
  const [mode, setMode] = useState<"card" | "detail">("card");
  const category = resolveEventCreateCategory(draft.categoryId);
  const title = draft.title.trim() || "Titre de l'événement";
  const description =
    draft.description.trim() || "Votre description apparaîtra ici dans les cartes de découverte.";
  const badgeLabel = category?.badgeLabel ?? "SORTIE";
  const badgeTone = category?.badgeTone ?? "default";

  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_17.5rem]" data-event-create-medium-rail="">
      <div
        className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm sm:p-5"
        data-event-create-preview=""
      >
        <div className="flex items-center justify-between gap-3">
          <p className="inline-flex items-center gap-1.5 text-sm font-bold text-neutral-900">
            {EVENT_CREATE_PREVIEW_TITLE}
            <Info className="h-3.5 w-3.5 text-neutral-400" aria-hidden />
          </p>
          <div className="inline-flex rounded-lg border border-neutral-200 bg-neutral-50 p-0.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setMode("card")}
              className={`rounded-md px-2.5 py-1 transition ${
                mode === "card" ? "bg-white text-yunicity-primary shadow-sm" : "text-neutral-500"
              }`}
            >
              {EVENT_CREATE_PREVIEW_MODE_CARD}
            </button>
            <button
              type="button"
              onClick={() => setMode("detail")}
              className={`rounded-md px-2.5 py-1 transition ${
                mode === "detail" ? "bg-white text-yunicity-primary shadow-sm" : "text-neutral-500"
              }`}
            >
              {EVENT_CREATE_PREVIEW_MODE_DETAIL}
            </button>
          </div>
        </div>

        <article className="mt-4 overflow-hidden rounded-2xl border border-neutral-200/90 bg-white">
          <div className="grid sm:grid-cols-[9.5rem_minmax(0,1fr)]">
            <div className="relative flex min-h-[9.5rem] items-center justify-center bg-[#EEF0FF] sm:min-h-full">
              {draft.coverImageUrl.trim() ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={draft.coverImageUrl.trim()} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2 px-3 py-6 text-center text-neutral-500">
                  <ImageIcon className="h-7 w-7 text-neutral-400" aria-hidden />
                  <p className="text-[11px] font-medium leading-snug">
                    {EVENT_CREATE_PREVIEW_VISUAL_PLACEHOLDER}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2.5 p-4">
              <span
                className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${BADGE_CLASS[badgeTone]}`}
              >
                {badgeLabel}
              </span>
              <h3 className="text-base font-bold leading-snug text-neutral-900">{title}</h3>
              <p className="line-clamp-2 text-sm leading-relaxed text-neutral-600">{description}</p>
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
                <div className="flex items-center gap-2 border-t border-neutral-100 pt-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-yunicity-primary/10 text-[9px] font-bold text-yunicity-primary">
                    {organization.name.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="inline-flex min-w-0 items-center gap-1 text-xs font-semibold text-neutral-800">
                    <span className="truncate">{organization.name}</span>
                    {organization.verification_status === "verified" ? (
                      <BadgeCheck
                        className="h-3.5 w-3.5 shrink-0 text-yunicity-primary"
                        aria-label="Organisation vérifiée"
                      />
                    ) : null}
                  </span>
                </div>
              ) : null}
              <button
                type="button"
                disabled
                className="w-full rounded-xl bg-neutral-100 px-3 py-2 text-sm font-semibold text-neutral-400"
              >
                {EVENT_CREATE_PREVIEW_CTA}
              </button>
            </div>
          </div>
        </article>

        <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-neutral-500">
          <Info className="h-3.5 w-3.5" aria-hidden />
          {EVENT_CREATE_PREVIEW_AUTO}
        </p>

        {mode === "detail" ? <p className="sr-only">Mode détail — aperçu enrichi à venir.</p> : null}
      </div>

      <EventCreateDesktopChecklist draft={draft} />
    </section>
  );
}
