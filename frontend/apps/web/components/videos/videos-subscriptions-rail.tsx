"use client";

import type { VideoPortalCreator } from "@yunicity/utils";
import {
  VIDEOS_SUBSCRIPTIONS_ONLINE,
  VIDEOS_SUBSCRIPTIONS_TITLE,
  VIDEOS_SUBSCRIPTIONS_VIEW_ALL,
  buildLocalVideoTeaserHref,
  formatVideoTemporalLabel,
} from "@yunicity/utils";
import { ChevronRight, Play } from "lucide-react";
import Link from "next/link";

type VideosSubscriptionsRailProps = {
  creators: VideoPortalCreator[];
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "YU";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

export function VideosSubscriptionsRail({ creators }: VideosSubscriptionsRailProps) {
  if (creators.length === 0) return null;

  return (
    <section className="space-y-4" aria-labelledby="videos-subscriptions-title">
      <div className="flex items-center justify-between gap-3">
        <h2 id="videos-subscriptions-title" className="text-xl font-bold text-neutral-900">
          {VIDEOS_SUBSCRIPTIONS_TITLE}
        </h2>
        <Link
          href="/videos"
          className="inline-flex items-center gap-1 text-sm font-semibold text-yunicity-primary hover:underline"
        >
          {VIDEOS_SUBSCRIPTIONS_VIEW_ALL}
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      <ul className="flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {creators.map((creator, index) => {
          const href = buildLocalVideoTeaserHref(creator.latestVideoId);
          const isOnline = index % 3 === 0;
          const statusLabel = isOnline
            ? VIDEOS_SUBSCRIPTIONS_ONLINE
            : formatVideoTemporalLabel(creator.latestPublishedAt);

          return (
            <li key={creator.authorUserId} className="w-[5.5rem] shrink-0 text-center sm:w-[6rem]">
              <Link href={href} className="group block">
                <div className="relative mx-auto h-16 w-16 sm:h-[4.5rem] sm:w-[4.5rem]">
                  {creator.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={creator.avatarUrl}
                      alt=""
                      className="h-full w-full rounded-full object-cover ring-2 ring-white"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center rounded-full bg-yunicity-primary text-sm font-bold text-white ring-2 ring-white">
                      {initials(creator.displayName)}
                    </span>
                  )}
                  {index % 2 === 0 ? (
                    <span className="absolute bottom-0 right-0 inline-flex h-6 w-6 items-center justify-center rounded-full bg-yunicity-primary text-white ring-2 ring-white">
                      <Play className="h-3 w-3 fill-white" aria-hidden />
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 line-clamp-1 text-xs font-semibold text-neutral-900">
                  {creator.handle}
                </p>
                <p
                  className={`mt-0.5 text-[11px] font-medium ${
                    isOnline ? "text-emerald-600" : "text-neutral-500"
                  }`}
                >
                  {statusLabel}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
