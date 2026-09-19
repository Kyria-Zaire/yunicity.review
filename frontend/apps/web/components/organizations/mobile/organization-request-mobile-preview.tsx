"use client";

import type { OrganizationRequestCategoryOption, OrganizationRequestDraft } from "@yunicity/utils";
import {
  ORG_REQUEST_CHECKLIST_NO_ERRORS,
  ORG_REQUEST_MOBILE_CHECKLIST_PROGRESS,
  ORG_REQUEST_PREVIEW_ADDRESS_TBD,
  ORG_REQUEST_PREVIEW_CTA,
  ORG_REQUEST_PREVIEW_TAG_LOCAL,
  ORG_REQUEST_PREVIEW_TITLE,
  ORG_REQUEST_PREVIEW_VISUAL_PLACEHOLDER,
  organizationRequestChecklistProgress,
  resolveOrganizationRequestPlaceType,
} from "@yunicity/utils";
import { CheckCircle2, ChevronDown, ChevronUp, ImageIcon, Info, MapPin } from "lucide-react";
import { useState } from "react";

const BADGE_CLASS = {
  culture: "bg-violet-100 text-violet-700",
  nature: "bg-emerald-100 text-emerald-700",
  food: "bg-orange-100 text-orange-700",
  commerce: "bg-neutral-100 text-neutral-700",
  sport: "bg-sky-100 text-sky-700",
  services: "bg-amber-100 text-amber-800",
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

type OrganizationRequestMobilePreviewProps = {
  draft: OrganizationRequestDraft;
  selectedCategory: OrganizationRequestCategoryOption | null;
};

export function OrganizationRequestMobilePreview({
  draft,
  selectedCategory,
}: OrganizationRequestMobilePreviewProps) {
  const [expanded, setExpanded] = useState(true);
  const title = draft.name.trim() || "Nom du lieu";
  const description =
    draft.shortDescription.trim() ||
    "Votre description apparaîtra ici dans les résultats de recherche.";
  const placeType = resolveOrganizationRequestPlaceType(draft.categoryId, draft.placeTypeId);
  const badgeLabel = selectedCategory?.badgeLabel ?? "LIEU";
  const badgeTone = selectedCategory?.badgeTone ?? "default";
  const locationLabel = draft.address.trim()
    ? `${draft.city.trim() || "Reims"} · ${draft.address.trim()}`
    : `${draft.city.trim() || "Reims"} · ${ORG_REQUEST_PREVIEW_ADDRESS_TBD}`;
  const { completed, total } = organizationRequestChecklistProgress(draft);

  return (
    <section
      className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm"
      data-org-request-mobile-preview=""
    >
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
        aria-expanded={expanded}
      >
        <span className="inline-flex items-center gap-1.5 text-sm font-bold text-neutral-900">
          {ORG_REQUEST_PREVIEW_TITLE}
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
          <article className="overflow-hidden rounded-xl border border-neutral-200/90 bg-white">
            <div className="flex min-h-[7.5rem] items-center justify-center bg-[#EEF0FF]">
              <div className="flex flex-col items-center gap-2 px-4 py-6 text-center text-yunicity-primary/80">
                <ImageIcon className="h-8 w-8" aria-hidden />
                <p className="text-xs font-medium">{ORG_REQUEST_PREVIEW_VISUAL_PLACEHOLDER}</p>
              </div>
            </div>
            <div className="space-y-2.5 p-4">
              <span
                className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${BADGE_CLASS[badgeTone]}`}
              >
                {badgeLabel}
              </span>
              <h3 className="text-base font-bold leading-snug text-neutral-900">{title}</h3>
              <p className="line-clamp-3 text-sm leading-relaxed text-neutral-600">{description}</p>
              <p className="inline-flex items-center gap-2 text-sm text-neutral-600">
                <MapPin className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
                {locationLabel}
              </p>
              <div className="flex flex-wrap gap-2">
                {placeType ? (
                  <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600">
                    {placeType.label}
                  </span>
                ) : null}
                <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600">
                  {ORG_REQUEST_PREVIEW_TAG_LOCAL}
                </span>
              </div>
              <button
                type="button"
                disabled
                className="w-full rounded-xl bg-neutral-100 px-4 py-2.5 text-sm font-semibold text-neutral-400"
              >
                {ORG_REQUEST_PREVIEW_CTA}
              </button>
            </div>
          </article>

          <div className="mt-4 flex items-center justify-between gap-3 border-t border-neutral-100 pt-3">
            <p className="inline-flex items-center gap-2 text-xs font-medium text-neutral-700">
              <ChecklistProgressRing completed={completed} total={total} />
              {ORG_REQUEST_MOBILE_CHECKLIST_PROGRESS(completed, total)}
            </p>
            <p className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
              <CheckCircle2 className="h-4 w-4" aria-hidden />
              {ORG_REQUEST_CHECKLIST_NO_ERRORS}
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
