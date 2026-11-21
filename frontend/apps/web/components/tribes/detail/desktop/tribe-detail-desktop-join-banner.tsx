"use client";

import {
  TRIBE_DETAIL_DESKTOP_JOIN_BANNER_BODY,
  TRIBE_DETAIL_DESKTOP_JOIN_BANNER_TITLE,
  TRIBE_DETAIL_DESKTOP_JOIN_SHORT,
  TRIBE_DETAIL_DESKTOP_READ_CHARTER,
} from "@yunicity/utils";
import { Users } from "lucide-react";

type TribeDetailDesktopJoinBannerProps = {
  onJoinClick: () => void;
  onReadCharter: () => void;
};

export function TribeDetailDesktopJoinBanner({
  onJoinClick,
  onReadCharter,
}: TribeDetailDesktopJoinBannerProps) {
  return (
    <section
      className="rounded-2xl border border-sky-100 bg-sky-50 p-5"
      data-tribe-detail-join-banner=""
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
            <Users className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-neutral-900">{TRIBE_DETAIL_DESKTOP_JOIN_BANNER_TITLE}</h2>
            <p className="mt-1 text-sm leading-relaxed text-neutral-600">
              {TRIBE_DETAIL_DESKTOP_JOIN_BANNER_BODY}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onJoinClick}
            className="inline-flex min-h-10 items-center justify-center rounded-xl bg-yunicity-primary px-5 text-sm font-semibold text-white transition hover:bg-yunicity-primary-hover"
          >
            {TRIBE_DETAIL_DESKTOP_JOIN_SHORT}
          </button>
          <button
            type="button"
            onClick={onReadCharter}
            className="text-sm font-semibold text-yunicity-primary hover:underline"
          >
            {TRIBE_DETAIL_DESKTOP_READ_CHARTER}
          </button>
        </div>
      </div>
    </section>
  );
}
