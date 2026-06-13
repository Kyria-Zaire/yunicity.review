"use client";

import type { LocalVideoFeedItem } from "@yunicity/types";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { LocalVideoTeaserCard } from "@/components/videos/local-video-teaser-card";

type LocalVideoTeaserRailProps = {
  items: LocalVideoFeedItem[];
  title: string;
  seeAllHref?: string;
  layout?: "stack" | "scroll";
  /** Rail intégré dans le hero quartier — sans carte imbriquée. */
  embedded?: boolean;
};

export function LocalVideoTeaserRail({
  items,
  title,
  seeAllHref = "/videos",
  layout = "stack",
  embedded = false,
}: LocalVideoTeaserRailProps) {
  if (items.length === 0) return null;

  const listClass =
    layout === "scroll"
      ? "flex w-max min-w-full gap-3 pb-1"
      : "grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2";

  const content = (
    <>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className={embedded ? "text-sm font-bold text-neutral-900" : "text-base font-bold text-neutral-900"}>
          {title}
        </h2>
        <Link
          href={seeAllHref}
          className="inline-flex min-h-11 shrink-0 items-center gap-0.5 px-1 text-xs font-semibold text-yunicity-primary hover:underline"
        >
          Toutes les vidéos
          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>

      <div
        className={
          layout === "scroll"
            ? "max-w-full overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            : undefined
        }
      >
        <ul className={listClass}>
          {items.map((item) => (
            <li key={item.id} className={layout === "scroll" ? "w-[min(100%,18rem)] shrink-0" : undefined}>
              <LocalVideoTeaserCard item={item} />
            </li>
          ))}
        </ul>
      </div>
    </>
  );

  if (embedded) {
    return (
      <div className="min-w-0 max-w-full" aria-label={title}>
        {content}
      </div>
    );
  }

  return (
    <section
      className="rounded-2xl border border-neutral-200/90 bg-[#FAFBFC] p-4 shadow-sm sm:p-5"
      aria-label={title}
    >
      {content}
    </section>
  );
}
