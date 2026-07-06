"use client";

import type { VideoPortalCreator } from "@yunicity/utils";
import {
  VIDEOS_MOBILE_PUBLISH_ARIA,
  VIDEOS_MOBILE_PUBLISH_LABEL,
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

const RING_SIZE = "h-[4.25rem] w-[4.25rem]";
const ITEM_WIDTH = "w-[4.75rem]";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "YU";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

function CreatorPlayOverlay() {
  return (
    <span className="absolute inset-0 flex items-center justify-center">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-sm">
        <Play className="h-3.5 w-3.5 fill-neutral-800 text-neutral-800" aria-hidden />
      </span>
    </span>
  );
}

function PublishVideoTile({ href }: { href: string }) {
  return (
    <Link
      href={href}
      aria-label={VIDEOS_MOBILE_PUBLISH_ARIA}
      className={`flex ${ITEM_WIDTH} shrink-0 flex-col items-center gap-1.5`}
    >
      <span
        className={`flex ${RING_SIZE} items-center justify-center rounded-full bg-yunicity-primary text-white shadow-sm transition hover:bg-yunicity-primary-hover`}
      >
        <Video className="h-5 w-5" aria-hidden />
      </span>
      <span className="max-w-full truncate text-center text-[11px] font-semibold text-neutral-900">
        {VIDEOS_MOBILE_PUBLISH_LABEL}
      </span>
    </Link>
  );
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
          className="inline-flex shrink-0 items-center gap-0.5 text-sm font-semibold text-yunicity-primary"
        >
          {VIDEOS_SUBSCRIPTIONS_VIEW_ALL}
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      <nav
        aria-label={VIDEOS_SUBSCRIPTIONS_TITLE}
        className="-mx-1 overflow-x-auto px-1 pb-0.5 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <ul className="flex min-w-max items-start gap-4">
          <li>
            <PublishVideoTile href="/videos/new" />
          </li>
          {creators.map((creator, index) => {
            const href = buildLocalVideoTeaserHref(creator.latestVideoId);
            const isOnline = index % 3 === 0;
            const ringClass = STORY_RING_GRADIENT[index % STORY_RING_GRADIENT.length];
            const statusLabel = isOnline
              ? VIDEOS_SUBSCRIPTIONS_ONLINE
              : formatVideoTemporalLabel(creator.latestPublishedAt);

            return (
              <li key={creator.authorUserId}>
                <Link href={href} className={`flex ${ITEM_WIDTH} shrink-0 flex-col items-center gap-1.5`}>
                  <div className="relative">
                    {isOnline ? (
                      <span className="absolute -left-0.5 top-1/2 z-10 h-2 w-2 -translate-y-1/2 rounded-full bg-emerald-500 ring-2 ring-[#F4F5F7]" />
                    ) : null}
                    <div className={`rounded-full ${RING_SIZE} bg-gradient-to-tr p-[2.5px] ${ringClass}`}>
                      <div className="relative h-full w-full overflow-hidden rounded-full bg-white p-[3px]">
                        {creator.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={creator.avatarUrl}
                            alt=""
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center rounded-full bg-yunicity-primary text-sm font-bold text-white">
                            {initials(creator.displayName)}
                          </span>
                        )}
                        <CreatorPlayOverlay />
                      </div>
                    </div>
                  </div>
                  <span className="max-w-full truncate text-center text-[11px] font-semibold text-neutral-900">
                    {creator.handle}
                  </span>
                  <span
                    className={`max-w-full truncate text-center text-[10px] font-medium ${
                      isOnline ? "text-emerald-600" : "text-neutral-500"
                    }`}
                  >
                    {statusLabel}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </section>
  );
}
