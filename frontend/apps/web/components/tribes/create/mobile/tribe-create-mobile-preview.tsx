"use client";

import type { TribeCreateDraft } from "@yunicity/utils";
import {
  TRIBE_CREATE_DESKTOP_CHECKLIST_NO_ERRORS,
  TRIBE_CREATE_DESKTOP_PREVIEW_BADGE_PRIVATE,
  TRIBE_CREATE_DESKTOP_PREVIEW_BADGE_PUBLIC,
  TRIBE_CREATE_DESKTOP_PREVIEW_COVER_PLACEHOLDER,
  TRIBE_CREATE_DESKTOP_PREVIEW_CTA,
  TRIBE_CREATE_DESKTOP_PREVIEW_DESC,
  TRIBE_CREATE_DESKTOP_PREVIEW_LOCATION_SUFFIX,
  TRIBE_CREATE_DESKTOP_PREVIEW_NAME,
  TRIBE_CREATE_DESKTOP_PREVIEW_TITLE,
  TRIBE_CREATE_MOBILE_CHECKLIST_PROGRESS,
  resolveTribeEditorialImage,
  tribeCategoryLabel,
  tribeCreateBlockingErrorCount,
  tribeCreateChecklistProgress,
} from "@yunicity/utils";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ImageIcon,
  Info,
  MapPin,
} from "lucide-react";
import { useState } from "react";

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

function resolvePreviewCoverUrl(draft: TribeCreateDraft): string | null {
  const customUrl = draft.coverImageUrl.trim();
  if (customUrl) return customUrl;
  if (!draft.category.trim()) return null;
  return resolveTribeEditorialImage({
    id: "preview",
    slug: "preview",
    name: draft.name.trim() || TRIBE_CREATE_DESKTOP_PREVIEW_NAME,
    description: draft.description.trim() || TRIBE_CREATE_DESKTOP_PREVIEW_DESC,
    city: draft.city,
    category: draft.category,
    visibility: draft.visibility,
    persistence_kind: "default",
    cover_image_url: null,
    is_featured: false,
    member_limit: 80,
    active_member_count: 1,
    is_archived: false,
    viewer_is_member: true,
    viewer_role: "owner",
    viewer_notifications_muted: false,
    viewer_has_pending_join_request: false,
    created_at: "",
    updated_at: "",
  });
}

type TribeCreateMobilePreviewProps = {
  draft: TribeCreateDraft;
};

export function TribeCreateMobilePreview({ draft }: TribeCreateMobilePreviewProps) {
  const [expanded, setExpanded] = useState(true);
  const coverUrl = resolvePreviewCoverUrl(draft);
  const name = draft.name.trim() || TRIBE_CREATE_DESKTOP_PREVIEW_NAME;
  const description = draft.description.trim() || TRIBE_CREATE_DESKTOP_PREVIEW_DESC;
  const categoryLabel = draft.category.trim() ? tribeCategoryLabel(draft.category) : null;
  const isPublic = draft.visibility === "public";
  const locationMeta = `${draft.city.trim() || "Reims"} · ${TRIBE_CREATE_DESKTOP_PREVIEW_LOCATION_SUFFIX}`;
  const { completed, total } = tribeCreateChecklistProgress(draft);
  const blockingErrors = tribeCreateBlockingErrorCount(draft);

  return (
    <section
      className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm"
      data-tribe-create-mobile-preview=""
    >
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
        aria-expanded={expanded}
      >
        <span className="inline-flex items-center gap-1.5 text-sm font-bold text-neutral-900">
          {TRIBE_CREATE_DESKTOP_PREVIEW_TITLE}
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
            <div className="relative aspect-[16/9] bg-[#EEF0FF]">
              {coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coverUrl} alt="" className="size-full object-cover" />
              ) : (
                <div className="flex size-full flex-col items-center justify-center gap-2 px-4 text-center text-neutral-500">
                  <ImageIcon className="h-8 w-8 text-neutral-400" aria-hidden />
                  <p className="text-xs font-medium">{TRIBE_CREATE_DESKTOP_PREVIEW_COVER_PLACEHOLDER}</p>
                </div>
              )}
            </div>
            <div className="relative space-y-2.5 p-4">
              <div className="absolute -top-8 left-4 h-14 w-14 overflow-hidden rounded-full border-4 border-white bg-neutral-100 shadow-md">
                {coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={coverUrl} alt="" className="size-full object-cover" />
                ) : (
                  <div className="flex size-full items-center justify-center bg-[#EEF0FF] text-[10px] font-bold text-yunicity-primary">
                    {name.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="pt-6">
                <p className="inline-flex rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-800">
                  {isPublic
                    ? TRIBE_CREATE_DESKTOP_PREVIEW_BADGE_PUBLIC
                    : TRIBE_CREATE_DESKTOP_PREVIEW_BADGE_PRIVATE}
                </p>
                <h3 className="mt-2 text-base font-bold text-neutral-900">{name}</h3>
                {categoryLabel ? (
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    <li className="rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-800">
                      {categoryLabel}
                    </li>
                  </ul>
                ) : null}
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">{description}</p>
                <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-neutral-500">
                  <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  {locationMeta}
                </p>
              </div>
              <button
                type="button"
                disabled
                className="w-full rounded-xl bg-neutral-100 px-3 py-2.5 text-sm font-semibold text-neutral-400"
              >
                {TRIBE_CREATE_DESKTOP_PREVIEW_CTA}
              </button>
            </div>
          </article>

          <div className="mt-4 flex items-center justify-between gap-3 border-t border-neutral-100 pt-3">
            <p className="inline-flex items-center gap-2 text-xs font-medium text-neutral-700">
              <ChecklistProgressRing completed={completed} total={total} />
              {TRIBE_CREATE_MOBILE_CHECKLIST_PROGRESS(completed, total)}
            </p>
            <p className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
              <CheckCircle2 className="h-4 w-4" aria-hidden />
              {blockingErrors === 0
                ? TRIBE_CREATE_DESKTOP_CHECKLIST_NO_ERRORS
                : `${blockingErrors} erreur${blockingErrors > 1 ? "s" : ""} bloquante${blockingErrors > 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
