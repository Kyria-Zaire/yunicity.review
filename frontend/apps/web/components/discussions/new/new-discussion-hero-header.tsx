"use client";

import {
  DISCUSSION_NEW_MOBILE_BACK,
  DISCUSSION_NEW_PAGE_SUBTITLE,
  DISCUSSION_NEW_PAGE_TITLE,
} from "@yunicity/utils";
import { ArrowLeft, MessageCircle } from "lucide-react";

export type NewDiscussionHeroHeaderVariant = "medium" | "desktop";

type NewDiscussionHeroHeaderProps = {
  variant: NewDiscussionHeroHeaderVariant;
  onBack: () => void;
};

export function NewDiscussionHeroHeader({ variant, onBack }: NewDiscussionHeroHeaderProps) {
  const isDesktop = variant === "desktop";

  return (
    <header
      className={`flex items-start gap-3 ${isDesktop ? "mb-6" : "mb-5"}`}
      data-discussion-new-hero-header=""
      data-discussion-new-hero-variant={variant}
    >
      <button
        type="button"
        onClick={onBack}
        aria-label={DISCUSSION_NEW_MOBILE_BACK}
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-yunicity-primary transition hover:bg-[#EEF0FF] focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary focus-visible:ring-offset-2"
      >
        <ArrowLeft className="h-5 w-5 shrink-0" aria-hidden />
      </button>

      <span
        className={`flex shrink-0 items-center justify-center rounded-2xl bg-[#EEF0FF] text-yunicity-primary ${
          isDesktop ? "h-11 w-11" : "h-10 w-10"
        }`}
      >
        <MessageCircle className={isDesktop ? "h-6 w-6" : "h-5 w-5"} aria-hidden />
      </span>

      <div className="min-w-0 pt-0.5">
        <h1
          className={`font-bold tracking-tight text-neutral-900 ${
            isDesktop ? "text-2xl lg:text-3xl" : "text-xl"
          }`}
        >
          {DISCUSSION_NEW_PAGE_TITLE}
        </h1>
        <p
          className={`mt-1 leading-relaxed text-neutral-600 ${
            isDesktop ? "text-sm sm:text-base" : "text-sm"
          }`}
        >
          {DISCUSSION_NEW_PAGE_SUBTITLE}
        </p>
      </div>
    </header>
  );
}
