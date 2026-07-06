"use client";

import type { VideoPortalCreator } from "@yunicity/utils";
import {
  VIDEOS_MOBILE_PUBLISH_ARIA,
  VIDEOS_SUBSCRIPTIONS_ONLINE,
  VIDEOS_SUBSCRIPTIONS_TITLE,
  VIDEOS_SUBSCRIPTIONS_VIEW_ALL,
  buildLocalVideoTeaserHref,
  formatVideoTemporalLabel,
} from "@yunicity/utils";
import { ChevronRight, Play, Video } from "lucide-react";
import Link from "next/link";

const STORY_RING_GRADIENT = [
  "bg-gradient-to-tr from-violet-500 via-fuchsia-500 to-orange-400",
  "bg-gradient-to-tr from-orange-400 via-amber-500 to-yellow-400",
  "bg-gradient-to-tr from-sky-500 via-blue-500 to-indigo-400",
  "bg-gradient-to-tr from-rose-400 via-pink-500 to-orange-400",
] as const;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "YU";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

type VideosMobileSubscriptionsRailProps = {
  creators: VideoPortalCreator[];
};

/** Rail abonnements mobile — anneaux + CTA publier (MOBILE-VIDEOS-01). */
export function VideosMobileSubscriptionsRail({ creators }: VideosMobileSubscriptionsRailProps) {
  if (creators.length === 0) return null;

  return (
    <section className="space-y-3" aria-labelledby="videos-mobile-subscriptions-title">
      <div className="flex items-center justify-between gap-3">
        <h2 id="videos-mobile-subscriptions-title" className="text-base font-bold text-neutral-900">
          {VIDEOS_SUBSCRIPTIONS_TITLE}
        </h2>
        <Link
          href="/videos"
          className="inline-flex items-center gap-0.5 text-sm font-semibold text-yunicity-primary"
        >
          {VIDEOS_SUBSCRIPTIONS_VIEW_ALL}
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      <ul className="flex gap-3 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {creators.map((creator, index) => {
          const href = buildLocalVideoTeaserHref(creator.latestVideoId);
          const isOnline = index % 3 === 0;
          const ringClass = STORY_RING_GRADIENT[index % STORY_RING_GRADIENT.length];

          return (
            <li key={creator.authorUserId} className="w-[4.5rem] shrink-0 text-center">
              <Link href={href} className="group block">
                <div className="relative mx-auto h-[3.75rem] w-[3.75rem]">
                  <div className={`rounded-full p-[2px] ${ringClass}`}>
                    <div className="relative h-full w-full overflow-hidden rounded-full bg-white p-[2px]">
                      {creator.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={creator.avatarUrl}
                          alt=""
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center rounded-full bg-yunicity-primary text-xs font-bold text-white">
                          {initials(creator.displayName)}
                        </span>
                      )}
                    </div>
                  </div>
                  {index % 2 === 0 ? (
                    <span className="absolute bottom-0 right-0 inline-flex h-5 w-5 items-center justify-center rounded-full bg-yunicity-primary text-white ring-2 ring-white">
                      <Play className="h-2.5 w-2.5 fill-white" aria-hidden />
                    </span>
                  ) : null}
                </div>
                <p className="mt-1.5 line-clamp-1 text-[11px] font-semibold text-neutral-900">
                  {creator.handle}
                </p>
                <p
                  className={`text-[10px] font-medium ${
                    isOnline ? "text-emerald-600" : "text-neutral-500"
                  }`}
                >
                  {isOnline ? VIDEOS_SUBSCRIPTIONS_ONLINE : formatVideoTemporalLabel(creator.latestPublishedAt)}
                </p>
              </Link>
            </li>
          );
        })}
        <li className="w-[4.5rem] shrink-0">
          <Link
            href="/videos/new"
            aria-label={VIDEOS_MOBILE_PUBLISH_ARIA}
            className="mx-auto flex h-[3.75rem] w-[3.75rem] items-center justify-center rounded-full bg-yunicity-primary text-white shadow-md transition hover:bg-yunicity-primary-hover"
          >
            <Video className="h-5 w-5" aria-hidden />
          </Link>
        </li>
      </ul>
    </section>
  );
}
