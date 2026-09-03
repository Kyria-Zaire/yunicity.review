"use client";

import type { TribeCreateDraft } from "@yunicity/utils";
import {
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
  resolveTribeEditorialImage,
  tribeCategoryLabel,
} from "@yunicity/utils";
import { ImageIcon, Info, MapPin } from "lucide-react";
import { useState } from "react";

type TribeCreateDesktopPreviewProps = {
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

export function TribeCreateDesktopPreview({ draft }: TribeCreateDesktopPreviewProps) {
  const [mode, setMode] = useState<"card" | "detail">("card");
  const coverUrl = resolvePreviewCoverUrl(draft);
  const name = draft.name.trim() || TRIBE_CREATE_DESKTOP_PREVIEW_NAME;
  const description = draft.description.trim() || TRIBE_CREATE_DESKTOP_PREVIEW_DESC;
  const categoryLabel = draft.category.trim() ? tribeCategoryLabel(draft.category) : null;
  const isPublic = draft.visibility === "public";
  const locationMeta = `${draft.city.trim() || "Reims"} · ${TRIBE_CREATE_DESKTOP_PREVIEW_LOCATION_SUFFIX}`;

  return (
    <aside data-tribe-create-preview="">
      <section className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm">
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

        <article className="mt-4 overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm">
          <div
            className={`relative bg-[#EEF0FF] ${
              mode === "detail" ? "aspect-[16/9]" : "h-36"
            }`}
          >
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

          <div className={`space-y-3 p-4 ${mode === "detail" ? "relative" : ""}`}>
            {mode === "detail" ? (
              <div className="absolute -top-10 left-4 h-16 w-16 overflow-hidden rounded-full border-4 border-white bg-neutral-100 shadow-md">
                {coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={coverUrl} alt="" className="size-full object-cover" />
                ) : (
                  <div className="flex size-full items-center justify-center bg-[#EEF0FF] text-xs font-bold text-yunicity-primary">
                    {name.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
            ) : null}

            <div className={mode === "detail" ? "pt-8" : ""}>
              <p className="inline-flex rounded-full bg-sky-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-800">
                {isPublic
                  ? TRIBE_CREATE_DESKTOP_PREVIEW_BADGE_PUBLIC
                  : TRIBE_CREATE_DESKTOP_PREVIEW_BADGE_PRIVATE}
              </p>
              <h3 className="mt-2 text-lg font-bold leading-snug text-neutral-900">{name}</h3>
              {categoryLabel ? (
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  <li className="rounded-full bg-violet-50 px-2.5 py-0.5 text-[11px] font-semibold text-violet-800">
                    {categoryLabel}
                  </li>
                </ul>
              ) : null}
              <p
                className={`mt-2 text-sm leading-relaxed text-neutral-600 ${
                  mode === "card" ? "line-clamp-3" : ""
                }`}
              >
                {description}
              </p>
              <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-neutral-500">
                <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {locationMeta}
              </p>
            </div>

            <button
              type="button"
              disabled
              className="mt-2 inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-400"
            >
              {TRIBE_CREATE_DESKTOP_PREVIEW_CTA}
            </button>
          </div>
        </article>
      </section>
    </aside>
  );
}
