"use client";

import type { LocalVideoFeedItem } from "@yunicity/types";
import {
  LOCAL_VIDEO_PROCESSING_FAILED_TITLE,
  LOCAL_VIDEO_PROCESSING_FEED_HINT,
  LOCAL_VIDEO_PROCESSING_FEED_TITLE,
  LOCAL_VIDEO_PROCESSING_PUBLISHED_HINT,
  LOCAL_VIDEO_PROCESSING_PUBLISHED_TITLE,
  LOCAL_VIDEO_PROCESSING_RETRY_CTA,
  isLocalVideoFeedItemPlayable,
} from "@yunicity/utils";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";

type LocalVideoProcessingSlideProps = {
  item: LocalVideoFeedItem;
  errorMessage?: string | null;
  onDismiss?: () => void;
};

export function LocalVideoProcessingSlide({
  item,
  errorMessage,
  onDismiss,
}: LocalVideoProcessingSlideProps) {
  const isFailed = Boolean(errorMessage) || item.status === "failed";
  const isPublished = !isFailed && isLocalVideoFeedItemPlayable(item);

  return (
    <article
      data-video-slide-id={item.id}
      className="relative flex h-[100dvh] w-full snap-start snap-always flex-col items-center justify-center bg-neutral-950 px-6 text-center md:h-[calc(100dvh-6rem)] md:rounded-2xl"
    >
      <div className="max-w-md rounded-2xl border border-white/10 bg-neutral-900/80 p-8 shadow-lg backdrop-blur-sm">
        {isFailed ? (
          <AlertCircle className="mx-auto h-10 w-10 text-red-400" aria-hidden />
        ) : isPublished ? (
          <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400" aria-hidden />
        ) : (
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-yunicity-primary" aria-hidden />
        )}

        <h2 className="mt-4 text-lg font-semibold text-white">
          {isFailed
            ? LOCAL_VIDEO_PROCESSING_FAILED_TITLE
            : isPublished
              ? LOCAL_VIDEO_PROCESSING_PUBLISHED_TITLE
              : LOCAL_VIDEO_PROCESSING_FEED_TITLE}
        </h2>

        {item.title ? (
          <p className="mt-2 text-sm font-medium text-neutral-200">{item.title}</p>
        ) : null}

        {isFailed && errorMessage ? (
          <p className="mt-3 text-sm text-red-200" role="alert">
            {errorMessage}
          </p>
        ) : (
          <p className="mt-3 text-sm leading-relaxed text-neutral-300">
            {isPublished ? LOCAL_VIDEO_PROCESSING_PUBLISHED_HINT : LOCAL_VIDEO_PROCESSING_FEED_HINT}
          </p>
        )}

        {isFailed ? (
          <div className="mt-6 flex flex-col gap-3">
            <Link
              href="/videos/new"
              className="inline-flex items-center justify-center rounded-full bg-yunicity-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-yunicity-primary-hover"
            >
              {LOCAL_VIDEO_PROCESSING_RETRY_CTA}
            </Link>
            {onDismiss ? (
              <button
                type="button"
                onClick={onDismiss}
                className="text-sm font-medium text-neutral-400 hover:text-neutral-200"
              >
                Fermer
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}
