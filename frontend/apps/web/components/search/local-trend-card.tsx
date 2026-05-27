"use client";

import type { LocalTrendIcon, LocalTrendItem } from "@yunicity/utils";
import Link from "next/link";
import { useState } from "react";

type LocalTrendCardProps = {
  item: LocalTrendItem;
};

export function LocalTrendCard({ item }: LocalTrendCardProps) {
  return (
    <Link
      href={item.href}
      className="group flex items-center gap-3 rounded-2xl border border-neutral-200/80 bg-white px-3 py-3 transition hover:border-neutral-300 hover:bg-neutral-50/50 sm:gap-4 sm:rounded-3xl sm:px-4"
    >
      <TrendVisual item={item} />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
          {item.meta}
        </p>
        <p className="mt-0.5 line-clamp-1 text-sm font-semibold text-neutral-900 group-hover:text-yunicity-primary sm:text-base">
          {item.title}
        </p>
        <p className="mt-0.5 line-clamp-1 text-xs text-neutral-500">{item.subtitle}</p>
      </div>
      <span className="shrink-0 text-xs font-semibold text-yunicity-primary opacity-80 transition group-hover:opacity-100">
        {item.actionLabel}
      </span>
    </Link>
  );
}

function TrendVisual({ item }: { item: LocalTrendItem }) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(item.imageUrl) && !failed;

  if (showImage) {
    return (
      <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl bg-neutral-100 sm:h-20 sm:w-20 sm:rounded-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.imageUrl!}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  return (
    <div
      className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-neutral-50 via-white to-yunicity-primary/5 sm:h-20 sm:w-20 sm:rounded-2xl"
      aria-hidden
    >
      <TrendIcon icon={item.icon} />
    </div>
  );
}

function TrendIcon({ icon }: { icon: LocalTrendIcon }) {
  const className = "h-6 w-6 text-yunicity-primary/70 sm:h-7 sm:w-7";

  switch (icon) {
    case "calendar":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
        </svg>
      );
    case "landmark":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M6 20h12M8 20V9l4-5 4 5v11" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 12h4" strokeLinecap="round" />
        </svg>
      );
    case "map-pin":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M12 21s7-4.35 7-10a7 7 0 1 0-14 0c0 5.65 7 10 7 10Z" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="11" r="2.5" />
        </svg>
      );
    case "passport":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <circle cx="12" cy="11" r="3" />
          <path d="M8 17h8" strokeLinecap="round" />
        </svg>
      );
    case "users":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1" strokeLinecap="round" />
          <circle cx="9" cy="7" r="3" />
          <path d="M22 19v-1a3 3 0 0 0-2.25-2.9M16 3.13a3 3 0 0 1 0 5.74" strokeLinecap="round" />
        </svg>
      );
    case "hash":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      return null;
  }
}
