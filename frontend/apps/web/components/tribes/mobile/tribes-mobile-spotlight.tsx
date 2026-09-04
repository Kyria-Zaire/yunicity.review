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

type TribesMobileSpotlightProps = {
  city: string;
  spotlight: TribesDesktopSpotlightCard | null;
  onReload: () => void;
};

export function TribesMobileSpotlight({ city, spotlight, onReload }: TribesMobileSpotlightProps) {
  if (!spotlight) {
    return (
      <div className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm">
        <h2 className="text-base font-bold text-neutral-900">{TRIBES_DESKTOP_SPOTLIGHT_FALLBACK_TITLE}</h2>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">{TRIBES_DESKTOP_SPOTLIGHT_FALLBACK_BODY}</p>
      </div>
    );
  }

  return (
    <article
      className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm"
      data-tribes-mobile-spotlight=""
    >
      <div className="relative aspect-[16/10] bg-neutral-900">
        <CulturalImage
          src={spotlight.imageUrl}
          alt=""
          placeName={spotlight.title}
          className="absolute inset-0 size-full"
          sizes="100vw"
          showFallbackCaption={false}
          dimOverlay={false}
        />
      </div>

      <div className="space-y-3 p-4">
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
          <h2 className="text-lg font-bold leading-snug text-neutral-900">{spotlight.title}</h2>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {spotlight.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700"
              >
                {tag}
              </span>
            ))}
          </div>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">{spotlight.description}</p>
          {spotlight.nextMeetupLabel ? (
            <p className="mt-2.5 flex items-center gap-2 text-sm text-neutral-600">
              <Calendar className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
              {TRIBES_DESKTOP_NEXT_MEETUP(spotlight.nextMeetupLabel)}
            </p>
          ) : null}
          <p className="mt-1.5 flex items-center gap-2 text-sm text-neutral-600">
            <UserRound className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
            {TRIBES_DESKTOP_COMMUNITY_DRIVEN}
          </p>
        </div>

        <div className="space-y-2">
          <div className="w-full [&_a]:w-full [&_button]:w-full [&_>div]:w-full">
            <TribesDesktopJoinButton
              city={city}
              slug={spotlight.slug}
              variant="primary"
              viewerIsMember={spotlight.viewerIsMember}
              isPrivateInvite={spotlight.isPrivateInvite}
              viewerHasPendingJoinRequest={spotlight.viewerHasPendingJoinRequest}
              onSuccess={onReload}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Link
              href={spotlight.href}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-yunicity-primary/35 px-3 text-sm font-semibold text-yunicity-primary"
            >
              {TRIBES_DESKTOP_SPOTLIGHT_VIEW}
            </Link>
            <button
              type="button"
              disabled
              title={TRIBES_DESKTOP_SAVE_SOON}
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-neutral-200 px-3 text-sm font-semibold text-neutral-700"
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
