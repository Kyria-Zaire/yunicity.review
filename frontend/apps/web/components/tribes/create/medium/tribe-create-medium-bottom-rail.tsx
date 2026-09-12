"use client";

import { TribeCreateDesktopChecklist } from "@/components/tribes/create/desktop/tribe-create-desktop-checklist";
import type { TribeCreateDraft } from "@yunicity/utils";
import {
  TRIBE_CREATE_DESKTOP_HELP_TITLE,
  TRIBE_CREATE_DESKTOP_PREVIEW_BADGE_PRIVATE,
  TRIBE_CREATE_DESKTOP_PREVIEW_BADGE_PUBLIC,
  TRIBE_CREATE_DESKTOP_PREVIEW_COVER_PLACEHOLDER,
  TRIBE_CREATE_DESKTOP_PREVIEW_CTA,
  TRIBE_CREATE_DESKTOP_PREVIEW_DESC,
  TRIBE_CREATE_DESKTOP_PREVIEW_LOCATION_SUFFIX,
  TRIBE_CREATE_DESKTOP_PREVIEW_MODE_CARD,
  TRIBE_CREATE_DESKTOP_PREVIEW_MODE_DETAIL,
  TRIBE_CREATE_DESKTOP_PREVIEW_NAME,
  TRIBE_CREATE_DESKTOP_PREVIEW_TITLE,
  TRIBE_CREATE_MEDIUM_HELP_BODY_EXTENDED,
  resolveTribeEditorialImage,
  tribeCategoryLabel,
} from "@yunicity/utils";
import { ImageIcon, Info, MapPin, Shield } from "lucide-react";
import { useState } from "react";

type TribeCreateMediumBottomRailProps = {
  draft: TribeCreateDraft;
};

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

export function TribeCreateMediumBottomRail({ draft }: TribeCreateMediumBottomRailProps) {
  const [mode, setMode] = useState<"card" | "detail">("card");
  const coverUrl = resolvePreviewCoverUrl(draft);
  const name = draft.name.trim() || TRIBE_CREATE_DESKTOP_PREVIEW_NAME;
  const description = draft.description.trim() || TRIBE_CREATE_DESKTOP_PREVIEW_DESC;
  const categoryLabel = draft.category.trim() ? tribeCategoryLabel(draft.category) : null;
  const isPublic = draft.visibility === "public";
  const locationMeta = `${draft.city.trim() || "Reims"} · ${TRIBE_CREATE_DESKTOP_PREVIEW_LOCATION_SUFFIX}`;

  return (
    <div className="space-y-4" data-tribe-create-medium-rail="">
      <section className="grid gap-4 md:grid-cols-[minmax(0,1fr)_17.5rem]">
        <div
          className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm sm:p-5"
          data-tribe-create-medium-preview=""
        >
          <div className="flex items-center justify-between gap-3">
            <p className="inline-flex items-center gap-1.5 text-sm font-bold text-neutral-900">
              {TRIBE_CREATE_DESKTOP_PREVIEW_TITLE}
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
                {TRIBE_CREATE_DESKTOP_PREVIEW_MODE_CARD}
              </button>
              <button
                type="button"
                onClick={() => setMode("detail")}
                className={`rounded-md px-2.5 py-1 transition ${
                  mode === "detail" ? "bg-white text-yunicity-primary shadow-sm" : "text-neutral-500"
                }`}
              >
                {TRIBE_CREATE_DESKTOP_PREVIEW_MODE_DETAIL}
              </button>
            </div>
          </div>

          <article className="mt-4 overflow-hidden rounded-2xl border border-neutral-200/90 bg-white">
            {mode === "card" ? (
              <div className="grid sm:grid-cols-[9.5rem_minmax(0,1fr)]">
                <div className="relative flex min-h-[9.5rem] items-center justify-center bg-[#EEF0FF] sm:min-h-full">
                  {coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={coverUrl} alt="" className="size-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 px-3 py-6 text-center text-neutral-500">
                      <ImageIcon className="h-7 w-7 text-neutral-400" aria-hidden />
                      <p className="text-[11px] font-medium leading-snug">
                        {TRIBE_CREATE_DESKTOP_PREVIEW_COVER_PLACEHOLDER}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2.5 p-4">
                  <p className="inline-flex rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-800">
                    {isPublic
                      ? TRIBE_CREATE_DESKTOP_PREVIEW_BADGE_PUBLIC
                      : TRIBE_CREATE_DESKTOP_PREVIEW_BADGE_PRIVATE}
                  </p>
                  <h3 className="text-base font-bold leading-snug text-neutral-900">{name}</h3>
                  {categoryLabel ? (
                    <ul className="flex flex-wrap gap-1.5">
                      <li className="rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-800">
                        {categoryLabel}
                      </li>
                    </ul>
                  ) : null}
                  <p className="line-clamp-2 text-sm leading-relaxed text-neutral-600">{description}</p>
                  <p className="inline-flex items-center gap-1.5 text-xs text-neutral-500">
                    <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    {locationMeta}
                  </p>
                  <button
                    type="button"
                    disabled
                    className="w-full rounded-xl bg-neutral-100 px-3 py-2 text-sm font-semibold text-neutral-400"
                  >
                    {TRIBE_CREATE_DESKTOP_PREVIEW_CTA}
                  </button>
                </div>
              </div>
            ) : (
              <div>
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
                        <li className="rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-800">
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
                    className="w-full rounded-xl bg-neutral-100 px-3 py-2 text-sm font-semibold text-neutral-400"
                  >
                    {TRIBE_CREATE_DESKTOP_PREVIEW_CTA}
                  </button>
                </div>
              </div>
            )}
          </article>
        </div>

        <TribeCreateDesktopChecklist draft={draft} />
      </section>

      <section
        className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm sm:p-5"
        data-tribe-create-medium-help=""
      >
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EEF0FF] text-yunicity-primary">
            <Shield className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-neutral-900">{TRIBE_CREATE_DESKTOP_HELP_TITLE}</h2>
            <p className="mt-1 text-sm leading-relaxed text-neutral-600">
              {TRIBE_CREATE_MEDIUM_HELP_BODY_EXTENDED}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
