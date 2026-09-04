"use client";

import { TribesDesktopJoinButton } from "@/components/tribes/desktop/tribes-desktop-join-button";
import { CulturalImage } from "@/components/culture/cultural-image";
import type { TribesDesktopSpotlightCard } from "@yunicity/utils";
import {
  TRIBES_DESKTOP_COMMUNITY_DRIVEN,
  TRIBES_DESKTOP_FEATURED_DISCOVER_BADGE,
  TRIBES_DESKTOP_NEXT_MEETUP,
  TRIBES_DESKTOP_SAVE_SOON,
  TRIBES_DESKTOP_SPOTLIGHT_FALLBACK_BODY,
  TRIBES_DESKTOP_SPOTLIGHT_FALLBACK_TITLE,
  TRIBES_DESKTOP_SPOTLIGHT_SAVE,
  TRIBES_DESKTOP_SPOTLIGHT_VIEW,
} from "@yunicity/utils";
import { Bookmark, Calendar, UserRound } from "lucide-react";
import Link from "next/link";

type TribesDesktopFeaturedSpotlightProps = {
  city: string;
  spotlight: TribesDesktopSpotlightCard | null;
  onReload: () => void;
};

export function TribesDesktopFeaturedSpotlight({
  city,
  spotlight,
  onReload,
}: TribesDesktopFeaturedSpotlightProps) {
  if (!spotlight) {
    return (
      <div className="rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-neutral-900">{TRIBES_DESKTOP_SPOTLIGHT_FALLBACK_TITLE}</h2>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">{TRIBES_DESKTOP_SPOTLIGHT_FALLBACK_BODY}</p>
      </div>
    );
  }

  return (
    <article
      className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm"
      data-tribes-desktop-spotlight=""
    >
      <div className="grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <div className="relative min-h-[260px] bg-neutral-900">
          <CulturalImage
            src={spotlight.imageUrl}
            alt=""
            placeName={spotlight.title}
            className="absolute inset-0 size-full"
            sizes="(max-width: 1280px) 100vw, 560px"
            showFallbackCaption={false}
            dimOverlay={false}
          />
        </div>

        <div className="flex flex-col justify-center gap-4 p-5 sm:p-6">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
              {TRIBES_DESKTOP_FEATURED_DISCOVER_BADGE}
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${spotlight.visibilityTone}`}
            >
              {spotlight.visibilityBadge}
            </span>
          </div>

          <div>
            <h2 className="text-xl font-bold leading-snug text-neutral-900">{spotlight.title}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {spotlight.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700"
                >
                  {tag}
                </span>
              ))}
            </div>
            <p className="mt-3 text-sm leading-relaxed text-neutral-600">{spotlight.description}</p>
            {spotlight.nextMeetupLabel ? (
              <p className="mt-3 flex items-center gap-2 text-sm text-neutral-600">
                <Calendar className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
                {TRIBES_DESKTOP_NEXT_MEETUP(spotlight.nextMeetupLabel)}
              </p>
            ) : null}
            <p className="mt-2 flex items-center gap-2 text-sm text-neutral-600">
              <UserRound className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
              {TRIBES_DESKTOP_COMMUNITY_DRIVEN}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <TribesDesktopJoinButton
              city={city}
              slug={spotlight.slug}
              variant="primary"
              viewerIsMember={spotlight.viewerIsMember}
              isPrivateInvite={spotlight.isPrivateInvite}
              viewerHasPendingJoinRequest={spotlight.viewerHasPendingJoinRequest}
              onSuccess={onReload}
            />
            <Link
              href={spotlight.href}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-neutral-200 px-4 text-sm font-semibold text-neutral-700 transition hover:border-neutral-300 sm:w-auto"
            >
              {TRIBES_DESKTOP_SPOTLIGHT_VIEW}
            </Link>
            <button
              type="button"
              disabled
              title={TRIBES_DESKTOP_SAVE_SOON}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 px-4 text-sm font-semibold text-neutral-700 sm:w-auto"
            >
              <Bookmark className="h-4 w-4" aria-hidden />
              {TRIBES_DESKTOP_SPOTLIGHT_SAVE}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
