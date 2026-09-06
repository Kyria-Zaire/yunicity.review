"use client";

import type { DiscussionThread } from "@yunicity/types";
import {
  DISCUSSIONS_DESKTOP_TITLE,
  DISCUSSIONS_MOBILE_BACK,
  DISCUSSIONS_MOBILE_INFO,
  DISCUSSIONS_MOBILE_PROFILE,
  DISCUSSIONS_MOBILE_YUNICIZEN,
  discussionAuthorProfileHref,
} from "@yunicity/utils";
import { ArrowLeft, Info } from "lucide-react";
import Link from "next/link";

type DiscussionsMobileThreadHeaderProps = {
  thread: DiscussionThread;
  onBack: () => void;
};

export function DiscussionsMobileThreadHeader({ thread, onBack }: DiscussionsMobileThreadHeaderProps) {
  const profileHref = discussionAuthorProfileHref(thread);
  const locationLabel = thread.neighborhood_summary?.display_name ?? thread.city ?? "Reims";
  const displayName = thread.author.display_name;

  return (
    <header
      className="sticky top-0 z-[var(--z-chrome)] border-b border-neutral-200/90 bg-white pt-[env(safe-area-inset-top)]"
      data-discussions-mobile-thread-header=""
    >
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)_minmax(0,1fr)] items-center gap-x-1 px-2 py-2.5 sm:px-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-w-0 items-center gap-0.5 rounded-lg py-1 pl-0.5 pr-1 text-left text-sm font-semibold text-yunicity-primary transition hover:bg-[#EEF0FF]"
          aria-label={DISCUSSIONS_MOBILE_BACK}
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          <span className="truncate">{DISCUSSIONS_DESKTOP_TITLE}</span>
        </button>

        <div className="flex min-w-0 items-center justify-center gap-1.5 px-0.5">
          {thread.author.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thread.author.logo_url}
              alt=""
              className="inline-flex h-9 w-9 shrink-0 flex-none rounded-full object-cover"
            />
          ) : (
            <span className="inline-flex h-9 w-9 shrink-0 flex-none items-center justify-center rounded-full bg-[#EEF0FF] text-xs font-bold leading-none text-yunicity-primary">
              {displayName.slice(0, 1).toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-bold leading-tight text-neutral-900">{displayName}</p>
            <p className="truncate text-[10px] leading-tight text-neutral-500 sm:text-[11px]">
              {DISCUSSIONS_MOBILE_YUNICIZEN} · {locationLabel}
            </p>
          </div>
        </div>

        <div className="flex min-w-0 items-center justify-end gap-0.5">
          <Link
            href={profileHref}
            className="inline-flex shrink-0 items-center rounded-lg border border-yunicity-primary px-2 py-1.5 text-[11px] font-semibold leading-none text-yunicity-primary transition hover:bg-[#EEF0FF] sm:rounded-xl sm:px-2.5 sm:py-2 sm:text-xs"
          >
            {DISCUSSIONS_MOBILE_PROFILE}
          </Link>
          <Link
            href={profileHref}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-700 sm:h-9 sm:w-9"
            aria-label={DISCUSSIONS_MOBILE_INFO}
          >
            <Info className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </header>
  );
}
