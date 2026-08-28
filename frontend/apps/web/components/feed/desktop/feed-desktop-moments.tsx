"use client";

import type { FeedDesktopMoment } from "@yunicity/utils";
import Link from "next/link";

const MOMENT_RING_GRADIENTS = [
  "bg-gradient-to-tr from-orange-400 via-rose-400 to-fuchsia-400",
  "bg-gradient-to-tr from-amber-400 via-orange-400 to-rose-400",
  "bg-gradient-to-tr from-rose-400 via-pink-500 to-violet-400",
  "bg-gradient-to-tr from-orange-300 via-amber-400 to-yellow-400",
] as const;

const AVATAR_SIZE = "h-[4.5rem] w-[4.5rem]";
const ITEM_WIDTH = "w-[5.75rem]";

type FeedDesktopMomentsProps = {
  moments: readonly FeedDesktopMoment[];
};

function MomentItem({ moment, index }: { moment: FeedDesktopMoment; index: number }) {
  const ringClass = `${MOMENT_RING_GRADIENTS[index % MOMENT_RING_GRADIENTS.length]} p-[2.5px]`;

  const inner = moment.imageUrl ? (
    // eslint-disable-next-line @next/next/no-img-element -- vignette territoriale dynamique
    <img src={moment.imageUrl} alt="" className="h-full w-full rounded-full object-cover" loading="lazy" />
  ) : (
    <span className="flex h-full w-full items-center justify-center rounded-full bg-yunicity-primary-soft text-base font-bold text-yunicity-primary">
      {moment.name.slice(0, 1).toUpperCase()}
    </span>
  );

  return (
    <Link
      href={moment.href}
      data-feed-desktop-moment=""
      className={`flex ${ITEM_WIDTH} shrink-0 flex-col items-center gap-1.5`}
    >
      <div data-feed-desktop-moment-ring="" className={`rounded-full ${AVATAR_SIZE} ${ringClass}`}>
        <div className="h-full w-full rounded-full bg-white p-[3px]">{inner}</div>
      </div>
      <span className="max-w-[5.75rem] truncate text-center text-[13px] font-semibold leading-tight text-neutral-900">
        {moment.name}
      </span>
      <span className="max-w-[5.75rem] truncate text-center text-[11px] font-medium text-neutral-500">
        {moment.timeLabel}
      </span>
    </Link>
  );
}

export function FeedDesktopMoments({ moments }: FeedDesktopMomentsProps) {
  if (moments.length === 0) return null;

  return (
    <section className="feed-desktop-surface feed-desktop-moments p-5" aria-label="Moments près de vous">
      <h2 className="mb-4 text-base font-bold tracking-tight text-neutral-900">Moments près de vous</h2>
      <div className="flex gap-5 overflow-x-auto pb-0.5 scrollbar-none sm:gap-6 md:justify-between">
        {moments.map((moment, index) => (
          <MomentItem key={moment.id} moment={moment} index={index} />
        ))}
      </div>
    </section>
  );
}
