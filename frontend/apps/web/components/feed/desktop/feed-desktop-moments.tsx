"use client";

import type { FeedDesktopMoment } from "@yunicity/utils";
import {
  FEED_PORTAL_STORY_PUBLISH,
  FEED_PORTAL_STORY_PUBLISH_HINT,
} from "@yunicity/utils";
import Link from "next/link";

const MOMENT_RING_GRADIENTS = [
  "bg-gradient-to-tr from-orange-400 via-rose-400 to-fuchsia-400",
  "bg-gradient-to-tr from-amber-400 via-orange-400 to-rose-400",
  "bg-gradient-to-tr from-rose-400 via-pink-500 to-violet-400",
  "bg-gradient-to-tr from-orange-300 via-amber-400 to-yellow-400",
] as const;

const AVATAR_SIZE = "h-14 w-14 lg:h-[4.5rem] lg:w-[4.5rem]";
const ITEM_WIDTH = "w-[4.5rem] lg:w-[5.75rem]";
const MOMENTS_GAP = "gap-3.5 lg:gap-5";
const ITEM_LABEL_MAX = "max-w-[4.5rem] lg:max-w-[5.75rem]";

type FeedDesktopMomentsProps = {
  moments: readonly FeedDesktopMoment[];
  publishHref?: string;
};

function PublishMomentItem({ href }: { href: string }) {
  return (
    <Link
      href={href}
      data-feed-desktop-moment=""
      data-feed-desktop-moment-publish=""
      className={`group flex ${ITEM_WIDTH} shrink-0 flex-col items-center gap-1 lg:gap-1.5`}
    >
      <div
        data-feed-desktop-moment-ring=""
        className={`flex ${AVATAR_SIZE} items-center justify-center rounded-full border-2 border-dashed border-neutral-300 bg-neutral-50 text-2xl font-light leading-none text-neutral-700 transition group-hover:border-yunicity-primary group-hover:text-yunicity-primary lg:text-3xl`}
      >
        +
      </div>
      <span className={`${ITEM_LABEL_MAX} truncate text-center text-xs font-semibold leading-tight text-neutral-900 lg:text-[13px]`}>
        {FEED_PORTAL_STORY_PUBLISH}
      </span>
      <span className={`${ITEM_LABEL_MAX} truncate text-center text-[10px] font-medium text-neutral-500 lg:text-[11px]`}>
        {FEED_PORTAL_STORY_PUBLISH_HINT}
      </span>
    </Link>
  );
}

function MomentItem({ moment, index }: { moment: FeedDesktopMoment; index: number }) {
  const ringClass = `${MOMENT_RING_GRADIENTS[index % MOMENT_RING_GRADIENTS.length]} p-[2.5px]`;

  const inner = moment.imageUrl ? (
    // eslint-disable-next-line @next/next/no-img-element -- vignette territoriale dynamique
    <img src={moment.imageUrl} alt="" className="h-full w-full rounded-full object-cover" loading="lazy" />
  ) : (
    <span className="flex h-full w-full items-center justify-center rounded-full bg-yunicity-primary-soft text-sm font-bold text-yunicity-primary lg:text-base">
      {moment.name.slice(0, 1).toUpperCase()}
    </span>
  );

  return (
    <Link
      href={moment.href}
      data-feed-desktop-moment=""
      className={`flex ${ITEM_WIDTH} shrink-0 flex-col items-center gap-1 lg:gap-1.5`}
    >
      <div data-feed-desktop-moment-ring="" className={`rounded-full ${AVATAR_SIZE} ${ringClass}`}>
        <div className="h-full w-full rounded-full bg-white p-[2.5px] lg:p-[3px]">{inner}</div>
      </div>
      <span className={`${ITEM_LABEL_MAX} truncate text-center text-xs font-semibold leading-tight text-neutral-900 lg:text-[13px]`}>
        {moment.name}
      </span>
      <span className={`${ITEM_LABEL_MAX} truncate text-center text-[10px] font-medium text-neutral-500 lg:text-[11px]`}>
        {moment.timeLabel}
      </span>
    </Link>
  );
}

export function FeedDesktopMoments({
  moments,
  publishHref = "/stories/new",
}: FeedDesktopMomentsProps) {
  return (
    <section className="feed-desktop-surface feed-desktop-moments p-3.5 lg:p-5" aria-label="Moments près de vous">
      <h2 className="mb-3 text-sm font-bold tracking-tight text-neutral-900 lg:mb-4 lg:text-base">
        Moments près de vous
      </h2>
      <div className={`flex ${MOMENTS_GAP} overflow-x-auto pb-0.5 scrollbar-none`}>
        <PublishMomentItem href={publishHref} />
        {moments.map((moment, index) => (
          <MomentItem key={moment.id} moment={moment} index={index} />
        ))}
      </div>
    </section>
  );
}
