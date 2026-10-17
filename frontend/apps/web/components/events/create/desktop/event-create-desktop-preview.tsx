"use client";

import type { OrganizationMeItem } from "@yunicity/types";
import type { EventCreateDraft } from "@yunicity/utils";
import {
  EVENT_CREATE_PREVIEW_AUTO,
  EVENT_CREATE_PREVIEW_CTA,
  EVENT_CREATE_PREVIEW_DATE_TBD,
  EVENT_CREATE_PREVIEW_MODE_CARD,
  EVENT_CREATE_PREVIEW_MODE_DETAIL,
  EVENT_CREATE_PREVIEW_PLACE_TBD,
  EVENT_CREATE_PREVIEW_TITLE,
  EVENT_CREATE_PREVIEW_VISUAL_PLACEHOLDER,
  EVENT_CREATE_TITLE_MAX,
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

type EventCreateDesktopPreviewProps = {
  draft: EventCreateDraft;
  organization: OrganizationMeItem | null;
};

export function EventCreateDesktopPreview({ draft, organization }: EventCreateDesktopPreviewProps) {
  const [mode, setMode] = useState<"card" | "detail">("card");
  const category = resolveEventCreateCategory(draft.categoryId);
  const title = draft.title.trim() || "Titre de l'événement";
  const description =
    draft.description.trim() || "Votre description apparaîtra ici dans les cartes de découverte.";
  const badgeLabel = category?.badgeLabel ?? "SORTIE";
  const badgeTone = category?.badgeTone ?? "default";

  return (
    <aside
      className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm lg:sticky lg:top-24"
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

      <article className="mt-4 overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm">
        <div className="relative flex h-40 items-center justify-center bg-[#EEF0FF]">
          {draft.coverImageUrl.trim() ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={draft.coverImageUrl.trim()} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2 px-4 text-center text-neutral-500">
              <ImageIcon className="h-8 w-8 text-neutral-400" aria-hidden />
              <p className="text-xs font-medium">{EVENT_CREATE_PREVIEW_VISUAL_PLACEHOLDER}</p>
            </div>
          )}
        </div>

        <div className="space-y-3 p-4">
          <span
            className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${BADGE_CLASS[badgeTone]}`}
          >
            {badgeLabel}
          </span>
          <h3 className="text-lg font-bold leading-snug text-neutral-900">{title}</h3>
          <p className="line-clamp-3 text-sm leading-relaxed text-neutral-600">{description}</p>

          <div className="space-y-2 border-t border-neutral-100 pt-3 text-sm text-neutral-600">
            <p className="inline-flex items-center gap-2">
              <CalendarDays className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
              {draft.startsAt.trim() ? draft.startsAt.replace("T", " · ") : EVENT_CREATE_PREVIEW_DATE_TBD}
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
                  <BadgeCheck className="h-4 w-4 shrink-0 text-yunicity-primary" aria-label="Organisation vérifiée" />
                ) : null}
              </span>
            </div>
          ) : null}

          <button
            type="button"
            disabled
            className="w-full rounded-xl bg-neutral-100 px-4 py-2.5 text-sm font-semibold text-neutral-400"
          >
            {EVENT_CREATE_PREVIEW_CTA}
          </button>
        </div>
      </article>

      <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-neutral-500">
        <Info className="h-3.5 w-3.5" aria-hidden />
        {EVENT_CREATE_PREVIEW_AUTO}
      </p>

      {mode === "detail" ? (
        <p className="sr-only">Mode détail — aperçu enrichi à venir.</p>
      ) : null}
    </aside>
  );
}
