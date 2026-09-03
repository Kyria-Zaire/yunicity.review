"use client";

import type { DiscussionThread } from "@yunicity/types";
import {
  DISCUSSIONS_DESKTOP_BLOCK,
  DISCUSSIONS_DESKTOP_COMMON_TITLE,
  DISCUSSIONS_DESKTOP_CONTEXT_TITLE,
  DISCUSSIONS_DESKTOP_MEDIA,
  DISCUSSIONS_DESKTOP_MUTE,
  DISCUSSIONS_DESKTOP_REPORT,
  DISCUSSIONS_DESKTOP_REPORT_HINT,
  DISCUSSIONS_DESKTOP_SEARCH_IN_THREAD,
  DISCUSSIONS_DESKTOP_SECURITY_TITLE,
  DISCUSSIONS_DESKTOP_VIEW_PROFILE,
  DISCUSSIONS_DESKTOP_YUNICIZEN_BADGE,
  discussionAuthorProfileHref,
} from "@yunicity/utils";
import { Flag, Link2, MapPin, Search, Shield, Users, VolumeX } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type DiscussionsDesktopContextRailProps = {
  thread: DiscussionThread | null;
  city: string;
  onReport: () => void;
};

export function DiscussionsDesktopContextRail({
  thread,
  city,
  onReport,
}: DiscussionsDesktopContextRailProps) {
  const [muted, setMuted] = useState(false);

  if (!thread) {
    return (
      <aside
        className="hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm xl:block"
        data-discussions-desktop-context=""
      />
    );
  }

  const profileHref = discussionAuthorProfileHref(thread);
  const locationLabel = thread.neighborhood_summary?.display_name ?? thread.city ?? city;

  return (
    <aside
      className="hidden space-y-4 rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm xl:block"
      data-discussions-desktop-context=""
    >
      <div className="text-center">
        {thread.author.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thread.author.logo_url}
            alt=""
            className="mx-auto size-20 rounded-full object-cover"
          />
        ) : (
          <span className="mx-auto flex size-20 items-center justify-center rounded-full bg-[#EEF0FF] text-xl font-bold text-yunicity-primary">
            {thread.author.display_name.slice(0, 2).toUpperCase()}
          </span>
        )}
        <h2 className="mt-3 text-base font-bold text-neutral-900">{thread.author.display_name}</h2>
        <p className="mt-1 inline-flex rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-800">
          {DISCUSSIONS_DESKTOP_YUNICIZEN_BADGE}
        </p>
        <p className="mt-2 text-sm text-neutral-500">{locationLabel}</p>
        <Link
          href={profileHref}
          className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-yunicity-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-95"
        >
          {DISCUSSIONS_DESKTOP_VIEW_PROFILE}
        </Link>
      </div>

      <section>
        <h3 className="text-sm font-bold text-neutral-900">{DISCUSSIONS_DESKTOP_CONTEXT_TITLE}</h3>
        <ul className="mt-3 space-y-1">
          <li>
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
            >
              <Search className="h-4 w-4 text-neutral-400" aria-hidden />
              {DISCUSSIONS_DESKTOP_SEARCH_IN_THREAD}
            </button>
          </li>
          <li>
            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl px-2 py-2.5 transition hover:bg-neutral-50">
              <span className="inline-flex items-center gap-3 text-sm font-medium text-neutral-700">
                <VolumeX className="h-4 w-4 text-neutral-400" aria-hidden />
                {DISCUSSIONS_DESKTOP_MUTE}
              </span>
              <input
                type="checkbox"
                checked={muted}
                onChange={(event) => setMuted(event.target.checked)}
                className="h-4 w-4 accent-yunicity-primary"
              />
            </label>
          </li>
          <li>
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
            >
              <Link2 className="h-4 w-4 text-neutral-400" aria-hidden />
              {DISCUSSIONS_DESKTOP_MEDIA}
            </button>
          </li>
        </ul>
      </section>

      <section>
        <h3 className="text-sm font-bold text-neutral-900">{DISCUSSIONS_DESKTOP_COMMON_TITLE}</h3>
        <ul className="mt-3 space-y-2 text-sm text-neutral-700">
          <li className="inline-flex items-center gap-2">
            <MapPin className="h-4 w-4 text-neutral-400" aria-hidden />
            {locationLabel}
          </li>
          {thread.linked_tribe_name ? (
            <li className="inline-flex items-center gap-2">
              <Users className="h-4 w-4 text-neutral-400" aria-hidden />
              {thread.linked_tribe_name}
            </li>
          ) : null}
        </ul>
      </section>

      <section>
        <h3 className="text-sm font-bold text-neutral-900">{DISCUSSIONS_DESKTOP_SECURITY_TITLE}</h3>
        <ul className="mt-3 space-y-1">
          <li>
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
            >
              <Shield className="h-4 w-4 text-neutral-400" aria-hidden />
              {DISCUSSIONS_DESKTOP_BLOCK}
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={onReport}
              className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
            >
              <Flag className="h-4 w-4 text-neutral-400" aria-hidden />
              {DISCUSSIONS_DESKTOP_REPORT}
            </button>
            <p className="px-2 text-xs text-neutral-400">{DISCUSSIONS_DESKTOP_REPORT_HINT}</p>
          </li>
        </ul>
      </section>
    </aside>
  );
}
