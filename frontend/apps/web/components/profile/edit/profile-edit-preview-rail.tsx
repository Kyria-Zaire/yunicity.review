"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { ProfileEditPreviewView } from "@yunicity/utils";
import {
  NEIGHBORHOODS_PORTAL_HERO_IMAGE_URL,
  PROFILE_EDIT_HELP_BODY,
  PROFILE_EDIT_HELP_CTA,
  PROFILE_EDIT_HELP_TITLE,
  PROFILE_EDIT_PREVIEW_CTA,
  PROFILE_EDIT_PREVIEW_TITLE,
  PROFILE_EDIT_TIP_AUTHENTIC,
  PROFILE_EDIT_TIP_LOCAL,
  PROFILE_EDIT_TIP_REGULAR,
  PROFILE_EDIT_TIP_TRIBES,
  PROFILE_EDIT_TIPS_TITLE,
} from "@yunicity/utils";
import { Eye, Heart, Lightbulb, MapPin, Users } from "lucide-react";
import Link from "next/link";

type ProfileEditPreviewRailProps = {
  preview: ProfileEditPreviewView;
};

export function ProfileEditPreviewRail({ preview }: ProfileEditPreviewRailProps) {
  const bannerSrc = preview.bannerUrl ?? NEIGHBORHOODS_PORTAL_HERO_IMAGE_URL;

  return (
    <aside className="space-y-5">
      <section className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm">
        <h2 className="border-b border-neutral-100 px-5 py-4 text-sm font-bold text-neutral-900">
          {PROFILE_EDIT_PREVIEW_TITLE}
        </h2>
        <div className="relative h-24 bg-neutral-900">
          <CulturalImage
            src={bannerSrc}
            alt=""
            placeName={preview.city ?? "Reims"}
            className="absolute inset-0 size-full"
            imageClassName="object-cover"
            sizes="320px"
            showFallbackCaption={false}
            overlay={false}
          />
        </div>
        <div className="relative px-5 pb-5 pt-10">
          <div className="absolute -top-8 left-5 h-16 w-16 overflow-hidden rounded-full border-4 border-white bg-neutral-200 shadow-sm">
            {preview.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview.avatarUrl} alt="" className="size-full object-cover" />
            ) : (
              <span className="flex size-full items-center justify-center bg-yunicity-primary/15 text-lg font-bold text-yunicity-primary">
                {preview.displayName.slice(0, 1).toUpperCase()}
              </span>
            )}
          </div>
          <p className="text-base font-bold text-neutral-900">{preview.displayName}</p>
          <p className="text-sm text-neutral-500">@{preview.username}</p>
          {preview.bio ? (
            <p className="mt-3 text-sm leading-relaxed text-neutral-700">{preview.bio}</p>
          ) : null}
          {preview.city ? (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-neutral-500">
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {preview.city}
            </p>
          ) : null}
          <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
            {preview.stats.map((stat) => (
              <div key={stat.id}>
                <dt className="sr-only">{stat.label}</dt>
                <dd className="text-lg font-bold text-neutral-900">{stat.valueLabel}</dd>
                <dd className="mt-0.5 text-[10px] leading-tight text-neutral-500">{stat.label}</dd>
              </div>
            ))}
          </dl>
          <Link
            href={preview.publicProfileHref}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-yunicity-primary/30 px-4 py-2.5 text-sm font-semibold text-yunicity-primary transition hover:bg-yunicity-primary/5"
          >
            <Eye className="h-4 w-4" aria-hidden />
            {PROFILE_EDIT_PREVIEW_CTA}
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-neutral-900">{PROFILE_EDIT_TIPS_TITLE}</h2>
        <ul className="mt-4 space-y-3 text-sm leading-relaxed text-neutral-600">
          <li className="flex gap-3">
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden />
            {PROFILE_EDIT_TIP_AUTHENTIC}
          </li>
          <li className="flex gap-3">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
            {PROFILE_EDIT_TIP_LOCAL}
          </li>
          <li className="flex gap-3">
            <Users className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" aria-hidden />
            {PROFILE_EDIT_TIP_TRIBES}
          </li>
          <li className="flex gap-3">
            <Heart className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" aria-hidden />
            {PROFILE_EDIT_TIP_REGULAR}
          </li>
        </ul>
      </section>

      <section className="rounded-2xl border border-violet-100 bg-violet-50/80 p-5">
        <h2 className="text-sm font-bold text-violet-950">{PROFILE_EDIT_HELP_TITLE}</h2>
        <p className="mt-2 text-sm leading-relaxed text-violet-900/80">{PROFILE_EDIT_HELP_BODY}</p>
        <Link
          href="/settings"
          className="mt-3 inline-flex text-sm font-semibold text-violet-700 hover:underline"
        >
          {PROFILE_EDIT_HELP_CTA}
        </Link>
      </section>
    </aside>
  );
}
