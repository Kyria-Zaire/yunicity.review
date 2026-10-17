"use client";

import {
  TRIBE_DETAIL_MEDIUM_JOIN,
  TRIBE_DETAIL_MEDIUM_JOIN_BANNER_BODY,
  TRIBE_DETAIL_MEDIUM_JOIN_BANNER_TITLE,
  TRIBE_DETAIL_MEDIUM_READ_CHARTER,
} from "@yunicity/utils";
import { Users } from "lucide-react";

type TribeDetailMediumJoinBannerProps = {
  onJoinClick: () => void;
  onReadCharter: () => void;
};

export function TribeDetailMediumJoinBanner({
  onJoinClick,
  onReadCharter,
}: TribeDetailMediumJoinBannerProps) {
  return (
    <section
      className="rounded-2xl border border-sky-100 bg-sky-50 p-4 sm:p-5"
      data-tribe-detail-medium-join-banner=""
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
            <Users className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-neutral-900">{TRIBE_DETAIL_MEDIUM_JOIN_BANNER_TITLE}</h2>
            <p className="mt-1 text-sm leading-relaxed text-neutral-600">
              {TRIBE_DETAIL_MEDIUM_JOIN_BANNER_BODY}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onJoinClick}
            className="inline-flex min-h-10 items-center justify-center rounded-xl bg-yunicity-primary px-5 text-sm font-semibold text-white"
          >
            {TRIBE_DETAIL_MEDIUM_JOIN}
          </button>
          <button
            type="button"
            onClick={onReadCharter}
            className="text-sm font-semibold text-yunicity-primary hover:underline"
          >
            {TRIBE_DETAIL_MEDIUM_READ_CHARTER}
          </button>
        </div>
      </div>
    </section>
  );
}
