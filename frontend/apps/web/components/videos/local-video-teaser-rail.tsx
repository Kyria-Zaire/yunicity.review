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
};

export function LocalVideoTeaserRail({
  items,
  title,
  seeAllHref = "/videos",
  layout = "stack",
}: LocalVideoTeaserRailProps) {
  if (items.length === 0) return null;

  const listClass =
    layout === "scroll"
      ? "flex min-w-max gap-3 pb-1"
      : "grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2";

  return (
    <section
      className="rounded-2xl border border-neutral-200/90 bg-[#FAFBFC] p-4 shadow-sm sm:p-5"
      aria-label={title}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-neutral-900">{title}</h2>
        <Link
          href={seeAllHref}
          className="inline-flex shrink-0 items-center gap-0.5 text-xs font-semibold text-yunicity-primary hover:underline"
        >
          Toutes les vidéos
          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>

      <div className={layout === "scroll" ? "-mx-1 overflow-x-auto px-1" : undefined}>
        <ul className={listClass}>
          {items.map((item) => (
            <li key={item.id} className={layout === "scroll" ? "w-[min(100%,18rem)] shrink-0" : undefined}>
              <LocalVideoTeaserCard item={item} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
