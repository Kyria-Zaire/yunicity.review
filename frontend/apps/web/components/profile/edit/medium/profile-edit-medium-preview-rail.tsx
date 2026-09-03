"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { ProfileEditPreviewView } from "@yunicity/utils";
import {
  INTEREST_LABELS,
  NEIGHBORHOODS_PORTAL_HERO_IMAGE_URL,
  PROFILE_DESKTOP_INTEREST_TONE,
  PROFILE_EDIT_DESKTOP_COMPLETE_BODY,
  PROFILE_EDIT_DESKTOP_COMPLETE_CTA,
  PROFILE_EDIT_DESKTOP_COMPLETE_NEIGHBORHOOD,
  PROFILE_EDIT_DESKTOP_COMPLETE_TITLE,
  PROFILE_EDIT_DESKTOP_HELP_EMAIL_BODY,
  PROFILE_EDIT_DESKTOP_HELP_EMAIL_CTA,
  PROFILE_EDIT_DESKTOP_HELP_EMAIL_TITLE,
  PROFILE_EDIT_DESKTOP_PREVIEW_ONLY,
  PROFILE_EDIT_DESKTOP_PREVIEW_SUBTITLE,
  PROFILE_EDIT_DESKTOP_PREVIEW_TITLE,
} from "@yunicity/utils";
import { ExternalLink, Home, MapPin } from "lucide-react";
import Link from "next/link";

const TONE_CLASS = {
  violet: "bg-violet-100 text-violet-700",
  blue: "bg-sky-100 text-sky-700",
  green: "bg-emerald-100 text-emerald-700",
  orange: "bg-orange-100 text-orange-700",
  sky: "bg-cyan-100 text-cyan-700",
  neutral: "bg-neutral-100 text-neutral-700",
} as const;

type ProfileEditMediumPreviewRailProps = {
  preview: ProfileEditPreviewView;
};

/** Rail droit medium — aperçu public + complétion + aide (maquette). */
export function ProfileEditMediumPreviewRail({ preview }: ProfileEditMediumPreviewRailProps) {
  const bannerSrc = preview.bannerUrl ?? NEIGHBORHOODS_PORTAL_HERO_IMAGE_URL;

  return (
    <aside className="min-w-0 space-y-4" data-profile-edit-medium-preview="">
      <section className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm">
        <div className="border-b border-neutral-100 px-4 py-3">
          <h2 className="text-sm font-bold text-neutral-900">{PROFILE_EDIT_DESKTOP_PREVIEW_TITLE}</h2>
          <p className="mt-0.5 text-xs text-neutral-500">{PROFILE_EDIT_DESKTOP_PREVIEW_SUBTITLE}</p>
        </div>
        <div className="relative h-20 bg-neutral-200">
          <CulturalImage
            src={bannerSrc}
            alt=""
            placeName={preview.city ?? "Reims"}
            className="absolute inset-0 size-full"
            imageClassName="object-cover"
            sizes="280px"
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
          <span className="inline-flex rounded-md bg-[#EEF0FF] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-yunicity-primary">
            YUNICITIZEN
          </span>
          <p className="mt-1.5 text-sm font-bold text-neutral-900">{preview.displayName}</p>
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
          <button
            type="button"
            disabled
            className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-semibold text-neutral-400"
          >
            {PROFILE_EDIT_DESKTOP_PREVIEW_ONLY}
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-bold text-neutral-900">{PROFILE_EDIT_DESKTOP_COMPLETE_TITLE}</h2>
        <p className="mt-1.5 text-xs leading-relaxed text-neutral-500">{PROFILE_EDIT_DESKTOP_COMPLETE_BODY}</p>
        <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-neutral-100 bg-[#FAFBFC] px-3 py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EEF0FF] text-yunicity-primary">
              <Home className="h-3.5 w-3.5" aria-hidden />
            </span>
            <span className="text-xs font-medium text-neutral-800">
              {PROFILE_EDIT_DESKTOP_COMPLETE_NEIGHBORHOOD}
            </span>
          </div>
          <a
            href="#profile-edit-public"
            className="shrink-0 text-xs font-semibold text-yunicity-primary hover:underline"
          >
            {PROFILE_EDIT_DESKTOP_COMPLETE_CTA}
          </a>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-bold text-neutral-900">{PROFILE_EDIT_DESKTOP_HELP_EMAIL_TITLE}</h2>
        <p className="mt-1.5 text-xs leading-relaxed text-neutral-500">
          {PROFILE_EDIT_DESKTOP_HELP_EMAIL_BODY}
        </p>
        <Link
          href="/settings#security"
          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-yunicity-primary hover:underline"
        >
          {PROFILE_EDIT_DESKTOP_HELP_EMAIL_CTA}
          <ExternalLink className="h-3 w-3" aria-hidden />
        </Link>
      </section>
    </aside>
  );
}
