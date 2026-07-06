"use client";

import type { ProfileMe, StoryRingItem } from "@yunicity/types";
import type { FeedStoryShortcut } from "@yunicity/utils";
import { buildStoryRingDisplay, FEED_PORTAL_STORY_PUBLISH } from "@yunicity/utils";
import Link from "next/link";

const STORY_RING_GRADIENT = [
  "bg-gradient-to-tr from-violet-500 via-fuchsia-500 to-orange-400",
  "bg-gradient-to-tr from-orange-400 via-amber-500 to-yellow-400",
  "bg-gradient-to-tr from-sky-500 via-blue-500 to-indigo-400",
  "bg-gradient-to-tr from-rose-400 via-pink-500 to-orange-400",
  "bg-gradient-to-tr from-emerald-400 via-teal-400 to-cyan-400",
] as const;

const RING_SIZE = "h-[4.25rem] w-[4.25rem]";
const ITEM_WIDTH = "w-[4.75rem]";

function storyHandle(name: string, subtitle: string): string {
  const trimmedSubtitle = subtitle.trim();
  if (trimmedSubtitle.startsWith("@")) {
    return trimmedSubtitle;
  }
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_@]/g, "");
  return slug.startsWith("@") ? slug : `@${slug}`;
}

function StoryPlayOverlay() {
  return (
    <span className="absolute inset-0 flex items-center justify-center">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-sm">
        <svg className="h-3.5 w-3.5 text-neutral-800" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M8 5.5v13l11-6.5-11-6.5z" />
        </svg>
      </span>
    </span>
  );
}

function PublishStoryTile({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className={`flex ${ITEM_WIDTH} shrink-0 flex-col items-center gap-2`}
    >
      <span className="flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-full bg-neutral-100 text-3xl font-light leading-none text-neutral-800">
        +
      </span>
      <span className="max-w-full truncate text-center text-[11px] font-semibold text-neutral-800">
        {FEED_PORTAL_STORY_PUBLISH}
      </span>
    </Link>
  );
}

type StoryRailItem = {
  id: string;
  name: string;
  subtitle: string;
  imageUrl: string | null;
  href: string;
  hasActivity: boolean;
};

function resolveMobileStoryItems(
  profile: Pick<ProfileMe, "display_name" | "username" | "avatar_url" | "user_id"> | null,
  storyRings: StoryRingItem[],
  fallbacks: FeedStoryShortcut[],
): StoryRailItem[] {
  const fromApi = buildStoryRingDisplay({ profile, rings: storyRings }).filter(
    (item) => item.kind === "author" || item.kind === "mine",
  );
  if (fromApi.length > 0) {
    return fromApi.map((item) => ({
      id: item.id,
      name: item.name,
      subtitle: item.subtitle,
      imageUrl: item.imageUrl,
      href: item.href,
      hasActivity: item.hasActivity,
    }));
  }

  return fallbacks
    .filter((item) => item.kind !== "publish")
    .slice(0, 6)
    .map((item) => ({
      id: item.id,
      name: item.name,
      subtitle: item.subtitle,
      imageUrl: item.imageUrl,
      href: item.href,
      hasActivity: item.hasActivity,
    }));
}

type FeedMobileStoriesRailProps = {
  profile: Pick<ProfileMe, "display_name" | "username" | "avatar_url" | "user_id"> | null;
  storyRings: StoryRingItem[];
  storyShortcuts?: FeedStoryShortcut[];
  publishHref?: string;
};

/** Stories horizontales mobile — Publier + anneaux API ou raccourcis locaux (MOBILE-REFONDE-01). */
export function FeedMobileStoriesRail({
  profile,
  storyRings,
  storyShortcuts = [],
  publishHref = "/stories/new",
}: FeedMobileStoriesRailProps) {
  const rings = resolveMobileStoryItems(profile, storyRings, storyShortcuts);

  if (rings.length === 0 && !publishHref) {
    return null;
  }

  return (
    <nav
      aria-label="Stories locales"
      className="web-mobile-feed-only -mx-1 overflow-x-auto px-1 pb-0.5 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <ul className="flex min-w-max items-start gap-4">
        <li>
          <PublishStoryTile href={publishHref} />
        </li>
        {rings.map((item, index) => {
          const ringClass = item.hasActivity
            ? `${STORY_RING_GRADIENT[index % STORY_RING_GRADIENT.length]} p-[2.5px]`
            : "bg-neutral-200 p-[2.5px]";
          const inner = item.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.imageUrl} alt="" className="h-full w-full rounded-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center rounded-full bg-yunicity-primary-soft text-sm font-bold text-yunicity-primary">
              {item.name.slice(0, 1).toUpperCase()}
            </span>
          );

          return (
            <li key={item.id}>
              <Link href={item.href} className={`flex ${ITEM_WIDTH} shrink-0 flex-col items-center gap-1.5`}>
                <div className={`relative rounded-full ${RING_SIZE} ${ringClass}`}>
                  <div className="relative h-full w-full overflow-hidden rounded-full bg-white p-[3px]">
                    {inner}
                    <StoryPlayOverlay />
                  </div>
                  {item.hasActivity ? (
                    <span
                      className="absolute bottom-0 right-0 z-20 h-3 w-3 rounded-full border-2 border-white bg-emerald-500"
                      aria-hidden
                    />
                  ) : null}
                </div>
                <span className="max-w-full truncate text-center text-[11px] font-semibold text-neutral-900">
                  {storyHandle(item.name, item.subtitle)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
