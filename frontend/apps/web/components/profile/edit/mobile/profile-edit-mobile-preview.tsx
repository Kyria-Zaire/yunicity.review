"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { ProfileEditPreviewView } from "@yunicity/utils";
import {
  INTEREST_LABELS,
  NEIGHBORHOODS_PORTAL_HERO_IMAGE_URL,
  PROFILE_DESKTOP_BADGE_CITIZEN,
  PROFILE_DESKTOP_INTEREST_TONE,
  PROFILE_EDIT_DESKTOP_PREVIEW_ONLY,
  PROFILE_EDIT_DESKTOP_PREVIEW_TITLE,
} from "@yunicity/utils";
import { ChevronUp, MapPin } from "lucide-react";
import { useState } from "react";

const TONE_CLASS = {
  violet: "bg-violet-100 text-violet-700",
  blue: "bg-sky-100 text-sky-700",
  green: "bg-emerald-100 text-emerald-700",
  orange: "bg-orange-100 text-orange-700",
  sky: "bg-cyan-100 text-cyan-700",
  neutral: "bg-neutral-100 text-neutral-700",
} as const;

type ProfileEditMobilePreviewProps = {
  preview: ProfileEditPreviewView;
};

/** Aperçu public repliable — maquette mobile édition profil. */
export function ProfileEditMobilePreview({ preview }: ProfileEditMobilePreviewProps) {
  const [expanded, setExpanded] = useState(true);
  const bannerSrc = preview.bannerUrl ?? NEIGHBORHOODS_PORTAL_HERO_IMAGE_URL;

  return (
    <section
      className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm"
      data-profile-edit-mobile-preview=""
    >
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center justify-between gap-3 border-b border-neutral-100 px-4 py-3 text-left"
        aria-expanded={expanded}
      >
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-neutral-900">{PROFILE_EDIT_DESKTOP_PREVIEW_TITLE}</h2>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
            {PROFILE_EDIT_DESKTOP_PREVIEW_ONLY}
          </span>
          <ChevronUp
            className={`h-4 w-4 text-neutral-400 transition ${expanded ? "" : "rotate-180"}`}
            aria-hidden
          />
        </div>
      </button>

      {expanded ? (
        <>
          <div className="relative h-20 bg-neutral-200">
            <CulturalImage
              src={bannerSrc}
              alt=""
              placeName={preview.city ?? "Reims"}
              className="absolute inset-0 size-full"
              imageClassName="object-cover"
              sizes="400px"
              showFallbackCaption={false}
              overlay={false}
            />
          </div>
          <div className="relative px-4 pb-4 pt-9">
            <div className="absolute -top-7 left-4 h-14 w-14 overflow-hidden rounded-full border-[3px] border-white bg-neutral-200 shadow-sm">
              {preview.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview.avatarUrl} alt="" className="size-full object-cover" />
              ) : (
                <span className="flex size-full items-center justify-center bg-yunicity-primary/15 text-base font-bold text-yunicity-primary">
                  {preview.displayName.slice(0, 1).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-bold text-neutral-900">{preview.displayName}</p>
              <span className="inline-flex rounded-md bg-[#EEF0FF] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-yunicity-primary">
                {PROFILE_DESKTOP_BADGE_CITIZEN}
              </span>
            </div>
            <p className="text-xs text-neutral-500">@{preview.username}</p>
            {preview.bio ? (
              <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-neutral-700">{preview.bio}</p>
            ) : null}
            {preview.city ? (
              <p className="mt-2 flex items-center gap-1 text-xs text-neutral-500">
                <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {preview.city}
              </p>
            ) : null}
            {preview.interests.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1">
                {preview.interests.map((tag) => {
                  const tone = PROFILE_DESKTOP_INTEREST_TONE[tag] ?? "neutral";
                  return (
                    <span
                      key={tag}
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${TONE_CLASS[tone]}`}
                    >
                      {INTEREST_LABELS[tag] ?? tag}
                    </span>
                  );
                })}
              </div>
            ) : null}
          </div>
        </>
      ) : null}
    </section>
  );
}
