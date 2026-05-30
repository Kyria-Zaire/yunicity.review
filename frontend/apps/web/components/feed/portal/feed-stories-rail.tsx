"use client";

import type { FeedStoryShortcut } from "@yunicity/utils";
import { FEED_PORTAL_STORIES_SEE_ALL, FEED_PORTAL_STORY_YOURS } from "@yunicity/utils";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

const STORY_RING_ACTIVE = [
  "bg-gradient-to-tr from-violet-500 via-purple-500 to-fuchsia-400",
  "bg-gradient-to-tr from-orange-400 via-amber-500 to-yellow-400",
  "bg-gradient-to-tr from-sky-500 via-blue-500 to-indigo-400",
  "bg-gradient-to-tr from-rose-400 via-pink-500 to-orange-400",
  "bg-gradient-to-tr from-emerald-400 via-teal-400 to-cyan-400",
  "bg-gradient-to-tr from-fuchsia-500 via-purple-500 to-violet-600",
] as const;

const AVATAR_SIZE = "h-[4.5rem] w-[4.5rem]";
const ITEM_WIDTH = "w-[5.5rem]";

type FeedStoriesRailProps = {
  items: FeedStoryShortcut[];
  seeAllHref?: string;
};

function storyRingClass(item: FeedStoryShortcut, index: number): string {
  if (!item.hasActivity && item.kind !== "publish") {
    return "bg-neutral-200 p-[2.5px]";
  }
  if (item.kind === "publish") {
    return "bg-gradient-to-tr from-violet-400 via-purple-400 to-indigo-400 p-[2.5px]";
  }
  return `${STORY_RING_ACTIVE[index % STORY_RING_ACTIVE.length]} p-[2.5px]`;
}

function StoryAvatar({ item, index }: { item: FeedStoryShortcut; index: number }) {
  const ringClass = storyRingClass(item, index);

  const inner = item.imageUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={item.imageUrl} alt="" className="h-full w-full rounded-full object-cover" />
  ) : (
    <span className="flex h-full w-full items-center justify-center rounded-full bg-yunicity-primary-soft text-base font-bold text-yunicity-primary">
      {item.name.slice(0, 1).toUpperCase()}
    </span>
  );

  if (item.kind === "publish") {
    return (
      <Link
        href={item.href}
        className={`group flex ${ITEM_WIDTH} shrink-0 flex-col items-center gap-2.5`}
      >
        <div className="relative">
          <div className={`rounded-full ${AVATAR_SIZE} ${ringClass}`}>
            <div className="h-full w-full rounded-full bg-white p-[3px]">{inner}</div>
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-yunicity-primary text-base font-bold leading-none text-white shadow-sm">
            +
          </span>
        </div>
        <span className="max-w-[5.5rem] truncate text-center text-xs font-semibold text-neutral-800">
          {FEED_PORTAL_STORY_YOURS}
        </span>
      </Link>
    );
  }

  return (
    <Link href={item.href} className={`flex ${ITEM_WIDTH} shrink-0 flex-col items-center gap-1`}>
      <div className={`rounded-full ${AVATAR_SIZE} ${ringClass}`}>
        <div className="h-full w-full rounded-full bg-white p-[3px]">{inner}</div>
      </div>
      <span className="max-w-[5.5rem] truncate text-center text-xs font-bold text-neutral-900">
        {item.name}
      </span>
      <span className="max-w-[5.5rem] truncate text-center text-[11px] font-medium text-neutral-500">
        {item.subtitle}
      </span>
    </Link>
  );
}

function StoriesSeeAllCard({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className={`flex ${ITEM_WIDTH} shrink-0 flex-col items-center justify-center gap-2 rounded-2xl bg-[#EEF0FF] px-2 py-3 transition hover:bg-[#E4E7FF]`}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-yunicity-primary shadow-sm">
        <ChevronRight className="h-5 w-5" aria-hidden />
      </span>
      <span className="text-center text-[11px] font-semibold leading-snug text-yunicity-primary">
        {FEED_PORTAL_STORIES_SEE_ALL}
      </span>
    </Link>
  );
}

export function FeedStoriesRail({ items, seeAllHref = "/events" }: FeedStoriesRailProps) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="À la une locale" className="-mx-1 overflow-x-auto px-1 pb-1 scrollbar-thin">
      <ul className="flex min-w-max items-start gap-5 sm:gap-6 md:gap-7">
        {items.map((item, index) => (
          <li key={item.id}>
            <StoryAvatar item={item} index={index} />
          </li>
        ))}
        <li className="pt-0.5">
          <StoriesSeeAllCard href={seeAllHref} />
        </li>
      </ul>
    </nav>
  );
}
