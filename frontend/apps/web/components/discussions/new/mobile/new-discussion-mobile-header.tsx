"use client";

import {
  DISCUSSION_NEW_MOBILE_BACK,
  DISCUSSION_NEW_PAGE_TITLE,
} from "@yunicity/utils";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

type NewDiscussionMobileHeaderProps = {
  progressPercent: number;
};

export function NewDiscussionMobileHeader({ progressPercent }: NewDiscussionMobileHeaderProps) {
  const router = useRouter();

  return (
    <header
      className="sticky top-0 z-[var(--z-chrome)] border-b border-neutral-200/90 bg-white pt-[env(safe-area-inset-top)]"
      data-discussion-new-mobile-header=""
    >
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button
          type="button"
          onClick={() => router.push("/discussions")}
          className="inline-flex min-h-10 items-center gap-1 rounded-lg text-sm font-semibold text-yunicity-primary transition hover:bg-[#EEF0FF]"
          aria-label={DISCUSSION_NEW_MOBILE_BACK}
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          <span className="truncate">{DISCUSSION_NEW_PAGE_TITLE}</span>
        </button>
      </div>
      <div className="h-1 bg-neutral-100">
        <div
          className="h-full bg-yunicity-primary transition-[width] duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </header>
  );
}
