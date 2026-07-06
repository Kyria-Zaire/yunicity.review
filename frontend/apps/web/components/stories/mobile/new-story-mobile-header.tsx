"use client";

import {
  STORIES_MOBILE_NEW_BACK,
  STORIES_MOBILE_NEW_PUBLISH,
  STORIES_MOBILE_NEW_TITLE,
  STORIES_NEW_PUBLISHING,
} from "@yunicity/utils";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

type NewStoryMobileHeaderProps = {
  submitting: boolean;
  canPublish: boolean;
  onPublish: () => void;
};

/** Header mobile « Partager une story » (MOBILE-NEW-STORY-01). */
export function NewStoryMobileHeader({
  submitting,
  canPublish,
  onPublish,
}: NewStoryMobileHeaderProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-[var(--z-chrome)] border-b border-neutral-200/80 bg-white pt-[env(safe-area-inset-top)]">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-neutral-800 transition hover:bg-neutral-100"
          aria-label={STORIES_MOBILE_NEW_BACK}
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2} aria-hidden />
        </button>

        <h1 className="min-w-0 flex-1 truncate text-center text-base font-bold text-neutral-900">
          {STORIES_MOBILE_NEW_TITLE}
        </h1>

        <button
          type="button"
          onClick={onPublish}
          disabled={!canPublish || submitting}
          className="shrink-0 rounded-full bg-yunicity-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-yunicity-primary/90 disabled:opacity-50"
        >
          {submitting ? STORIES_NEW_PUBLISHING : STORIES_MOBILE_NEW_PUBLISH}
        </button>
      </div>
    </header>
  );
}
